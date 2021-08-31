import { combineLatest, map } from 'rxjs';
import { network$ } from '../../network/network';
import { getAccountsFromWallet } from '../../wallet/utils/getAccountsFromWallet';
import { walletInitializedFilter } from '../../wallet/utils/walletInitializedFilter';
import { wallet$ } from '../../wallet/wallet';
import { Web3Event } from './models';

export function accountsChangedEvents() {
  return combineLatest([
    wallet$.pipe(walletInitializedFilter()),
    network$,
  ]).pipe(
    map(([wallet]) => {
      return {
        accounts: getAccountsFromWallet(wallet),
      };
    }),
    map((params) => ({
      method: Web3Event.ACCOUNTS_CHANGED,
      params,
    }))
  );
}