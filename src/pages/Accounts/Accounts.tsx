import { useCallback, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  GearIcon,
  Stack,
  Tab,
  TabPanel,
  Tabs,
  TrashIcon,
  Typography,
  XIcon,
  toast,
  useTheme,
} from '@avalabs/k2-components';
import { t } from 'i18next';
import { useHistory } from 'react-router-dom';

import { useAccountsContext } from '@src/contexts/AccountsProvider';
import { useLedgerContext } from '@src/contexts/LedgerProvider';
import { useAnalyticsContext } from '@src/contexts/AnalyticsProvider';
import { LedgerApprovalDialog } from '@src/pages/SignTransaction/components/LedgerApprovalDialog';
import { PageTitle } from '@src/components/common/PageTitle';
import { Overlay } from '@src/components/common/Overlay';
import { useTabFromParams } from '@src/hooks/useTabFromParams';

import { AccountsActionButton } from './components/AccountsActionButton';
import { AddAccountError } from './AddAccountError';
import { ConfirmAccountRemovalDialog } from './components/ConfirmAccountRemovalDialog';
import { useWalletContext } from '@src/contexts/WalletProvider';
import { Flipper } from '@src/components/common/Flipper';
import { useAccountManager } from './providers/AccountManagerProvider';
import { AccountList, SelectionMode } from './components/AccountList';
import { WalletType } from '@src/background/services/wallet/models';
import { useFeatureFlagContext } from '@src/contexts/FeatureFlagsProvider';
import { FeatureGates } from '@src/background/services/featureFlags/models';
import { useWalletName } from './hooks/useWalletName';
import { AccountType } from '@src/background/services/accounts/models';

export enum AccountsTab {
  Primary,
  Imported,
}

const isKnownTab = (tab: number): tab is AccountsTab =>
  Object.values(AccountsTab).includes(tab);

