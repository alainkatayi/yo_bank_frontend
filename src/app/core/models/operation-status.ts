export const OPERATION_STATUSES = ['SUCCESS', 'REJECTED'] as const;
export type OperationStatus = (typeof OPERATION_STATUSES)[number];

export function isOperationStatus(value: string): value is OperationStatus {
  return (OPERATION_STATUSES as readonly string[]).includes(value);
}
