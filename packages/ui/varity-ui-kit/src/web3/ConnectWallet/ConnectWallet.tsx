import React from 'react';
import { ConnectButton } from 'thirdweb/react';
import { createWallet } from 'thirdweb/wallets';
import { createThirdwebClient } from 'thirdweb';
import { THIRDWEB_CLIENT_ID, DEFAULT_CHAIN } from '../../config/chains';

export interface ConnectWalletProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onConnect?: (address: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  label?: string;
}

/**
 * Connect Wallet Button Component
 *
 * Displays a button that opens wallet connection modal with support for:
 * - MetaMask
 * - WalletConnect
 * - Coinbase Wallet
 * - Email/Social logins
 *
 * @example
 * ```tsx
 * import { ConnectWallet } from '@varity-labs/ui-kit';
 *
 * function Header() {
 *   return (
 *     <ConnectWallet
 *       variant="primary"
 *       size="md"
 *       onConnect={(address) => console.log('Connected:', address)}
 *       onError={(error) => console.error('Connection failed:', error)}
 *     />
 *   );
 * }
 * ```
 */
export function ConnectWallet({
  variant = 'primary',
  size = 'md',
  onConnect,
  onError,
  className = '',
  label = 'Connect Wallet',
}: ConnectWalletProps): JSX.Element {
  const client = React.useMemo(
    () => createThirdwebClient({ clientId: THIRDWEB_CLIENT_ID }),
    []
  );

  const wallets = React.useMemo(() => [
    createWallet('io.metamask'),
    createWallet('com.coinbase.wallet'),
    createWallet('walletConnect'),
  ], []);

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

  const buttonClasses = `${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      chain={DEFAULT_CHAIN}
      connectButton={{
        label: label,
        className: buttonClasses,
      }}
      onConnect={(wallet) => {
        if (onConnect && wallet.getAccount()?.address) {
          onConnect(wallet.getAccount()!.address);
        }
      }}
    />
  );
}
