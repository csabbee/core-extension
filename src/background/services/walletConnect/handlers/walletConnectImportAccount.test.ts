import { ExtensionRequest } from '@src/background/connections/extensionConnection/models';
import { WalletConnectImportAccount } from './walletConnectImportAccount';

import { isCoreMobile } from '../utils';

jest.mock('../utils', () => {
  return {
    ...jest.requireActual('../utils'),
    isCoreMobile: jest.fn(),
  };
});

jest.mock('@src/monitoring/sentryCaptureException');

describe('background/services/walletConnect/handlers/walletConnectImportAccount.ts', () => {
  const getAccountsMock = jest.fn();
  const connectMock = jest.fn();
  const requestMock = jest.fn();
  const activateAccountMock = undefined;
  const wcServiceMock = {
    connect: connectMock,
    request: requestMock,
  } as any;
  const networkServiceMock = {
    activeNetwork: activateAccountMock,
  } as any;
  const accountServiceMock = {
    getAccounts: getAccountsMock,
  } as any;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('if there is no active network, returns with error', async () => {
    const handler = new WalletConnectImportAccount(
      wcServiceMock,
      networkServiceMock,
      accountServiceMock
    );
    const request = {
      method: ExtensionRequest.WALLET_CONNECT_IMPORT_ACCOUNT,
      params: [],
    } as any;
    const result = await handler.handle(request);

    expect(networkServiceMock.activeNetwork).toBe(undefined);
    expect(result).toEqual({
      ...request,
      error: 'No network is active',
    });
  });

  describe('when connected with Core Mobile, but extension is not recognized', () => {
    beforeEach(() => {
      jest.mocked(isCoreMobile).mockReturnValue(true);
      requestMock.mockRejectedValue(new Error('unknown error'));
    });

    it('continues without P/X/CoreEth/BTC addresses', async () => {
      const networkWithAccountMock = {
        activeNetwork: { network: 'network', chainId: 44 },
      } as any;

      const importedAccountId = 'new-account-id';
      const accountsServiceWithAccountsMock = {
        getAccounts: jest.fn().mockReturnValueOnce({
          active: { name: 'account 1', type: 'primary' },
          imported: { 'some-key': { id: 'some-key' } },
        }),
        addAccount: jest.fn().mockReturnValueOnce(importedAccountId),
        activateAccount: jest.fn(),
      } as any;

      const mockedSessionInfo = {
        addresses: ['mockreturnaddress'],
        chains: [1],
        walletApp: {
          walletId: 'abcd-1234',
        },
      };
      const wcService = {
        connect: jest.fn().mockReturnValueOnce(mockedSessionInfo),
      } as any;
      const handler = new WalletConnectImportAccount(
        wcService,
        networkWithAccountMock,
        accountsServiceWithAccountsMock
      );
      const request = {
        method: ExtensionRequest.WALLET_CONNECT_IMPORT_ACCOUNT,
        params: [],
      } as any;
      const { result } = await handler.handle(request);

      expect(result).toEqual({
        accountId: importedAccountId,
        connectedApp: mockedSessionInfo.walletApp,
      });
      expect(accountsServiceWithAccountsMock.addAccount).toHaveBeenCalledWith(
        'WalletConnect #1',
        {
          data: {
            addresses: { addressC: 'mockreturnaddress' },
            pubKey: undefined,
          },
          importType: 'walletConnect',
        }
      );
    });
  });

  it('returns account ID and session info on successful connection', async () => {
    const networkWithAccountMock = {
      activeNetwork: { network: 'network', chainId: 44 },
    } as any;

    const importedAccountId = 'new-account-key';
    const accountsServiceWithAccountsMock = {
      getAccounts: jest.fn().mockReturnValueOnce({
        active: { name: 'account 1', type: 'primary' },
        imported: { 'some-key': { id: 'some-key' } },
      }),
      addAccount: jest.fn().mockReturnValueOnce(importedAccountId),
      activateAccount: jest.fn(),
    } as any;

    const sessionInfo = {
      addresses: ['mockreturnaddress'],
      chains: [1],
      walletApp: {
        walletId: 'abcd-1234',
      },
    };
    const wcServiceWithReturnMock = {
      connect: jest.fn().mockReturnValueOnce(sessionInfo),
    } as any;

    const handler = new WalletConnectImportAccount(
      wcServiceWithReturnMock,
      networkWithAccountMock,
      accountsServiceWithAccountsMock
    );
    const request = {
      method: ExtensionRequest.WALLET_CONNECT_IMPORT_ACCOUNT,
      params: [],
    } as any;
    const result = await handler.handle(request);

    expect(wcServiceWithReturnMock.connect).toHaveBeenCalledTimes(1);
    expect(wcServiceWithReturnMock.connect).toBeCalledWith({
      chainId: 44,
      tabId: undefined,
    });
    expect(accountsServiceWithAccountsMock.getAccounts).toHaveBeenCalledTimes(
      1
    );
    expect(accountsServiceWithAccountsMock.addAccount).toHaveBeenCalledTimes(1);
    expect(accountsServiceWithAccountsMock.addAccount).toHaveBeenCalledWith(
      'WalletConnect #1',
      {
        data: {
          addresses: { addressC: 'mockreturnaddress' },
          pubKey: undefined,
        },
        importType: 'walletConnect',
      }
    );
    expect(accountsServiceWithAccountsMock.activateAccount).toBeCalledTimes(1);
    expect(result).toEqual({
      ...request,
      result: {
        accountId: importedAccountId,
        connectedApp: sessionInfo.walletApp,
      },
    });
  });

  it('if there is error with the connection, return with error', async () => {
    const wcServiceWithReturnMock = {
      connect: jest.fn().mockRejectedValueOnce('this is the error'),
    } as any;

    const networkWithAccountMock = {
      activeNetwork: { network: 'network', chainId: 44 },
    } as any;

    const handler = new WalletConnectImportAccount(
      wcServiceWithReturnMock,
      networkWithAccountMock,
      accountServiceMock
    );
    const request = {
      method: ExtensionRequest.WALLET_CONNECT_IMPORT_ACCOUNT,
      params: [],
    } as any;
    const result = await handler.handle(request);
    expect(wcServiceWithReturnMock.connect).toBeCalledTimes(1);
    expect(result).toEqual({
      ...request,
      error: 'this is the error',
    });
  });
});