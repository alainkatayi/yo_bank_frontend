import { BankRole } from '../models/bank-role';
import { isRecord } from './type-guards';

export function normalizeRole(value: string | null | undefined): BankRole | null {
  if (!value) {
    return null;
  }
  const key = value.trim().toLowerCase().replaceAll('_', '-');
  if (key === 'bank-admin') {
    return 'BANK_ADMIN';
  }
  if (key === 'bank-auditor') {
    return 'BANK_AUDITOR';
  }
  return null;
}

export function extractRolesFromAccessToken(token: string): BankRole[] {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return [];
  }
  const realm = payload['realm_access'];
  if (!isRecord(realm) || !Array.isArray(realm['roles'])) {
    return [];
  }
  const roles: BankRole[] = [];
  for (const role of realm['roles']) {
    if (typeof role !== 'string') {
      continue;
    }
    const normalized = normalizeRole(role);
    if (normalized && !roles.includes(normalized)) {
      roles.push(normalized);
    }
  }
  return roles;
}

export function readJwtExp(token: string): number | null {
  const payload = decodeJwtPayload(token);
  const exp = payload?.['exp'];
  return typeof exp === 'number' ? exp : null;
}

export function sessionExpiry(token: string, expiresIn: number, now = Date.now()): number {
  const fromResponse = now + expiresIn * 1000;
  const exp = readJwtExp(token);
  if (exp === null) {
    return fromResponse;
  }
  return Math.min(fromResponse, exp * 1000);
}

export function mergeRoles(fromToken: readonly BankRole[], fromAgent: BankRole | null): BankRole[] {
  const roles = [...fromToken];
  if (fromAgent && !roles.includes(fromAgent)) {
    roles.push(fromAgent);
  }
  return roles;
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(payload));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
