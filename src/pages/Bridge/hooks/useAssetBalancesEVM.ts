import {
  Asset,
  Blockchain,
  EthereumAssets,
  useBridgeSDK,
  useGetTokenSymbolOnNetwork,
} from '@avalabs/bridge-sdk';
import { getBalances } from '../utils/getBalances';
import { AssetBalance } from '../models';
import { useMemo } from 'react';
import { useFeatureFlagContext } from '@src/contexts/FeatureFlagsProvider';
import { useTokensWithBalances } from '@src/hooks/useTokensWithBalances';
import { FeatureGates } from '@src/background/services/featureFlags/models';
import { useAccountsContext } from '@src/contexts/AccountsProvider';
import { AccountType } from '@src/background/services/accounts/models';

/**
 * Get for the current chain.
 * Get a list of bridge supported assets with the balances of the current blockchain.
 * The list is sorted by balance.
 */
export function useAssetBalancesEVM(
  chain: Blockchain.AVALANCHE | Blockchain.ETHEREUM,
  asset?: Asset
): {
  assetsWithBalances: AssetBalance[];
} {
  const { featureFlags } = useFeatureFlagContext();
  const {
    accounts: { active: activeAccount },
  } = useAccountsContext();

  const { avalancheAssets, ethereumAssets, currentBlockchain } = useBridgeSDK();

  const { getTokenSymbolOnNetwork } = useGetTokenSymbolOnNetwork();

  const tokens = useTokensWithBalances(true);

  // For balances on the Avalanche side, for all bridge assets on avalanche
  const balances = useMemo(() => {
    const isAvalanche =
      chain === Blockchain.AVALANCHE ||
      currentBlockchain === Blockchain.AVALANCHE;
    const isEthereum =
      chain === Blockchain.ETHEREUM ||
      currentBlockchain === Blockchain.ETHEREUM;
    if (!isAvalanche && !isEthereum) {
      return [];
    }

    // do not allow BUSD.e onboardings
    const filteredEthereumAssets: EthereumAssets = Object.keys(ethereumAssets)
      .filter((key) => ethereumAssets[key]?.symbol !== 'BUSD')
      .reduce((obj, key) => {
        obj[key] = ethereumAssets[key];
        return obj;
      }, {});

    const assets = asset
      ? { [asset.symbol]: asset }
      : isAvalanche
      ? avalancheAssets
      : filteredEthereumAssets;

    // filter out assets for networks not available
    const availableAssets = Object.values(assets).filter(
      ({ nativeNetwork }: Asset) => {
        if (chain === Blockchain.AVALANCHE) {
          if (
            nativeNetwork === Blockchain.ETHEREUM &&
            !featureFlags[FeatureGates.BRIDGE_ETH]
          ) {
            // ETH is not available filter ETH tokens out
            return false;
          }
          if (nativeNetwork === Blockchain.BITCOIN) {
            // Filter out BTC tokens if BTC bridge is not available, or
            // the active account was imported via WalletConnect (the BTC address is unknown).

            const isBtcSupportedByActiveAccount =
              activeAccount?.addressBTC &&
              activeAccount?.type !== AccountType.WALLET_CONNECT;

            return (
              featureFlags[FeatureGates.BRIDGE_BTC] &&
              isBtcSupportedByActiveAccount
            );
          }
        }

        // no further filtering is needed since it's not possible to bridge between eth and btc
        return true;
      }
    );

    return getBalances(availableAssets, tokens).map((token) => {
      return {
        ...token,
        symbolOnNetwork: getTokenSymbolOnNetwork(token.symbol, chain),
      };
    });
  }, [
    chain,
    currentBlockchain,
    asset,
    avalancheAssets,
    ethereumAssets,
    tokens,
    featureFlags,
    getTokenSymbolOnNetwork,
    activeAccount?.type,
    activeAccount?.addressBTC,
  ]);

  const assetsWithBalances = balances.sort(
    (asset1, asset2) => asset2.balance?.cmp(asset1.balance || 0) || 0
  );

  return { assetsWithBalances };
}