export function Accounts() {
  const {
    selectAccount,
    addAccount,
    deleteAccounts,
    accounts: { imported: importedAccounts, primary: primaryAccounts, active },
  } = useAccountsContext();
  const { exitManageMode, isManageMode, toggleManageMode, selectedAccounts } =
    useAccountManager();

  const { activeTab: tabFromUrl } = useTabFromParams();
  const activeTab = isKnownTab(parseInt(tabFromUrl))
    ? parseInt(tabFromUrl)
    : AccountsTab.Primary;

  const [hasError, setHasError] = useState(false);
  const [addAccountLoading, setAddAccountLoading] = useState(false);
  const { hasLedgerTransport } = useLedgerContext();
  const { capture } = useAnalyticsContext();
  const theme = useTheme();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const history = useHistory();
  const { walletDetails } = useWalletContext();
  const { featureFlags } = useFeatureFlagContext();
  const canPrimaryAccountsBeRemoved =
    featureFlags[FeatureGates.PRIMARY_ACCOUNT_REMOVAL];

  const canCreateAccount = active?.type !== AccountType.PRIMARY;

  const walletName = useWalletName();

  const setActiveTab = useCallback(
    (tab: AccountsTab) => {
      // Avoid unnecessary re-renders
      if (tab === parseInt(tabFromUrl)) {
        return;
      }

      history.replace(
        `/accounts?activeTab=${isKnownTab(tab) ? tab : AccountsTab.Primary}`
      );
    },
    [history, tabFromUrl]
  );

  const addAccountAndFocus = async () => {
    setAddAccountLoading(true);

    try {
      setHasError(false);
      const id = await addAccount();
      capture('CreatedANewAccountSuccessfully', {
        walletType: walletDetails?.type,
      });
      await selectAccount(id);

      // Make sure we land on the Primary accounts list, since the account
      // creation can be triggered from Imported accounts list as well.
      //
      // IMPORTANT:
      // The switch needs to happen AFTER the account was created.
      // Otherwise it will trigger the useIsIncorrectDevice() hook
      // which will then block the transport for addAccount() call and
      // cause account creation to break for Ledger wallets.
      setActiveTab(AccountsTab.Primary);
    } catch (e) {
      setHasError(true);
    }

    setAddAccountLoading(false);
  };

  const onAccountDeleteSuccess = async () => {
    capture('ImportedAccountDeleteSucceeded');
    toast.success(t('Account(s) Deleted!'), { duration: 2000 });
    exitManageMode();
    setIsConfirmDialogOpen(false);
    setIsDeleting(false);
  };

  const onAccountDelete = () => {
    setIsDeleting(true);
    deleteAccounts(Array.from(selectedAccounts)).then(() => {
      onAccountDeleteSuccess();
    });
  };

  const hasImportedAccounts = Object.keys(importedAccounts).length > 0;

  const hasAnyAccounts = Object.values(primaryAccounts).length > 0;

  useEffect(() => {
    if (hasAnyAccounts && !hasImportedAccounts) {
      setActiveTab(AccountsTab.Primary);
    }
  }, [hasAnyAccounts, hasImportedAccounts, setActiveTab]);

  return (
    <Stack
      sx={{
        width: '100%',
        height: '100%',
        background: theme.palette.background.paper,
      }}
    >
      {addAccountLoading && hasLedgerTransport && (
        <Overlay>
          <LedgerApprovalDialog header={t('Waiting for Ledger')} />
        </Overlay>
      )}
      <ConfirmAccountRemovalDialog
        open={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={onAccountDelete}
        isMultiple={selectedAccounts.length > 1}
        isDeleting={isDeleting}
      />
      <Stack
        direction="row"
        sx={{ mt: 2.5, mb: 0.5, pr: 1, alignItems: 'center' }}
      >
        <PageTitle margin="0" onBackClick={() => history.replace('/home')}>
          {isManageMode ? t('Manage Accounts') : t('Account Manager')}
        </PageTitle>
        {(canPrimaryAccountsBeRemoved ||
          activeTab === AccountsTab.Imported) && (
          <Button
            variant="text"
            size="large"
            color="primary"
            sx={{ p: 0 }}
            disableRipple
            onClick={toggleManageMode}
            data-testid="manage-accounts-button"
          >
            <Flipper size={24} isFlipped={isManageMode}>
              <GearIcon />
              <XIcon />
            </Flipper>
          </Button>
        )}
      </Stack>

      {hasError && <AddAccountError />}

      {hasImportedAccounts && (
        <Tabs
          size="medium"
          label={t('Main')}
          variant="fullWidth"
          indicatorColor="secondary"
          value={activeTab}
          onChange={(_, tab) => {
            capture(
              tab === AccountsTab.Primary
                ? 'MainAccountPageClicked'
                : 'ImportedAccountPageClicked'
            );
            exitManageMode();
            setActiveTab(tab);
          }}
        >
          <Tab
            label={t('Main')}
            value={AccountsTab.Primary}
            size="medium"
            data-testid="main-tab-button"
          />
          <Tab
            label={t('Imported')}
            value={AccountsTab.Imported}
            size="medium"
            data-testid="imported-tab-button"
          />
        </Tabs>
      )}
      <Box
        sx={{
          width: '100%',
          borderTop: hasImportedAccounts ? 1 : 0,
          borderColor: 'divider',
          mt: -0.25,
          pt: hasImportedAccounts ? 0.75 : 2,
          overflow: 'hidden',
          flexGrow: 1,
        }}
      >
        <TabPanel
          value={activeTab}
          index={AccountsTab.Primary}
          sx={{
            display: 'flex',
            height: activeTab === AccountsTab.Primary ? '100%' : 0,
          }}
        >
          <Stack sx={{ gap: 1.5, pt: 1, width: 1 }}>
            {walletName && (
              <Stack direction="row" sx={{ gap: 1, px: 2 }}>
                <Typography variant="button">{walletName}</Typography>
                <Chip size="small" color="success" label={t('Active')} />
              </Stack>
            )}
            <AccountList
              walletType={walletDetails?.type}
              accounts={Object.values(primaryAccounts).flat()}
              selectionMode={
                canPrimaryAccountsBeRemoved &&
                walletDetails?.type !== WalletType.SEEDLESS
                  ? SelectionMode.Consecutive
                  : SelectionMode.None
              }
            />
          </Stack>
        </TabPanel>
        <TabPanel
          value={activeTab}
          index={AccountsTab.Imported}
          sx={{
            display: 'flex',
            height: activeTab === AccountsTab.Imported ? '100%' : 0,
            pt: 1,
          }}
        >
          <AccountList
            accounts={Object.values(importedAccounts)}
            selectionMode={SelectionMode.Any}
          />
        </TabPanel>
      </Box>
      <Stack
        direction="row"
        sx={{ py: 3, px: 2, justifyContent: 'center', alignItems: 'center' }}
      >
        {isManageMode && (
          <Button
            fullWidth
            size="large"
            disabled={selectedAccounts.length === 0}
            data-testid="delete-imported-account-button"
            onClick={() => {
              capture('ImportedAccountDeleteClicked');
              setIsConfirmDialogOpen(true);
            }}
          >
            <TrashIcon size={14} sx={{ mr: 1 }} />
            {selectedAccounts.length <= 1
              ? t('Delete Account')
              : t('Delete Accounts')}
          </Button>
        )}
        {!isManageMode && (
          <AccountsActionButton
            disabled={addAccountLoading}
            isButtonDisabled={canCreateAccount}
            onAddNewAccount={addAccountAndFocus}
            disabledButtonTooltipText={
              canCreateAccount ? t('Please select a wallet') : ''
            }
          />
        )}
      </Stack>
    </Stack>
  );
}
