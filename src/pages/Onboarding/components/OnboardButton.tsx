import {
  HorizontalFlex,
  TextButton,
  Typography,
  VerticalFlex,
} from '@avalabs/react-components';
import styled from 'styled-components';

const TextButtonCard = styled(TextButton)`
  border-radius: 8px;
  border: 1px solid transparent;

  &:hover {
    border: 1px solid ${({ theme }) => theme.colors.stroke1};
    background-color: ${({ theme }) => `${theme.colors.bg3}50`};
  }
`;

export function OnboardButton({
  children,
  className,
  margin,
  onClick,
  title,
  testId,
  variant = 'regular',
}: {
  children: any;
  className?: string;
  margin?: string;
  onClick?: () => void;
  title: string;
  testId?: string;
  variant?: 'regular' | 'small';
}) {
  if (variant === 'small') {
    return (
      <TextButtonCard data-testid={`${testId}-button`} onClick={onClick} margin={margin}>
        <HorizontalFlex
          width="227px"
          height="56px"
          padding="18px"
          align="center"
          justify="flex-start"
          gap="24px"
          className={className}
        >
          {children}
          <Typography size={16} height="24px" weight={600}>
            {title}
          </Typography>
        </HorizontalFlex>
      </TextButtonCard>
    );
  }

  return (
    <TextButtonCard data-testid={`${testId}-button`} onClick={onClick} margin={margin}>
      <VerticalFlex
        width="232px"
        height="180px"
        padding="36px 0"
        align="center"
        justify="center"
        gap="24px"
        className={className}
      >
        <Typography size={16} height="24px" weight={600}>
          {title}
        </Typography>
        {children}
      </VerticalFlex>
    </TextButtonCard>
  );
}