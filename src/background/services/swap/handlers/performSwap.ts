import { Big } from '@avalabs/avalanche-wallet-sdk';
import { AVAX_TOKEN } from '@avalabs/wallet-react-components';
import { ExtensionRequest } from '@src/background/connections/extensionConnection/models';
import {
  ExtensionConnectionMessage,
  ExtensionConnectionMessageResponse,
  ExtensionRequestHandler,
} from '@src/background/connections/models';
import { resolve } from '@src/utils/promiseResolver';
import { BigNumber, ethers } from 'ethers';
import { APIError, ETHER_ADDRESS } from 'paraswap';
import { OptimalRate } from 'paraswap-core';
import { getAvalancheProvider } from '../../network/getAvalancheProvider';
import { NetworkService } from '../../network/NetworkService';
import { WalletService } from '../../wallet/WalletService';
import { SwapService } from '../SwapService';
import ERC20_ABI from 'human-standard-token-abi';
import { incrementalPromiseResolve } from '@src/utils/incrementalPromiseResolve';
import { hexToBN } from '@avalabs/utils-sdk';
import { BN } from 'bn.js';
import { NetworkFeeService } from '../../networkFee/NetworkFeeService';
import { injectable } from 'tsyringe';

@injectable()
export class PerformSwapHandler implements ExtensionRequestHandler {
  methods = [ExtensionRequest.SWAP_PERFORM];

  constructor(
    private swapService: SwapService,
    private networkService: NetworkService,
    private walletService: WalletService,
    private networkFeeService: NetworkFeeService
  ) {}
  handle = async (
    request: ExtensionConnectionMessage
  ): Promise<ExtensionConnectionMessageResponse> => {
    const [
      srcToken,
      destToken,
      srcDecimals,
      destDecimals,
      srcAmount,
      priceRoute,
      destAmount,
      gasLimit,
      gasPrice,
      slippage,
    ] = request.params || [];

    if (!srcToken) {
      return {
        ...request,
        error: 'no source token on request',
      };
    }

    if (!destToken) {
      return {
        ...request,
        error: 'no destination token on request',
      };
    }

    if (!srcAmount) {
      return {
        ...request,
        error: 'no amount on request',
      };
    }

    if (!srcDecimals) {
      return {
        ...request,
        error: 'request requires the decimals for source token',
      };
    }

    if (!destDecimals) {
      return {
        ...request,
        error: 'request requires the decimals for destination token',
      };
    }

    if (!destAmount) {
      return {
        ...request,
        error: 'request requires a destAmount expected for destination token',
      };
    }

    if (!priceRoute) {
      return {
        ...request,
        error: 'request requires the paraswap priceRoute',
      };
    }

    if (!gasLimit) {
      return {
        ...request,
        error: 'request requires gas limit from paraswap response',
      };
    }

    const srcTokenAddress =
      srcToken === AVAX_TOKEN.symbol ? ETHER_ADDRESS : srcToken;
    const destTokenAddress =
      destToken === AVAX_TOKEN.symbol ? ETHER_ADDRESS : destToken;
    const defaultGasPrice = await this.networkFeeService.getNetworkFee();

    if (!this.networkService.activeNetwork || !this.networkService.isMainnet) {
      return {
        ...request,
        error: `Network Init Error: Wrong network`,
      };
    }

    if (!this.walletService.walletState?.addresses.addrC) {
      return {
        ...request,
        error: `Wallet Error: address not defined`,
      };
    }

    const buildOptions = undefined,
      partnerAddress = undefined,
      partner = 'Avalanche',
      userAddress = this.walletService.walletState.addresses.addrC,
      receiver = undefined,
      permit = undefined,
      deadline = undefined,
      partnerFeeBps = undefined;

    const spender = await this.swapService.getParaswapSpender();

    let approveTxHash;

    const minAmount = new Big(priceRoute.destAmount)
      .times(1 - slippage / 100)
      .toFixed(0);

    const maxAmount = new Big(srcAmount).times(1 + slippage / 100).toFixed(0);

    //TODO: it may fail when we want to swap erc20 tokens -> investigate
    const sourceAmount = priceRoute.side === 'SELL' ? srcAmount : maxAmount;

    const destinationAmount =
      priceRoute.side === 'SELL' ? minAmount : priceRoute.destAmount;

    const provider = getAvalancheProvider(this.networkService.activeNetwork);
    // no need to approve AVAX
    if (srcToken !== AVAX_TOKEN.symbol) {
      const contract = new ethers.Contract(
        srcTokenAddress,
        ERC20_ABI,
        provider
      );

      const [allowance, allowanceError] = await resolve(
        contract.allowance(userAddress, spender)
      );

      if (allowanceError) {
        return {
          ...request,
          error: `Allowance Error: ${allowanceError}`,
        };
      }

      if ((allowance as BigNumber).lt(sourceAmount)) {
        const [approveGasLimit] = await resolve(
          contract.estimateGas.approve(spender, sourceAmount)
        );

        const [approveHash, approveError] = await resolve(
          /**
           * We may need to check if the allowance is enough to cover what is trying to be sent?
           */
          (allowance as BigNumber).gte(sourceAmount)
            ? (Promise.resolve([]) as any)
            : this.walletService.sendCustomTx(
                defaultGasPrice.bn,
                approveGasLimit ? approveGasLimit.toNumber() : Number(gasLimit),
                (
                  await contract.populateTransaction.approve(
                    spender,
                    sourceAmount
                  )
                ).data,
                srcTokenAddress
              )
        );

        if (approveError) {
          return {
            ...request,
            error: `Approve Error: ${approveError}`,
          };
        }

        approveTxHash = approveHash;
      }
    }

    const txData = this.swapService.buildTx(
      '43114',
      srcTokenAddress,
      destTokenAddress,
      sourceAmount,
      destinationAmount,
      priceRoute,
      userAddress,
      partner,
      partnerAddress,
      partnerFeeBps,
      receiver,
      buildOptions,
      AVAX_TOKEN.symbol === srcToken ? 18 : srcDecimals,
      AVAX_TOKEN.symbol === destToken ? 18 : destDecimals,
      permit,
      deadline
    );

    function checkForErrorsInResult(result: OptimalRate | APIError) {
      return (result as APIError).message === 'Server too busy';
    }

    const [txBuildData, txBuildDataError] = await resolve(
      incrementalPromiseResolve(() => txData, checkForErrorsInResult)
    );

    if (txBuildDataError) {
      return {
        ...request,
        error: `Data Error: ${txBuildDataError}`,
      };
    }

    const [swapTxHash, txError] = await resolve(
      this.walletService.sendCustomTx(
        gasPrice.bn ? hexToBN(gasPrice.bn) : defaultGasPrice.bn,
        Number(txBuildData.gas),
        txBuildData.data,
        txBuildData.to,
        srcToken === AVAX_TOKEN.symbol
          ? `0x${new BN(sourceAmount).toString('hex')}`
          : undefined // AVAX value needs to be sent with the transaction
      )
    );

    if (txError) {
      return {
        ...request,
        error: `Tx Error: ${txError}`,
      };
    }

    return {
      ...request,
      result: {
        swapTxHash,
        approveTxHash,
      },
    };
  };
}
