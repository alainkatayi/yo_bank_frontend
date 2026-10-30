import { AuditAction } from './audit-action';
import { AuditTargetType } from './audit-target-type';

export interface AuditLog {
  actorId: string;
  actorUsername: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: string | null;
  createdAt: string;
}
