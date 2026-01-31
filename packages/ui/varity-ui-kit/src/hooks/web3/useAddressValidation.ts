import { useMemo, useCallback } from 'react';
import { isAddress, getAddress } from 'viem';

export interface UseAddressValidationReturn {
  validate: (address: string) => boolean;
  normalize: (address: string) => string | null;
  isValid: (address: string) => boolean;
}

/**
 * Hook for address validation utilities
 *
 * Provides utilities for validating and normalizing Ethereum addresses:
 * - Validate address format
 * - Normalize address to checksum format
 * - Quick validation check
 *
 * @returns {UseAddressValidationReturn} Address validation utilities
 *
 * @example
 * ```tsx
 * import { useAddressValidation } from '@varity-labs/ui-kit';
 *
 * function AddressChecker() {
 *   const { validate, normalize } = useAddressValidation();
 *
 *   const address = "0x1234...";
 *   const isValid = validate(address);
 *   const checksumAddress = normalize(address);
 *
 *   return (
 *     <div>
 *       <p>Valid: {isValid ? 'Yes' : 'No'}</p>
 *       <p>Checksum: {checksumAddress}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAddressValidation(): UseAddressValidationReturn {
  const validate = useCallback((address: string): boolean => {
    try {
      return isAddress(address);
    } catch {
      return false;
    }
  }, []);

  const normalize = useCallback((address: string): string | null => {
    try {
      if (!isAddress(address)) {
        return null;
      }
      return getAddress(address);
    } catch {
      return null;
    }
  }, []);

  return useMemo(
    () => ({
      validate,
      normalize,
      isValid: validate,
    }),
    [validate, normalize]
  );
}
