import React, { useState, useRef, useEffect } from 'react';
import {
  VerticalFlex,
  Typography,
  HorizontalFlex,
  CheckmarkIcon,
  PrimaryButton,
  SecondaryButton,
  LoadingIcon,
  SecondaryDropDownMenu,
  SecondaryDropDownMenuItem,
  CaretIcon,
  IconDirection,
  Card,
  GlobeIcon,
} from '@avalabs/react-components';
import { usePermissions } from './usePermissions';
import styled, { useTheme } from 'styled-components';
import Scrollbars from 'react-custom-scrollbars';
import { useAccountsContext } from '@src/contexts/AccountsProvider';

const SiteAvatar = styled(VerticalFlex)<{ margin: string }>`
  width: 80px;
  height: 80px;
  background-color: ${({ theme }) => theme.colors.bg2};
  border-radius: 50%;
  margin: ${({ margin }) => margin ?? '0px'};
`;

const AccountName = styled(Typography)`
  max-width: 165px;
  margin: 0 8px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 600;
`;

export function PermissionsPage() {
  const params = new URLSearchParams(window.location.search);
  const domain = params.get('domain') as string;
  const {
    addPermissionsForDomain,
    permissions,
    acceptPermissionsDisabled,
    updateAccountPermission,
  } = usePermissions(domain);
  const theme = useTheme();
  const { accounts, activeAccount } = useAccountsContext();
  const [selectedAccount, setSelectedAccount] = useState<number>(
    activeAccount?.index || 0
  );
  const scrollbarsRef = useRef<Scrollbars>(null);
  const selectedAccountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollbarsRef || !selectedAccountRef || !selectedAccount) {
      return;
    }
    if (selectedAccountRef.current?.offsetTop) {
      scrollbarsRef.current?.scrollTop(selectedAccountRef.current.offsetTop);
    }
  }, [selectedAccount, selectedAccountRef, scrollbarsRef]);

  if (!permissions) {
    return <LoadingIcon />;
  }

  const selectAccount = (index: number) => {
    setSelectedAccount(index);
    updateAccountPermission(index, true);
  };

  return (
    <VerticalFlex
      width="100%"
      align={'center'}
      padding={'16px'}
      color={theme.colors.text1}
    >
      <Typography as="h1" size={24} weight={700} margin="24px 0">
        Connect Wallet to Site?
      </Typography>
      <SiteAvatar margin="16px" justify="center" align="center">
        <GlobeIcon height="48px" width="48px" color={theme.colors.text1} />
      </SiteAvatar>
      <Typography as="h2" weight="bold" size={18}>
        {permissions.domain}
      </Typography>
      <Typography
        margin="2px"
        size={12}
        weight={400}
        color={theme.colors.text2}
      >
        this should be a url
      </Typography>
      <VerticalFlex margin="24px 0 16px 0" flex={1} width="100%">
        <Typography size={12} margin="8px 0">
          Selected account
        </Typography>
        <SecondaryDropDownMenu
          icon={
            <Card padding="16px" width="100%">
              <HorizontalFlex
                width="100%"
                justify="space-between"
                align={'center'}
              >
                <AccountName>{accounts[selectedAccount]?.name}</AccountName>
                <CaretIcon
                  direction={IconDirection.DOWN}
                  color={theme.colors.text1}
                  height="12px"
                />
              </HorizontalFlex>
            </Card>
          }
        >
          <VerticalFlex width="341px" height="168px">
            <Scrollbars
              style={{ flexGrow: 1, maxHeight: 'unset', height: '100%' }}
              ref={scrollbarsRef}
            >
              {accounts.map((account) => (
                <SecondaryDropDownMenuItem
                  width="100%"
                  key={account.index}
                  onClick={() => selectAccount(account.index) as any}
                  selected={account.index === selectedAccount}
                  ref={
                    selectedAccount === account.index
                      ? selectedAccountRef
                      : undefined
                  }
                >
                  <VerticalFlex padding="0px" width="100%">
                    <HorizontalFlex
                      width="100%"
                      justify="space-between"
                      align="center"
                    >
                      <AccountName>{account.name}</AccountName>
                      {selectedAccount === account.index && (
                        <CheckmarkIcon
                          height="16px"
                          color={theme.colors.text1}
                        />
                      )}
                    </HorizontalFlex>
                  </VerticalFlex>
                </SecondaryDropDownMenuItem>
              ))}
            </Scrollbars>
          </VerticalFlex>
        </SecondaryDropDownMenu>
      </VerticalFlex>
      <VerticalFlex width="100%" justify="space-between">
        <Typography
          size={12}
          margin="16px"
          color={theme.colors.text2}
          align="center"
        >
          Only connect to sites that you trust
        </Typography>
        <HorizontalFlex justify="space-between">
          <SecondaryButton onClick={() => window.close()} width="141px">
            Reject
          </SecondaryButton>
          <PrimaryButton
            disabled={acceptPermissionsDisabled}
            onClick={() => {
              addPermissionsForDomain(permissions).then(() => window.close());
            }}
            width="141px"
          >
            Approve
          </PrimaryButton>
        </HorizontalFlex>
      </VerticalFlex>
    </VerticalFlex>
  );
}

export default PermissionsPage;
