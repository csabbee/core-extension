import { DAppRequestHandler } from '@src/background/connections/dAppConnection/DAppRequestHandler';
import { DAppProviderRequest } from '@src/background/connections/dAppConnection/models';
import { DEFERRED_RESPONSE } from '@src/background/connections/middlewares/models';
import { ethErrors } from 'eth-rpc-errors';
import { injectable } from 'tsyringe';
import { Action } from '../../actions/models';
import { NetworkService } from '../../network/NetworkService';
import ensureMessageFormatIsValid from '../../wallet/utils/ensureMessageFormatIsValid';
import { WalletService } from '../../wallet/WalletService';
import { MessageType } from '../models';
import { paramsToMessageParams } from '../utils/messageParamsParser';
import { TypedDataEncoder } from 'ethers';

@injectable()
export class PersonalSignHandler extends DAppRequestHandler {
  methods = [
    MessageType.ETH_SIGN,
    MessageType.SIGN_TYPED_DATA,
    DAppProviderRequest.ETH_SIGN_TYPED_DATA_V1,
    DAppProviderRequest.ETH_SIGN_TYPED_DATA_V3,
    DAppProviderRequest.ETH_SIGN_TYPED_DATA_V4,
    MessageType.PERSONAL_SIGN,
  ];
  constructor(
    private walletService: WalletService,
    private networkService: NetworkService
  ) {
    super();
  }

  handleUnauthenticated = async (request) => {
    return {
      ...request,
      error: `account not available`,
    };
  };

  handleAuthenticated = async (request) => {
    if (!this.walletService.walletType) {
      return {
        ...request,
        error: 'wallet undefined',
      };
    }
    try {
      const activeNetwork = this.networkService.activeNetwork;

      if (!activeNetwork) {
        return {
          ...request,
          error: ethErrors.rpc.invalidRequest({
            message: 'no active network found',
          }),
        };
      }
      const messageParams = paramsToMessageParams(request);

      ensureMessageFormatIsValid(
        request.method,
        messageParams.data,
        activeNetwork.chainId
      );

      let isMessageValid = true;
      let validationError: string | undefined = undefined;

      if (
        [
          MessageType.SIGN_TYPED_DATA_V3,
          MessageType.SIGN_TYPED_DATA_V4,
        ].includes(request.method)
      ) {
        try {
          // getPayload verifies the types and the content of the message throwing an error if the data is not valid.
          // We don't want to immediately reject the request even if there are errors for compatiblity reasons.
          // dApps tend to make small mistakes in the message format like leaving the verifyingContract emptry,
          // in which cases we should be able to continue just like other wallets do (even if it's technically incorrect).

          // remove EIP712Domain from types since ethers.js handles it separately
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { EIP712Domain, ...types } = messageParams.data.types;
          TypedDataEncoder.getPayload(
            messageParams.data.domain,
            types,
            messageParams.data.message
          );
        } catch (e) {
          validationError = (e as Error).toString();
          isMessageValid = false;
        }
      }

      const actionData = {
        ...request,
        displayData: {
          messageParams,
          isMessageValid,
          validationError,
        },
        tabId: request.site.tabId,
      };

      this.openApprovalWindow(actionData, `sign`);

      return { ...request, result: DEFERRED_RESPONSE };
    } catch (err) {
      return {
        ...request,
        error: ethErrors.rpc.invalidParams({
          message: (err as unknown as Error).message,
        }),
      };
    }
  };

  onActionApproved = async (
    pendingAction: Action,
    _result,
    onSuccess,
    onError
  ) => {
    try {
      const result = await this.walletService.signMessage(
        pendingAction.method as MessageType,
        pendingAction
      );
      onSuccess(result);
    } catch (e) {
      onError(e);
    }
  };
}
