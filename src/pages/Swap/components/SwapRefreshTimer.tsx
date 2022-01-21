import { useEffect } from 'react';
import {
  InfoIcon,
  SecondaryCard,
  Tooltip,
  Typography,
  VerticalFlex,
} from '@avalabs/react-components';
import { useTimer } from 'react-timer-hook';
import styled, { useTheme } from 'styled-components';

const TimerContainer = styled.div`
  border-radius: 100px;
`;

const StyledTooltip = styled(Tooltip)`
  align-items: center;
  display: flex;
  padding: 11px 7px;
`;

interface SwapRefreshTimerProps {
  secondsTimer: number;
  onExpire: () => void;
}

export function SwapRefreshTimer({
  secondsTimer,
  onExpire,
}: SwapRefreshTimerProps) {
  const theme = useTheme();
  const time = new Date();
  time.setSeconds(time.getSeconds() + secondsTimer);
  const { seconds, minutes, restart, isRunning } = useTimer({
    autoStart: true,
    expiryTimestamp: time,
    onExpire,
  });

  useEffect(() => {
    if (!isRunning) {
      const time = new Date();
      time.setSeconds(time.getSeconds() + secondsTimer);
      restart(time);
    }
  }, [isRunning, restart, secondsTimer]);

  const displayedSeconds = seconds.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
  });
  const displayedMinutes = minutes.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
  });
  const Content = (
    <VerticalFlex width="240px">
      <Typography size={12}>
        Quotes are refreshed to reflect current market prices
      </Typography>
    </VerticalFlex>
  );
  return (
    <TimerContainer>
      <SecondaryCard padding="4px 8px">
        <Typography size={12} height="16px" margin=" 0 7px 0 0 " width="34px">
          {displayedMinutes}:{displayedSeconds}
        </Typography>
        <StyledTooltip content={Content}>
          <InfoIcon height="16px" color={theme.colors.text2} />
        </StyledTooltip>
      </SecondaryCard>
    </TimerContainer>
  );
}