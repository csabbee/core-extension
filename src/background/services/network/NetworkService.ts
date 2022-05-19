import { isMainnetNetwork } from '@avalabs/avalanche-wallet-sdk';
import { networkUpdates$ } from '@avalabs/wallet-react-components';
import { EventEmitter } from 'events';
import { singleton } from 'tsyringe';
import {
  OnLock,
  OnStorageReady,
} from '@src/background/runtime/lifecycleCallbacks';
import { StorageService } from '../storage/StorageService';
import {
  isCustomNetwork,
  NetworkEvents,
  NETWORK_STORAGE_KEY,
  supportedNetworks,
  ActiveNetwork,
  NetworkTypes,
  MAINNET_NETWORK,
  NetworkVM,
  BITCOIN_NETWORK,
} from './models';
import {
  BlockCypherProvider,
  JsonRpcBatchInternal,
} from '@avalabs/wallets-sdk';

@singleton()
export class NetworkService implements OnLock, OnStorageReady {
  private eventEmitter = new EventEmitter();

  private _activeNetwork?: ActiveNetwork;

  public get activeNetwork(): ActiveNetwork | undefined {
    return this._activeNetwork;
  }

  public get activeProvider():
    | BlockCypherProvider
    | JsonRpcBatchInternal
    | null {
    if (!this._activeNetwork) {
      return null;
    }
    return this.getProviderForNetwork(this._activeNetwork);
  }

  public get isMainnet(): boolean {
    return this._activeNetwork?.config
      ? isMainnetNetwork(this._activeNetwork.config)
      : false;
  }

  constructor(private storageService: StorageService) {}

  onLock(): void {
    this._activeNetwork = undefined;
  }

  onStorageReady(): void {
    this.init();
  }

  async init() {
    const network = await this.storageService.load<ActiveNetwork>(
      NETWORK_STORAGE_KEY
    );
    this._activeNetwork = network || MAINNET_NETWORK;

    networkUpdates$.next(this._activeNetwork);
    this.eventEmitter.emit(
      NetworkEvents.NETWORK_UPDATE_EVENT,
      this._activeNetwork
    );
  }

  async setNetwork(networkName: string) {
    const selectedNetwork = supportedNetworks.get(networkName);
    if (!selectedNetwork) {
      throw new Error('selected network not supported');
    }

    this._activeNetwork = selectedNetwork;

    this.storageService.save(NETWORK_STORAGE_KEY, this.activeNetwork);
    this.eventEmitter.emit(
      NetworkEvents.NETWORK_UPDATE_EVENT,
      this.activeNetwork
    );
    networkUpdates$.next(this._activeNetwork);
  }

  getProviderForNetwork(
    network: NetworkTypes & { vm: NetworkVM.BITCOIN },
    numberOfRequestsPerBatch?: number
  ): BlockCypherProvider;
  getProviderForNetwork(
    network: NetworkTypes & { vm: NetworkVM.EVM },
    numberOfRequestsPerBatch?: number
  ): JsonRpcBatchInternal;
  getProviderForNetwork(
    network: NetworkTypes,
    numberOfRequestsPerBatch?: number
  ): BlockCypherProvider | JsonRpcBatchInternal;
  getProviderForNetwork(network: NetworkTypes, numberOfRequestsPerBatch = 40) {
    if (network.vm === NetworkVM.BITCOIN) {
      const isMainnet = network.name === BITCOIN_NETWORK.name;
      return new BlockCypherProvider(isMainnet);
    } else if (network.vm === NetworkVM.EVM) {
      return new JsonRpcBatchInternal(
        numberOfRequestsPerBatch,
        isCustomNetwork(network) ? network.rpcUrl : network.config.rpcUrl.c,
        network.chainId
      );
    } else {
      throw new Error('unsupported network');
    }
  }

  async sendTransaction(signedTx: string): Promise<string> {
    if (!this.activeNetwork) {
      throw new Error('No active network');
    }
    const provider = this.getProviderForNetwork(this.activeNetwork);
    if (provider instanceof JsonRpcBatchInternal) {
      return (await provider.sendTransaction(signedTx)).hash;
    }

    if (provider instanceof BlockCypherProvider) {
      return (await provider.issueRawTx(signedTx)).hash;
    }

    throw new Error('No provider found');
  }

  addListener(event: NetworkEvents, callback: (data: unknown) => void) {
    this.eventEmitter.on(event, callback);
  }
  removeListener(event: NetworkEvents, callback: (data: unknown) => void) {
    this.eventEmitter.off(event, callback);
  }
}
