import {
  Network,
  NetworkContractToken,
  NetworkVMType,
} from '@avalabs/chains-sdk';
import { ethers } from 'ethers';
import { singleton } from 'tsyringe';
import { NetworkService } from '../network/NetworkService';
import { SettingsService } from '../settings/SettingsService';
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json';
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk';
import xss from 'xss';

@singleton()
export class TokenManagerService {
  constructor(
    private settingsService: SettingsService,
    private networkService: NetworkService
  ) {}

  async getTokensForNetwork(network: Network): Promise<NetworkContractToken[]> {
    const settings = await this.settingsService.getSettings();
    return Object.values(settings.customTokens[network.chainId] || {}) || [];
  }

  async getTokenData(
    tokenAddress: string
  ): Promise<NetworkContractToken | null> {
    const activeNetwork = await this.networkService.activeNetwork.promisify();
    if (!activeNetwork || activeNetwork.vmName !== NetworkVMType.EVM) {
      throw new Error('No network');
    }

    const provider = await this.networkService.getProviderForNetwork(
      activeNetwork
    );
    if (!provider || !(provider instanceof JsonRpcBatchInternal)) {
      throw new Error('No provider');
    }

    const contract = new ethers.Contract(tokenAddress, ERC20.abi, provider);

    const contractCalls = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);
    // Purify the values for XSS protection
    const name = xss(contractCalls[0]);
    const symbol = xss(contractCalls[1]);
    const decimals = parseInt(contractCalls[2]);

    return {
      name,
      symbol,
      decimals,
      address: tokenAddress,
      contractType: 'ERC-20',
      description: '',
    };
  }
}