import {
  ContextContainer,
  useIsSpecificContextContainer,
} from '@src/hooks/useIsSpecificContextContainer';
import { SendMiniMode } from './Send.minimode';

export function SendFlow() {
  const isMiniMode = useIsSpecificContextContainer(ContextContainer.POPUP);

  return isMiniMode ? <SendMiniMode /> : null;
}

export default SendFlow;
