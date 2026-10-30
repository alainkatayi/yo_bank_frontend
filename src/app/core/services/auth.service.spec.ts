import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { SessionStore } from './session.store';
import { extractRolesFromAccessToken } from '../utils/auth-token';

describe('AuthService', () => {
  it('reads bank roles from a fake access token', () => {
    expect(extractRolesFromAccessToken(encodeJwt({ realm_access: { roles: ['bank-admin'] } }))).toEqual([
      'BANK_ADMIN',
    ]);
    expect(extractRolesFromAccessToken(encodeJwt({ realm_access: { roles: ['bank-auditor'] } }))).toEqual([
      'BANK_AUDITOR',
    ]);
    expect(
      extractRolesFromAccessToken(encodeJwt({ realm_access: { roles: ['BANK_ADMIN', 'bank-auditor'] } })),
    ).toEqual(['BANK_ADMIN', 'BANK_AUDITOR']);
    expect(extractRolesFromAccessToken('not-a-token')).toEqual([]);
    expect(extractRolesFromAccessToken(encodeJwt({ realm_access: { roles: ['wallet-user'] } }))).toEqual([]);
  });

  it('stores the login response and keeps the admin role', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const service = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    const session = TestBed.inject(SessionStore);
    const token = encodeJwt({
      realm_access: { roles: ['bank-admin'] },
      preferred_username: 'admin1',
      exp: Math.floor(Date.now() / 1000) + 1800,
    });

    service.login('admin1', 'admin123').subscribe();
    const request = http.expectOne('http://localhost:9081/bank/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'admin1', password: 'admin123' });
    request.flush({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 1800,
      agent: {
        id: '11111111-1111-1111-1111-111111111111',
        username: 'admin1',
        firstName: 'Amina',
        lastName: 'Admin',
        email: 'admin1@bank.local',
        role: 'BANK_ADMIN',
        enabled: true,
        createdAt: '2026-10-30T12:00:00Z',
      },
    });

    expect(session.accessToken()).toBe(token);
    expect(session.isAdmin()).toBe(true);
    expect(session.displayName()).toBe('Amina Admin');
    http.verify();
  });
});

function encodeJwt(payload: unknown): string {
  return `${encode(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${encode(JSON.stringify(payload))}.sig`;
}

function encode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
