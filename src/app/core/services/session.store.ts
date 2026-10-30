import { Injectable, computed, signal } from '@angular/core';
import { AdminUser } from '../models/admin-user';
import { BankRole, isBankRole } from '../models/bank-role';
import { isRecord, readString } from '../utils/type-guards';

const STORAGE_KEY = 'yo-bank.session';

export interface PersistedSession {
  accessToken: string;
  expiresAt: number;
  roles: BankRole[];
  agent: AdminUser;
}

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly state = signal<PersistedSession | null>(readStoredSession());

  readonly session = this.state.asReadonly();
  readonly roles = computed(() => this.state()?.roles ?? []);
  readonly agent = computed(() => this.state()?.agent ?? null);
  readonly isAdmin = computed(() => this.roles().includes('BANK_ADMIN'));
  readonly hasBankAccess = computed(() => this.roles().length > 0);
  readonly displayName = computed(() => {
    const agent = this.agent();
    if (!agent) {
      return '';
    }
    const name = `${agent.firstName} ${agent.lastName}`.trim();
    return name || agent.username;
  });
  readonly roleLabel = computed(() => this.roles()[0] ?? '');

  isAuthenticated(): boolean {
    const current = this.state();
    return current !== null && current.expiresAt > Date.now();
  }

  accessToken(): string | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.state()?.accessToken ?? null;
  }

  setSession(session: PersistedSession): void {
    this.state.set(session);
    writeStoredSession(session);
  }

  clear(): void {
    this.state.set(null);
    writeStoredSession(null);
  }
}

function readStoredSession(): PersistedSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const session = parseSession(raw);
    if (!session || session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function writeStoredSession(session: PersistedSession | null): void {
  try {
    if (session === null) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // La session reste en mémoire si le navigateur refuse le stockage.
  }
}

function parseSession(raw: string): PersistedSession | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) {
      return null;
    }
    const accessToken = readString(value['accessToken']);
    const expiresAt = value['expiresAt'];
    const agent = value['agent'];
    const rolesRaw = value['roles'];
    if (!accessToken || typeof expiresAt !== 'number' || !isRecord(agent) || !Array.isArray(rolesRaw)) {
      return null;
    }
    const id = readString(agent['id']);
    const username = readString(agent['username']);
    const firstName = readString(agent['firstName']);
    const lastName = readString(agent['lastName']);
    const role = readString(agent['role']);
    const createdAt = readString(agent['createdAt']);
    const enabled = agent['enabled'];
    if (
      !id ||
      !username ||
      firstName === null ||
      lastName === null ||
      !role ||
      !createdAt ||
      typeof enabled !== 'boolean'
    ) {
      return null;
    }
    const email = agent['email'];
    return {
      accessToken,
      expiresAt,
      roles: rolesRaw.filter(isBankRole),
      agent: {
        id,
        username,
        firstName,
        lastName,
        role,
        enabled,
        createdAt,
        email: typeof email === 'string' ? email : null,
      },
    };
  } catch {
    return null;
  }
}
