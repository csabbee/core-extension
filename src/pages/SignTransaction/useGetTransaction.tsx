import { useMemo } from 'react';
import { useState } from 'react';
import { Transaction } from '@src/background/services/transactions/models';
import { useEffect } from 'react';
import { useConnectionContext } from '@src/contexts/ConnectionProvider';
import { filter, map, take } from 'rxjs';
import { ExtensionRequest } from '@src/background/connections/models';
import { gasPriceTransactionUpdateListener } from '@src/background/services/transactions/events/gasPriceTransactionUpdateListener';
import { transactionFinalizedUpdateListener } from '@src/background/services/transactions/events/transactionFinalizedUpdateListener';
import { calculateGasAndFees } from '@src/utils/calculateGasAndFees';
import { useWalletContext } from '@src/contexts/WalletProvider';
import { BN } from '@avalabs/avalanche-wallet-sdk';
import { GasPrice } from '@src/background/services/gas/models';

export function useGetTransaction(requestId: string) {
  const { request, events } = useConnectionContext();
  const { avaxPrice } = useWalletContext();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [hash, setHash] = useState('');

  const setTxWithNewFees = (gasPrice: GasPrice) => {
    if (transaction) {
      const feeDisplayValues = calculateGasAndFees(
        {
          ...gasPrice,
          bn: new BN(gasPrice.bn, 'hex'),
        } as any,
        transaction?.txParams.gas as string,
        avaxPrice
      );

      setTransaction({
        ...transaction,
        displayValues: {
          ...transaction?.displayValues,
          ...feeDisplayValues,
        },
      } as any);
    }
  };

  useEffect(() => {
    request({
      method: ExtensionRequest.TRANSACTIONS_GET,
      params: [requestId],
    }).then((tx) => {
      setTransaction(tx);
    });
  }, []);

  useEffect(() => {
    const subscription = events!()
      .pipe(filter(gasPriceTransactionUpdateListener))
      .subscribe(function (evt) {
        setTxWithNewFees(evt.value);
      });

    const finalizedSubscription = events!()
      .pipe(
        filter(transactionFinalizedUpdateListener),
        map(({ value }) => {
          return value.find((tx) => tx.id === Number(requestId));
        }),
        filter((tx) => !!tx),
        take(1)
      )
      .subscribe({
        next(tx) {
          setHash(tx?.txHash || '');
        },
      });

    return () => {
      subscription.unsubscribe();
      finalizedSubscription.unsubscribe();
    };
  }, [transaction]);

  return useMemo(() => {
    function updateTransaction(update) {
      return request({
        method: ExtensionRequest.TRANSACTIONS_UPDATE,
        params: [update],
      });
    }

    return {
      ...transaction?.displayValues,
      id: transaction?.id,
      txParams: transaction?.txParams,
      updateTransaction,
      hash,
    };
  }, [requestId, transaction, hash]);
}
