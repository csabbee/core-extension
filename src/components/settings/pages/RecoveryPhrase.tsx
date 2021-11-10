import React, { useState } from 'react';
import {
  VerticalFlex,
  Input,
  PrimaryButton,
  Typography,
  ComponentSize,
  TextArea,
  HorizontalFlex,
  WarningIcon,
} from '@avalabs/react-components';
import { SettingsPageProps } from '../models';
import { SettingsHeader } from '../SettingsHeader';
import { useTheme } from 'styled-components';
import { useWalletContext } from '@src/contexts/WalletProvider';

export function RecoveryPhrase({ goBack, navigateTo }: SettingsPageProps) {
  const theme = useTheme();
  const [passwordValue, setPasswordValue] = useState('');
  const [recoveryValue, setRecoveryValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { getUnencryptedMnemonic } = useWalletContext();

  const handleShowRecoveryPhrase = () => {
    getUnencryptedMnemonic(passwordValue)
      .then((res) => {
        setRecoveryValue(res);
      })
      .catch((err) => {
        setErrorMessage(err);
      });
  };

  return (
    <VerticalFlex
      width="375px"
      background={theme.colors.bg2}
      height="100%"
      justify="flex-start"
    >
      <SettingsHeader
        goBack={goBack}
        navigateTo={navigateTo}
        title={'Show recovery phrase'}
      />
      <VerticalFlex width="100%" height="100%" align="center" padding="24px 0">
        <Typography
          color={theme.colors.text2}
          padding="0 16px"
          size={14}
          height="16px"
          align="center"
        >
          If you ever change browsers or move computers, you will need this
          Secret Recovery Phrase to access your accounts.
          <br />
          Save them somewhere safe and secret.
        </Typography>
        <HorizontalFlex
          margin="16px 0"
          padding="16px 16px"
          align="center"
          background={theme.colors.bg3}
        >
          <WarningIcon height="48px" color={theme.colors.error} />
          <Typography margin="0 0 0 8px" height="20px">
            DO NOT share this phrase with anyone!
            <br />
            These words can be used to steal all your accounts.
          </Typography>
        </HorizontalFlex>
        {!recoveryValue ? (
          <>
            <HorizontalFlex height="100px">
              <Input
                label="Enter password to continue"
                error={!!errorMessage}
                errorMessage={errorMessage}
                onChange={(e) => {
                  setPasswordValue(e.target.value);
                  setErrorMessage('');
                }}
                value={passwordValue}
                placeholder="password"
                type="password"
              />
            </HorizontalFlex>
            <VerticalFlex grow="1" justify="flex-end" align="center">
              <PrimaryButton
                size={ComponentSize.LARGE}
                onClick={handleShowRecoveryPhrase}
                margin="0 0 24px"
              >
                Show Recovery Phrase
              </PrimaryButton>
            </VerticalFlex>
          </>
        ) : (
          <VerticalFlex width="100%" align="center" padding="12px 0">
            <TextArea value={recoveryValue} disabled></TextArea>
          </VerticalFlex>
        )}
      </VerticalFlex>
    </VerticalFlex>
  );
}