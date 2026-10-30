import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminUser } from '../models/admin-user';
import { SessionStore } from '../services/session.store';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
  });

  afterEach(() => sessionStorage.clear());

  it('adds a bearer token only for the bank API', () => {
    const session = TestBed.inject(SessionStore);
    session.setSession({
      accessToken: 'jeton-admin',
      expiresAt: Date.now() + 60_000,
      roles: ['BANK_ADMIN'],
      agent: agent(),
    });
    const client = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);

    client.get('http://localhost:9081/bank/admin/customers').subscribe();
    const api = http.expectOne('http://localhost:9081/bank/admin/customers');
    expect(api.request.headers.get('Authorization')).toBe('Bearer jeton-admin');
    api.flush({});

    client.get('http://localhost:9999/autres').subscribe();
    const external = http.expectOne('http://localhost:9999/autres');
    expect(external.request.headers.has('Authorization')).toBe(false);
    external.flush({});

    client.post('http://localhost:9081/bank/auth/login', {}).subscribe();
    const login = http.expectOne('http://localhost:9081/bank/auth/login');
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({});

    http.verify();
  });
});

function agent(): AdminUser {
  return {
    id: '1',
    username: 'admin1',
    firstName: 'Amina',
    lastName: 'Admin',
    email: null,
    role: 'BANK_ADMIN',
    enabled: true,
    createdAt: '2026-10-30T12:00:00Z',
  };
}
