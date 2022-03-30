import {
  HorizontalFlex,
  SecondaryDropDownMenuItem,
  TrashIcon,
  Typography,
  VerticalFlex,
} from '@avalabs/react-components';
import { useAccountsContext } from '@src/contexts/AccountsProvider';
import { usePermissionContext } from '@src/contexts/PermissionsProvider';
import { useWalletContext } from '@src/contexts/WalletProvider';
import { useTheme } from 'styled-components';
import { SettingsPageProps } from '../models';
import { SettingsHeader } from '../SettingsHeader';
import Scrollbars from 'react-custom-scrollbars-2';

type ConnectedListType = {
  [key: string]: {
    accounts: { [key: string]: boolean };
  };
};

type Account = {
  addressC: string;
  active: boolean;
  name: string;
  index: number;
};

const getAccountConnectedSites = ({
  list,
  account,
}: {
  list: ConnectedListType;
  account?: Account;
}) => {
  if (!account) {
    return [];
  }
  return Object.values(list).filter(
    (listItem: any) => listItem?.accounts[account.addressC]
  );
};

export function ConnectedSites({
  goBack,
  navigateTo,
  width,
}: SettingsPageProps) {
  const theme = useTheme();
  const { updateAccountPermission, permissions } = usePermissionContext();
  const { addresses } = useWalletContext();
  const { activeAccount } = useAccountsContext();
  const connectedSitesList = getAccountConnectedSites({
    list: permissions,
    account: activeAccount,
  });
  return (
    <VerticalFlex width={width} background={theme.colors.bg2} height="100%">
      <SettingsHeader
        width={width}
        goBack={goBack}
        navigateTo={navigateTo}
        title={'Connected Sites'}
      />
      <HorizontalFlex padding="16px">
        {connectedSitesList.length ? (
          <Typography size={14} height="17px">
            {activeAccount?.name} is connected to these sites.
          </Typography>
        ) : (
          <Typography size={14} height="17px">
            There are no connected sites
          </Typography>
        )}
      </HorizontalFlex>
      <Scrollbars style={{ flexGrow: 1, maxHeight: 'unset', height: '100%' }}>
        {!!connectedSitesList.length && (
          <VerticalFlex padding="8px">
            {connectedSitesList.map((site: any) => {
              return (
                <SecondaryDropDownMenuItem
                  justify="space-between"
                  align="center"
                  key={site.domain}
                  padding="10px 16px"
                >
                  <HorizontalFlex align={'center'}>
                    <HorizontalFlex
                      radius="50%"
                      background={`${theme.colors.disabled}CC`}
                      width="32px"
                      height="32px"
                      style={{ flexShrink: 0 }}
                      justify="center"
                      align="center"
                      margin="0 16px 0 0"
                    >
                      <Typography size={12} align="center">
                        {site.domain.substring(0, 2).toUpperCase()}
                      </Typography>
                    </HorizontalFlex>
                    <Typography weight={500} size={14} height="17px">
                      {site.domain}
                    </Typography>
                  </HorizontalFlex>
                  <HorizontalFlex justify={'flex-end'} align={'center'}>
                    <TrashIcon
                      height="16px"
                      color={theme.colors.icon1}
                      cursor="pointer"
                      onClick={() => {
                        updateAccountPermission({
                          addressC: addresses.addrC,
                          hasPermission: false,
                          domain: site.domain,
                        });
                      }}
                    />
                  </HorizontalFlex>
                </SecondaryDropDownMenuItem>
              );
            })}
          </VerticalFlex>
        )}
      </Scrollbars>
    </VerticalFlex>
  );
}
