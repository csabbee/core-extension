import { useCallback, useRef, useState } from 'react';

import useIsUsingLedgerWallet from './useIsUsingLedgerWallet';
import useIsUsingKeystoneWallet from './useIsUsingKeystoneWallet';
import useIsUsingWalletConnectAccount from './useIsUsingWalletConnectAccount';
import { toast } from '@avalabs/k2-components';
import useIsUsingFireblocksAccount from './useIsUsingFireblocksAccount';

type UseApprovalHelpersProps = {
  onApprove: () => Promise<unknown>;
  onReject: () => unknown;
  pendingMessage?: string;
};

export function useApprovalHelpers({
  onApprove,
  onReject,
  pendingMessage,
}: UseApprovalHelpersProps) {
  const isUsingLedgerWallet = useIsUsingLedgerWallet();
  const isUsingKeystoneWallet = useIsUsingKeystoneWallet();
  const isUsingWalletConnectAccount = useIsUsingWalletConnectAccount();
  const isUsingFireblocksAccount = useIsUsingFireblocksAccount();

  const isTwoStepApproval =
    isUsingWalletConnectAccount || isUsingFireblocksAccount;
  const isUsingExternalSigner =
    isUsingLedgerWallet ||
    isUsingKeystoneWallet ||
    isUsingWalletConnectAccount ||
    isUsingFireblocksAccount;

  const [isReadyToSign, setIsReadyToSign] = useState(!isTwoStepApproval);
  const [isApprovalOverlayVisible, setIsApprovalOverlayVisible] =
    useState(false);

  const pendingToastIdRef = useRef<string>('');
  const handleApproval = useCallback(async () => {
    setIsApprovalOverlayVisible(isUsingExternalSigner);

    // If it's a two-step approval, do not call `onApprove` yet.
    // Instead, just toggle the isReadyToSign flag so that it's
    // called on a 2nd click.
    if (isTwoStepApproval && !isReadyToSign) {
      setIsReadyToSign(true);
      return;
    }

    if (pendingMessage && !isUsingExternalSigner) {
      const toastId = toast.loading(pendingMessage);
      pendingToastIdRef.current = toastId;
    }

    // This has to be awaited, otherwise the overlay would disappear immediately.
    await onApprove();
    if (pendingToastIdRef.current) {
      toast.dismiss(pendingToastIdRef.current);
    }
    setIsApprovalOverlayVisible(false);
  }, [
    isUsingExternalSigner,
    isTwoStepApproval,
    isReadyToSign,
    pendingMessage,
    onApprove,
  ]);

  const handleRejection = useCallback(async () => {
    setIsApprovalOverlayVisible(false);

    if (isTwoStepApproval) {
      setIsReadyToSign(false);
    }

    await onReject();
  }, [isTwoStepApproval, onReject]);

  return {
    isApprovalOverlayVisible,
    handleApproval,
    handleRejection,
  };
}