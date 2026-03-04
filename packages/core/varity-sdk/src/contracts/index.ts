/**
 * Contract ABIs and addresses for Varity smart contracts.
 *
 * @example
 * ```typescript
 * import { CONTRACT_ADDRESSES } from '@varity-labs/sdk/contracts'
 * ```
 */

// Deployed contract addresses (Varity L3 — Chain ID 33529)
export const CONTRACT_ADDRESSES = {
  TemplateMarketplace: '0x5EfAF2219F9957461125485Eae49Bac07505bB34',
  TemplateRegistry: '0x1697055bf6d135934F1F533f43eCE8CA469325Ed',
  VarityAppRegistry: '0xbf9f4849a5508e9f271c30205c1ce924328e5e1c',
  SimplifiedPaymaster: '0x579772Bfa5Ec1e8f33B81F304ffDbC55135db154',
  VarityWalletFactory: '0x23dcca8E063CB0Eea8Ec6e56657c07E11fFa4E78',
} as const;

export type ContractName = keyof typeof CONTRACT_ADDRESSES;
