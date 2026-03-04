import React from 'react';
import { useDisconnect, useActiveWallet } from 'thirdweb/react';

export interface DisconnectButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onDisconnect?: () => void;
  className?: string;
  label?: string;
}

/**
 * Disconnect Wallet Button Component
 *
 * Displays a button to disconnect the currently connected wallet
 *
 * @example
 * ```tsx
 * import { DisconnectButton } from '@varity-labs/ui-kit';
 *
 * function Settings() {
 *   return (
 *     <DisconnectButton
 *       variant="secondary"
 *       size="md"
 *       onDisconnect={() => console.log('Disconnected')}
 *       label="Disconnect Wallet"
 *     />
 *   );
 * }
 * ```
 */
export function DisconnectButton({
  variant = 'secondary',
  size = 'md',
  onDisconnect,
  className = '',
  label = 'Disconnect',
}: DisconnectButtonProps): JSX.Element | null {
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  if (!wallet) {
    return null;
  }

  const variantClasses = {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    outline: 'btn btn-outline',
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  const handleDisconnect = async () => {
    await disconnect(wallet);
    if (onDisconnect) {
      onDisconnect();
    }
  };

  return (
    <button
      onClick={handleDisconnect}
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {label}
    </button>
  );
}
