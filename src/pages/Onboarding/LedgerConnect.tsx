import { useCallback, useEffect, useState } from 'react';
import {
  VerticalFlex,
  Typography,
  InfoIcon,
  Tooltip,
  PrimaryButton,
  ComponentSize,
} from '@avalabs/react-components';
import styled, { useTheme } from 'styled-components';
import {
  LedgerConnectCard,
  LedgerStatus,
} from './components/LedgerConnectCard';
import { useLedgerContext } from '@src/contexts/LedgerProvider';
import { OnboardingStepHeader } from './components/OnboardingStepHeader';
import { useAnalyticsContext } from '@src/contexts/AnalyticsProvider';
import { useOnboardingContext } from '@src/contexts/OnboardingProvider';

interface LedgerConnectProps {
  onCancel(): void;
  onBack(): void;
  onNext(): void;
  onError(): void;
}

const StyledTooltip = styled(Tooltip)`
  display: inline;
  padding: 0 0 0 8px;
  vertical-align: text-top;
  cursor: pointer;
`;

/**
 * Waiting this amount of time otherwise this screen would be a blip and the user wouldnt even know it happened
 */
const WAIT_1500_MILLI_FOR_USER = 1500;

export function LedgerConnect({
  onBack,
  onCancel,
  onNext,
  onError,
}: LedgerConnectProps) {
  const theme = useTheme();
  const { capture } = useAnalyticsContext();
  const {
    getPublicKey,
    popDeviceSelection,
    hasLedgerTransport,
    initLedgerTransport,
  } = useLedgerContext();
  const { setPublicKey } = useOnboardingContext();
  const [publicKeyState, setPublicKeyState] = useState<LedgerStatus>(
    LedgerStatus.LEDGER_LOADING
  );

  const getPublicKeyAndRedirect = useCallback(
    () =>
      getPublicKey()
        .then((res) => {
          if (res) {
            setPublicKey(res);
            setPublicKeyState(LedgerStatus.LEDGER_CONNECTED);
            capture('OnboardingLedgerConnected');
            setTimeout(() => {
              onNext();
            }, WAIT_1500_MILLI_FOR_USER);
          }
        })
        .catch(() => {
          capture('OnboardingLedgerConnectionFailed');
          setPublicKeyState(LedgerStatus.LEDGER_CONNECTION_FAILED);
          popDeviceSelection();
        }),
    [capture, getPublicKey, onNext, popDeviceSelection, setPublicKey]
  );

  useEffect(() => {
    initLedgerTransport().then(() => {
      setTimeout(() => {
        getPublicKeyAndRedirect();
      }, WAIT_1500_MILLI_FOR_USER);
    });
    // only call this once when the component is initialized
    // extra calls can break the ledger flow
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tryPublicKey = async () => {
    capture('OnboardingLedgerRetry');
    setPublicKeyState(LedgerStatus.LEDGER_LOADING);

    if (!hasLedgerTransport) {
      // make sure we have a transport
      await initLedgerTransport();
    }

    return getPublicKeyAndRedirect();
  };

  const onLedgerCardClicked = () => {
    if (publicKeyState === LedgerStatus.LEDGER_CONNECTION_FAILED) {
      capture('OnboardingLedgerErrorPageVisited');
      onError();
    }
  };

  const Content = (
    <Typography align="left" size={12}>
      This process retrieves the addresses
      <br />
      from your ledger
    </Typography>
  );

  return (
    <VerticalFlex width="100%" align="center">
      <OnboardingStepHeader
        title="Connect your Ledger"
        onBack={onBack}
        onClose={onCancel}
      />
      <Typography align="center" margin="8px 0 32px" size={14} height="17px">
        Please confirm these actions in the <br />
        <Typography weight="bold">Avalanche App</Typography> on your Ledger
        device
        <StyledTooltip content={Content}>
          <InfoIcon height="12px" color={theme.colors.icon2} />
        </StyledTooltip>
      </Typography>
      <VerticalFlex grow="1">
        <LedgerConnectCard
          path={"m/44'/60'/0'"}
          status={publicKeyState}
          onClick={onLedgerCardClicked}
          onError={onError}
        />
      </VerticalFlex>
      {publicKeyState === LedgerStatus.LEDGER_CONNECTION_FAILED && (
        <PrimaryButton
          onClick={() => tryPublicKey()}
          width="343px"
          size={ComponentSize.LARGE}
        >
          Retry
        </PrimaryButton>
      )}
    </VerticalFlex>
  );
}