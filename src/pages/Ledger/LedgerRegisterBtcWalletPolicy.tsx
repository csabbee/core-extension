import Dialog from '@src/components/common/Dialog';
import { Divider, Stack, Typography, useTheme } from '@avalabs/k2-components';
import { useEffect, useState } from 'react';
import useRegisterBtcWalletPolicy from './hooks/useRegisterBtcWalletPolicy';
import { useLedgerContext } from '@src/contexts/LedgerProvider';
import { LoadingSpinnerIcon } from '@avalabs/react-components';
import { useConnectionContext } from '@src/contexts/ConnectionProvider';
import { StoreBtcWalletPolicyDetails } from '@src/background/services/wallet/handlers/storeBtcWalletPolicyDetails';
import { ExtensionRequest } from '@src/background/connections/extensionConnection/models';
import { Trans, useTranslation } from 'react-i18next';

enum TextType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

const LedgerRegisterBtcWalletPolicy = () => {
  const POLICY_DESCRIPTOR = 'wpkh(@0/**)';

  const { t } = useTranslation();
  const [isXpubDialogOpen, setIsXpubDialogOpen] = useState(false);
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [xpub, setXpub] = useState<string | undefined>();
  const {
    shouldRegisterBtcWalletPolicy,
    walletPolicyName,
    walletPolicyDerivationpath,
  } = useRegisterBtcWalletPolicy();
  const {
    getBtcExtendedPublicKey,
    getMasterFingerprint,
    registerBtcWalletPolicy,
    closeCurrentApp,
  } = useLedgerContext();
  const theme = useTheme();
  const { request } = useConnectionContext();

  const renderText = (
    type: TextType,
    text: string | React.ReactElement,
    mt = '16px'
  ) => (
    <Typography
      component="span"
      sx={{
        mt,
        fontSize: 'body2.fontSize',
        color: type === TextType.PRIMARY ? 'text.primary' : 'text.secondary',
      }}
    >
      {text}
    </Typography>
  );

  const renderStatus = () => {
    if (hasError) {
      return t('An error occurred, please try again later');
    }

    return (
      <LoadingSpinnerIcon
        style={{
          width: 24,
          height: 24,
          marginTop: 6,
        }}
        color={theme.palette.secondary.light}
        height="24px"
      />
    );
  };

  useEffect(() => {
    const fetchExtendedPublickey = async () => {
      setIsXpubDialogOpen(true);
      setHasError(false);

      try {
        if (!walletPolicyDerivationpath) {
          throw new Error('missing data');
        }

        const xpub = await getBtcExtendedPublicKey(walletPolicyDerivationpath);
        setXpub(xpub);
        setIsXpubDialogOpen(false);
      } catch (err) {
        console.error((err as Error).message);
        setHasError(true);
      }
    };

    if (shouldRegisterBtcWalletPolicy) {
      fetchExtendedPublickey();
    } else {
      setXpub(undefined);
      setHasError(false);
      setIsXpubDialogOpen(false);
    }
  }, [
    getBtcExtendedPublicKey,
    shouldRegisterBtcWalletPolicy,
    walletPolicyDerivationpath,
  ]);

  useEffect(() => {
    const registerWalletPolicy = async () => {
      setIsPolicyDialogOpen(true);

      try {
        if (!xpub || !walletPolicyDerivationpath || !walletPolicyName) {
          throw new Error('missing data');
        }

        const masterFingerprint = await getMasterFingerprint();

        const [, hmac] = await registerBtcWalletPolicy(
          xpub,
          masterFingerprint,
          walletPolicyDerivationpath,
          walletPolicyName
        );

        const { isCorrectDevice } = await request<StoreBtcWalletPolicyDetails>({
          method: ExtensionRequest.WALLET_STORE_BTC_WALLET_POLICY_DETAILS,
          params: [
            xpub,
            masterFingerprint,
            Buffer.from(hmac).toString('hex'),
            walletPolicyName,
          ],
        });

        if (!isCorrectDevice) {
          throw new Error('incorrect device');
        }

        setIsPolicyDialogOpen(false);
      } catch (err) {
        console.error((err as Error).message);
        setHasError(true);
      }
    };

    if (shouldRegisterBtcWalletPolicy && xpub && !isXpubDialogOpen) {
      registerWalletPolicy();
    } else {
      setHasError(false);
      setIsPolicyDialogOpen(false);
    }
  }, [
    shouldRegisterBtcWalletPolicy,
    xpub,
    isXpubDialogOpen,
    getMasterFingerprint,
    registerBtcWalletPolicy,
    walletPolicyDerivationpath,
    walletPolicyName,
    request,
  ]);

  return (
    <>
      <Dialog
        open={isXpubDialogOpen}
        isCloseable={hasError}
        onClose={() => {
          if (hasError) {
            closeCurrentApp();
          }

          setIsXpubDialogOpen(false);
          setHasError(false);
        }}
        title={t('Confirm Public Key')}
        content={
          <Stack>
            {renderText(
              TextType.PRIMARY,
              t(
                'Please confirm the public key displayed on your Ledger device.'
              )
            )}

            {renderText(TextType.SECONDARY, t('Path'))}

            {renderText(
              TextType.PRIMARY,
              walletPolicyDerivationpath ?? '-',
              '0px'
            )}

            <Divider sx={{ mt: '16px' }} />

            {renderText(TextType.SECONDARY, t('Status'))}

            {renderStatus()}
          </Stack>
        }
      />

      <Dialog
        open={isPolicyDialogOpen}
        isCloseable={hasError}
        onClose={() => {
          if (hasError) {
            closeCurrentApp();
          }

          setIsPolicyDialogOpen(false);
          setHasError(false);
        }}
        title={t('Register Wallet')}
        content={
          <Stack>
            {renderText(
              TextType.PRIMARY,
              t(
                'Ledger requires you to set up a wallet policy in the Bitcoin app.'
              )
            )}

            {renderText(
              TextType.PRIMARY,
              <Trans
                i18nKey="Please approve or reject this action on your Ledger device. <walletPolicyLink>Learn more</walletPolicyLink>."
                components={{
                  walletPolicyLink: (
                    <Typography
                      sx={{
                        cursor: 'pointer',
                        fontWeight: 'semibold',
                        color: 'secondary.main',
                      }}
                      as="a"
                      target="_blank"
                      href="https://support.avax.network/en/articles/7178568-what-are-ledger-wallet-policies"
                      rel="noopener noreferrer"
                    />
                  ),
                }}
              />
            )}

            {renderText(TextType.SECONDARY, t('Name'))}

            {renderText(TextType.PRIMARY, walletPolicyName ?? '-', '0px')}

            <Divider sx={{ mt: '16px' }} />

            {renderText(TextType.SECONDARY, t('Policy'))}

            {renderText(TextType.PRIMARY, POLICY_DESCRIPTOR, '0px')}

            <Divider sx={{ mt: '16px' }} />

            {renderText(TextType.PRIMARY, t('Status'))}

            {renderStatus()}
          </Stack>
        }
      />
    </>
  );
};

export default LedgerRegisterBtcWalletPolicy;