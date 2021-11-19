import React from 'react';
import {
  Typography,
  VerticalFlex,
  TokenImg,
  GlobeIcon,
  HorizontalFlex,
  TextButton,
  SubTextTypography,
  HorizontalSeparator,
  SecondaryCard,
} from '@avalabs/react-components';
import styled, { useTheme } from 'styled-components';
import { ApproveTransactionData } from '@src/contracts/contractParsers/models';
import { Tab, TabList, TabPanel, Tabs } from '@src/components/common/Tabs';
import { useSettingsContext } from '@src/contexts/SettingsProvider';
import { getHexStringToBytes } from '@src/utils/getHexStringToBytes';
import { truncateAddress } from '@src/utils/truncateAddress';

const SiteAvatar = styled(VerticalFlex)<{ margin: string }>`
  width: 80px;
  height: 80px;
  background-color: ${({ theme }) => theme.colors.bg2};
  border-radius: 50%;
  margin: ${({ margin }) => margin ?? '0px'};
`;

export function ApproveTx({
  site,
  tokenToBeApproved,
  fee,
  feeUSD,
  txParams,
  setShowCustomFees,
  setShowCustomSpendLimit,
  displaySpendLimit,
  isRevokeApproval,
  ...rest
}: ApproveTransactionData) {
  const { currencyFormatter, currency } = useSettingsContext();
  const theme = useTheme();

  const showSummary = () => (
    <VerticalFlex margin="16px 0 0 0" width={'100%'} justify="space-between">
      <HorizontalFlex justify="space-between">
        <Typography padding="0 0 4px 0" height="24px" weight={600}>
          Network Fee
        </Typography>
        <Typography padding="0 0 4px 0" weight={600} height="24px">
          {fee}
          <Typography
            padding="0 0 0 4px"
            weight={600}
            color={theme.colors.text2}
          >
            AVAX
          </Typography>
        </Typography>
      </HorizontalFlex>

      <HorizontalFlex justify="space-between">
        <TextButton onClick={() => setShowCustomFees(true)}>
          <Typography size={12} color={theme.colors.primary1} weight={600}>
            Edit
          </Typography>
        </TextButton>
        <SubTextTypography size={12}>
          ~{currencyFormatter(Number(feeUSD))} {currency}
        </SubTextTypography>
      </HorizontalFlex>

      <HorizontalSeparator margin="16px 0" />

      {/* Bottom Approval Amnt */}
      <VerticalFlex>
        <HorizontalFlex justify="space-between">
          <Typography padding="0 0 4px 0" height="24px" weight={600}>
            Approval amount
          </Typography>
          <Typography padding="0 0 4px 0" weight={600} height="24px">
            {displaySpendLimit}
            <Typography
              padding="0 0 0 4px"
              weight={600}
              color={theme.colors.text2}
            >
              {tokenToBeApproved.symbol}
            </Typography>
          </Typography>
        </HorizontalFlex>

        <HorizontalFlex justify="space-between" margin="8px 0 0 0">
          <Typography padding="0 0 4px 0" height="24px" weight={600}>
            To
          </Typography>
          <Typography padding="0 0 4px 0" weight={600} height="24px">
            {truncateAddress(rest.toAddress)}
          </Typography>
        </HorizontalFlex>
        {!isRevokeApproval && (
          <HorizontalFlex>
            <TextButton onClick={() => setShowCustomSpendLimit(true)}>
              <Typography size={12} color={theme.colors.primary1} weight={600}>
                Edit
              </Typography>
            </TextButton>
          </HorizontalFlex>
        )}
      </VerticalFlex>
    </VerticalFlex>
  );

  const showTxData = (byteStr) => (
    <VerticalFlex margin="16px 0 0 0" width={'100%'}>
      <Typography margin="0 0 8px 0" height="24px">
        Hex Data: {getHexStringToBytes(byteStr)} Bytes
      </Typography>
      <SecondaryCard padding="16px">
        <Typography size={14} overflow="scroll">
          {byteStr}
        </Typography>
      </SecondaryCard>
    </VerticalFlex>
  );

  return (
    <VerticalFlex width={'100%'} align={'center'} margin="24px 0 0 0">
      <Typography as="h1" size={24} weight={700} margin="0 0 32px 0">
        Approval Summary
      </Typography>
      <SiteAvatar justify="center" align="center" margin="0 0 8px 0">
        {site.icon ? (
          <TokenImg height="48px" width="48px" src={site?.icon} />
        ) : (
          <GlobeIcon height="48px" color={theme.colors.icon1} />
        )}
      </SiteAvatar>
      <Typography align="center" height="24px">
        Allow {site?.domain} to spend your {tokenToBeApproved.name}
      </Typography>

      {/* Tabs */}
      <VerticalFlex margin="32px 0 0 0" width="100%">
        <Tabs defaultIndex={0}>
          <TabList $border={false}>
            <Tab margin="0 32px 8px 0">
              <Typography>Summary</Typography>
            </Tab>
            <Tab>
              <Typography>Data</Typography>
            </Tab>
          </TabList>

          <TabPanel>{showSummary()}</TabPanel>
          <TabPanel>{showTxData(txParams?.data)}</TabPanel>
        </Tabs>
      </VerticalFlex>
    </VerticalFlex>
  );
}
