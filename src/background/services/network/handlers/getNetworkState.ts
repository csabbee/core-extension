import { Network, ChainList } from '@avalabs/chains-sdk';
import { ExtensionRequest } from '@src/background/connections/extensionConnection/models';
import { ExtensionRequestHandler } from '@src/background/connections/models';
import { resolve } from '@src/utils/promiseResolver';
import { injectable } from 'tsyringe';
import { NetworkService } from '../NetworkService';

type HandlerType = ExtensionRequestHandler<
  ExtensionRequest.NETWORKS_GET_STATE,
  {
    networks: Network[];
    network?: Network;
    isDeveloperMode: boolean;
    favoriteNetworks: number[];
    customNetworks: number[];
  }
>;

@injectable()
export class GetNetworksStateHandler implements HandlerType {
  method = ExtensionRequest.NETWORKS_GET_STATE as const;

  constructor(private networkService: NetworkService) {}
  handle: HandlerType['handle'] = async (request) => {
    const [networks, err] = await resolve<ChainList>(
      this.networkService.activeNetworks.promisify()
    );

    if (err) {
      return {
        ...request,
        error: err.toString(),
      };
    }

    const networkList = Object.values<Network>(networks).sort((a, b) =>
      a.chainName.localeCompare(b.chainName)
    );

    const network = await this.networkService.activeNetwork.promisify();

    const isDeveloperMode = this.networkService.isDeveloperMode;

    const favoriteNetworks = this.networkService.favoriteNetworks;

    const customNetworks = Object.values(
      this.networkService.customNetworks
    ).map((network) => network.chainId);

    return {
      ...request,
      result: {
        networks: networkList,
        network,
        isDeveloperMode,
        favoriteNetworks,
        customNetworks,
      },
    };
  };
}