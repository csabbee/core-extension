import {
  VerticalFlex,
  HorizontalFlex,
  LedgerIcon,
  RecoveryLockIcon,
  VerticalSeparator,
  Typography,
} from '@avalabs/react-components';
import { OnboardButton } from './components/OnboardButton';
import { useTheme } from 'styled-components';
import { OnboardingStepHeader } from './components/OnboardingStepHeader';
import { Logo } from '@src/components/icons/Logo';
import { BrandName } from '@src/components/icons/BrandName';
import { BetaLabel } from '@src/components/icons/BetaLabel';

interface ChooseExistingTypeProps {
  onNext: (isImportFlow: boolean) => void;
  onBack(): void;
  onCancel(): void;
}

export function ChooseExistingType({
  onNext,
  onBack,
  onCancel,
}: ChooseExistingTypeProps) {
  const theme = useTheme();

  return (
    <VerticalFlex width="100%" align="center">
      <OnboardingStepHeader onBack={onBack} onClose={onCancel} />
      <VerticalFlex justify="center" align="center" margin="36px 0 4px">
        <Logo height={132} />
        <BrandName height={50} margin="24px 0 0 0" />
        <HorizontalFlex justify="flex-end" width="100%" margin="10px 0 0 0">
          <BetaLabel />
        </HorizontalFlex>
      </VerticalFlex>
      <Typography
        weight="bold"
        color={theme.colors.text1}
        size={20}
        margin="0 0 12px"
      >
        Access using...
      </Typography>
      <VerticalFlex align="center">
        <HorizontalFlex>
          <OnboardButton title="Recovery Phrase" onClick={() => onNext(true)}>
            <RecoveryLockIcon color={theme.colors.icon1} height="56px" />
          </OnboardButton>
          <VerticalSeparator margin="0 24px" />
          <OnboardButton
            title="Ledger"
            onClick={() => {
              onNext(false);
            }}
          >
            <LedgerIcon color={theme.colors.icon1} height="56px" />
          </OnboardButton>
        </HorizontalFlex>
      </VerticalFlex>
    </VerticalFlex>
  );
}
