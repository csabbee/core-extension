import {
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
  useRef,
} from 'react';
import {
  Stack,
  Typography,
  Button,
  ExternalLinkIcon,
  useTheme,
} from '@avalabs/k2-components';
import { Overlay } from '@src/components/common/Overlay';
import { useTranslation } from 'react-i18next';
import { OnboardingStepHeader } from './components/OnboardingStepHeader';
import { CryptoMultiAccounts } from '@keystonehq/bc-ur-registry-eth';
import { useKeystoneScannerContents } from '@src/hooks/useKeystoneScannerContents';
import { useAnalyticsContext } from '@src/contexts/AnalyticsProvider';

interface KeystoneProps {
  onCancel(): void;
  setXPubKey: (newValue: string) => void;
  setMasterFingerPrint: Dispatch<SetStateAction<string>>;
  onSuccess(): void;
}

export const KeystoneQRCodeScanner = ({
  onCancel,
  setXPubKey,
  setMasterFingerPrint,
  onSuccess,
}: KeystoneProps) => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { capture } = useAnalyticsContext();

  const [cameraPermission, setCameraPermission] = useState<PermissionState>();
  const [hasError, setHasError] = useState(false);
  const attempts = useRef<number[]>([]);

  const handleScan = useCallback(
    ({ cbor }: { type: string; cbor: string }) => {
      attempts.current = [];
      const buffer = Buffer.from(cbor, 'hex');
      const cryptoMultiAccounts = CryptoMultiAccounts.fromCBOR(buffer);

      const masterFingerprint = cryptoMultiAccounts.getMasterFingerprint();
      setMasterFingerPrint(masterFingerprint.toString('hex'));
      const keys = cryptoMultiAccounts.getKeys();

      const key = keys[0];

      if (key) {
        const xpub = key.getBip32Key();
        setXPubKey(xpub);
        capture(`KeystoneScanQRCodeSuccess`);
        onSuccess();
      }
    },
    [capture, onSuccess, setMasterFingerPrint, setXPubKey]
  );

  const handleError = useCallback(
    (error) => {
      if (!/^Dimensions/i.test(error)) {
        capture(`KeystoneScanQRCodeError`);
        setHasError(true);
        return;
      }
      attempts.current.push(Date.now());
      if (attempts.current.length === 5) {
        if (
          attempts.current[4] &&
          attempts.current[0] &&
          attempts.current[4] - attempts.current[0] < 500
        ) {
          capture(`KeystoneScanQRCodeDimensionsError`);
          setHasError(true);
          return;
        }
        attempts.current = [];
      }
    },
    [capture]
  );

  const pageContent = useKeystoneScannerContents({
    cameraPermission,
    hasError,
    setHasError,
    handleScan,
    handleError,
  });

  useEffect(() => {
    async function getPermissions() {
      const permission = await navigator.permissions.query({
        name: 'camera' as PermissionName, // workaround to avoid the ts error
      });
      permission.onchange = () => {
        if (permission.state === 'denied') {
          capture(`KeystoneScanQRCameraAccessDenied`);
        }
        setCameraPermission(permission.state);
      };
      setCameraPermission(permission.state);
    }
    getPermissions();
  }, [capture]);

  return (
    <Overlay>
      <Stack
        sx={{
          width: '512px',
          minHeight: '495px',
          background: palette.background.paper,
          borderRadius: 1,
        }}
      >
        <OnboardingStepHeader
          testId="keystone-tutorial-step-1"
          title={pageContent?.headLine}
          onClose={onCancel}
        />
        <Stack
          sx={{
            flexGrow: 1,
            pt: 1,
            px: 6,
          }}
        >
          <Typography variant="body2" minHeight={40}>
            {pageContent?.description}
          </Typography>
          <Stack
            sx={{
              alignItems: 'center',
              height: '100%',
              justifyContent: 'center',
              flexGrow: 1,
            }}
          >
            {pageContent?.content}
          </Stack>
        </Stack>
        <Stack
          sx={{
            width: '100%',
            justifyItems: 'space-between',
            alignContent: 'center',
            mb: 3,
            rowGap: 2,
            pt: 1,
            px: 6,
          }}
        >
          {pageContent?.helperText}
          <Button
            variant="text"
            onClick={() => {
              window.open('https://keyst.one', '_blank');
            }}
          >
            <ExternalLinkIcon
              size={16}
              sx={{ color: 'secondary.main', marginRight: 1 }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'secondary.main',
                fontWeight: 600,
              }}
            >
              {t('Keystone Support')}
            </Typography>
          </Button>
        </Stack>
      </Stack>
    </Overlay>
  );
};
