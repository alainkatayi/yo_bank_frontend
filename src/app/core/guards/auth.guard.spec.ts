import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AdminUser } from '../models/admin-user';
import { BankRole } from '../models/bank-role';
import { SessionStore } from '../services/session.store';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';

@Component({ template: 'ok' })
class Probe {}

describe('auth.guard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'connexion', component: Probe },
          { path: 'acces-refuse', component: Probe },
          { path: 'secure', canActivate: [authGuard], component: Probe },
        ]),
      ],
    });
  });

  afterEach(() => sessionStorage.clear());

  it('redirects an anonymous visitor to the login page', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/secure');
    expect(router.url.startsWith('/connexion')).toBe(true);
  });

  it('redirects an expired session to the login page', async () => {
    signIn(TestBed.inject(SessionStore), 'BANK_ADMIN', Date.now() - 1_000);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/secure');
    expect(router.url.startsWith('/connexion')).toBe(true);
  });

  it('sends a signed-in user without a bank role to the unauthorized page', async () => {
    const store = TestBed.inject(SessionStore);
    store.setSession({
      accessToken: 'token',
      expiresAt: Date.now() + 60_000,
      roles: [],
      agent: agent('OTHER'),
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/secure');
    expect(router.url).toBe('/acces-refuse');
  });

  it('allows an auditor into a read route', async () => {
    signIn(TestBed.inject(SessionStore), 'BANK_AUDITOR');
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/secure');
    expect(router.url).toBe('/secure');
  });
});

describe('role.guard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'connexion', component: Probe },
          { path: 'interdit', component: Probe },
          { path: 'acces-refuse', component: Probe },
          {
            path: 'admin',
            canActivate: [authGuard, roleGuard],
            data: { roles: ['BANK_ADMIN'] },
            component: Probe,
          },
        ]),
      ],
    });
  });

  afterEach(() => sessionStorage.clear());

  it('redirects an auditor away from an admin route', async () => {
    signIn(TestBed.inject(SessionStore), 'BANK_AUDITOR');
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin');
    expect(router.url).toBe('/interdit');
  });

  it('allows an administrator', async () => {
    signIn(TestBed.inject(SessionStore), 'BANK_ADMIN');
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin');
    expect(router.url).toBe('/admin');
  });
});

function signIn(store: SessionStore, role: BankRole, expiresAt = Date.now() + 60_000): void {
  store.setSession({
    accessToken: 'token',
    expiresAt,
    roles: [role],
    agent: agent(role),
  });
}

function agent(role: string): AdminUser {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'admin1',
    firstName: 'Amina',
    lastName: 'Admin',
    email: null,
    role,
    enabled: true,
    createdAt: '2026-10-30T12:00:00Z',
  };
}
