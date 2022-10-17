import { isBech32AddressInNetwork } from '@avalabs/bridge-sdk';
import { ChainId } from '@avalabs/chains-sdk';
import {
  BitcoinInputUTXO,
  BitcoinOutputUTXO,
  createTransferTx,
  getMaxTransferAmount as getMaxTransferAmountBTC,
} from '@avalabs/wallets-sdk';
import BN from 'bn.js';
import { singleton } from 'tsyringe';
import { AccountsService } from '../accounts/AccountsService';
import { BalanceAggregatorService } from '../balances/BalanceAggregatorService';
import { NetworkService } from '../network/NetworkService';
import {
  SendErrorMessage,
  SendServiceHelper,
  SendState,
  ValidSendState,
} from './models';

@singleton()
export class SendServiceBTC implements SendServiceHelper {
  constructor(
    private accountsService: AccountsService,
    private networkService: NetworkService,
    private networkBalancesService: BalanceAggregatorService
  ) {}

  async getTransactionRequest(sendState: ValidSendState): Promise<{
    inputs: BitcoinInputUTXO[];
    outputs: BitcoinOutputUTXO[];
  }> {
    const { address: toAddress, amount } = sendState;
    const feeRate = sendState.gasPrice.toNumber();
    const provider = await this.networkService.getBitcoinProvider();
    const { utxos } = await this.getBalance();

    const { inputs, outputs } = createTransferTx(
      toAddress,
      this.address,
      amount.toNumber(),
      feeRate,
      utxos,
      provider.getNetwork()
    );

    if (!inputs || !outputs) {
      throw new Error('Unable to create transaction');
    }

    return { inputs, outputs };
  }

  async validateStateAndCalculateFees(
    sendState: SendState
  ): Promise<SendState | ValidSendState> {
    const { amount, address: toAddress } = sendState;
    const feeRate = sendState.gasPrice?.toNumber();
    const amountInSatoshis = amount?.toNumber() || 0;
    const { utxos } = await this.getBalance();
    const provider = await this.networkService.getBitcoinProvider();

    // We can't do much until fee rate is given.
    if (!feeRate)
      return this.getErrorState(
        {
          ...sendState,
          loading: true,
        },
        SendErrorMessage.INVALID_NETWORK_FEE
      );

    // Estimate max send amount based on UTXOs and fee rate
    // Since we are only using bech32 addresses we can use this.address to estimate
    const maxAmount = new BN(
      Math.max(
        getMaxTransferAmountBTC(utxos, this.address, this.address, feeRate),
        0
      )
    );

    if (!toAddress)
      return this.getErrorState(
        {
          ...sendState,
          maxAmount,
          loading: false,
        },
        SendErrorMessage.ADDRESS_REQUIRED
      );

    // Validate the destination address
    const isMainnet = await this.networkService.isMainnet();
    const isAddressValid = isBech32AddressInNetwork(toAddress, isMainnet);

    if (!isAddressValid)
      return this.getErrorState(
        { ...sendState, loading: false, canSubmit: false, maxAmount },
        SendErrorMessage.INVALID_ADDRESS
      );

    // Try to construct the actual transaction
    const { fee, psbt } = createTransferTx(
      toAddress,
      this.address,
      amountInSatoshis,
      feeRate,
      utxos,
      provider.getNetwork()
    );

    const newState: SendState = {
      ...sendState,
      canSubmit: !!psbt,
      loading: false,
      error: undefined,
      maxAmount,
      sendFee: new BN(fee),
    };

    if (!amountInSatoshis)
      return this.getErrorState(newState, SendErrorMessage.AMOUNT_REQUIRED);

    if (!psbt && amountInSatoshis > 0)
      return this.getErrorState(
        newState,
        SendErrorMessage.INSUFFICIENT_BALANCE
      );

    return newState;
  }

  private get address() {
    if (!this.accountsService.activeAccount)
      throw new Error('no active account');
    return this.accountsService.activeAccount.addressBTC;
  }

  private async getBalance(): Promise<{
    balance: number;
    utxos: BitcoinInputUTXO[];
  }> {
    const token =
      this.networkBalancesService.balances[
        (await this.networkService.isMainnet())
          ? ChainId.BITCOIN
          : ChainId.BITCOIN_TESTNET
      ]?.[this.address]?.['BTC'];

    return {
      balance: token?.balance.toNumber() || 0,
      utxos: token?.utxos || [],
    };
  }

  private getErrorState(sendState: SendState, errorMessage: string): SendState {
    return {
      ...sendState,
      error: { error: true, message: errorMessage },
      canSubmit: false,
    };
  }
}
