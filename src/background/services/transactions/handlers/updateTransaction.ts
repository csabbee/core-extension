import {
  ConnectionRequestHandler,
  ExtensionConnectionMessage,
  ExtensionRequest,
} from '@src/background/connections/models';
import { filter, firstValueFrom, map, OperatorFunction } from 'rxjs';
import {
  isTxFinalizedUpdate,
  isTxParamsUpdate,
  isTxStatusUpdate,
  Transaction,
  TxStatus,
} from '../models';
import {
  pendingTransactions$,
  transactions$,
  updateTransaction,
} from '../transactions';

export async function updateTransactionById(
  request: ExtensionConnectionMessage
) {
  const params = request.params;
  if (!params) {
    return {
      ...request,
      error: 'no params on request',
    };
  }

  const update = params[0];

  if (!update) {
    return {
      ...request,
      error: 'no updates found in params',
    };
  }

  const isKnownTxType = [
    isTxStatusUpdate(update),
    isTxFinalizedUpdate(update),
    isTxParamsUpdate(update),
  ].some((isKnown) => isKnown);

  if (!isKnownTxType) {
    return {
      ...request,
      error: 'malformed or unsupported update',
    };
  }

  updateTransaction.next(update);

  const currentPendingTransactions = await firstValueFrom(pendingTransactions$);
  const pendingTx = currentPendingTransactions[update.id];

  if (update.status === TxStatus.SUBMITTING) {
    /**
     * If we are updating submit then we need to wait for the tx to be put into the
     * doen state before we update the requester
     */
    return await firstValueFrom(
      transactions$.pipe(
        map((txs) => {
          return txs.find((tx) => tx.id === update.id);
        }),
        filter((tx) => tx !== undefined) as OperatorFunction<any, Transaction>,
        map((tx) => {
          return tx.txHash
            ? {
                ...request,
                result: tx,
              }
            : {
                ...request,
                error: tx.error,
              };
        })
      )
    );
  }

  return {
    ...request,
    result: pendingTx,
  };
}

export const UpdateTransactionByIdRequest: [
  ExtensionRequest,
  ConnectionRequestHandler
] = [ExtensionRequest.TRANSACTIONS_UPDATE, updateTransactionById];
