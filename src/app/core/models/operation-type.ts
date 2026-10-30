export const OPERATION_TYPES = ['DEBIT', 'CREDIT'] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];

export function isOperationType(value: string): value is OperationType {
  return (OPERATION_TYPES as readonly string[]).includes(value);
}
