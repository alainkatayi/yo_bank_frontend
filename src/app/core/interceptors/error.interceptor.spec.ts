import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PROBLEM_MESSAGES, TOAST, messageFor } from '../config/problem-messages';
import { ApiProblem } from '../models/problem-detail';
import { SessionStore } from '../services/session.store';
import { ToastService } from '../services/toast.service';
import { errorInterceptor } from './error.interceptor';
import { SILENT_ERRORS } from './http-context';

describe('messageFor', () => {
  it('prefers the HTTP status over a concurrent-update code on 503', () => {
    expect(messageFor(503, 'CONCURRENT_UPDATE')).toBe(TOAST.unavailable);
    expect(messageFor(409, 'ACCOUNT_NOT_EMPTY')).toBe(PROBLEM_MESSAGES['ACCOUNT_NOT_EMPTY']);
    expect(messageFor(400, 'DUPLICATE_PHONE')).toBe(PROBLEM_MESSAGES['DUPLICATE_PHONE']);
    expect(messageFor(500, 'INTERNAL_ERROR')).toBe(TOAST.generic);
  });
});

describe('errorInterceptor', () => {
  const toast = { error: vi.fn(), success: vi.fn(), dismiss: vi.fn() };

  beforeEach(() => {
    sessionStorage.clear();
    toast.error.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'connexion', children: [] }]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toast },
      ],
    });
    const session = TestBed.inject(SessionStore);
    session.setSession({
      accessToken: 'jeton',
      expiresAt: Date.now() + 60_000,
      roles: ['BANK_ADMIN'],
      agent: {
        id: '1',
        username: 'admin1',
        firstName: 'Amina',
        lastName: 'Admin',
        email: null,
        role: 'BANK_ADMIN',
        enabled: true,
        createdAt: '2026-10-30T12:00:00Z',
      },
    });
  });

  afterEach(() => sessionStorage.clear());

  it('maps a validation problem and keeps field errors', async () => {
    const problem = await flushError(
      {
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: 'La requête est invalide',
        errors: [{ field: 'phone', message: 'invalide' }],
      },
      400,
    );
    expect(problem).toBeInstanceOf(ApiProblem);
    if (problem instanceof ApiProblem) {
      expect(problem.code).toBe('VALIDATION_ERROR');
      expect(problem.userMessage).toBe(PROBLEM_MESSAGES['VALIDATION_ERROR']);
      expect(problem.errors).toEqual([{ field: 'phone', message: 'invalide' }]);
    }
    expect(toast.error).toHaveBeenCalledWith(PROBLEM_MESSAGES['VALIDATION_ERROR']);
  });

  it('uses the fixed forbidden and unavailable toasts', async () => {
    await flushError({ status: 403, code: 'FORBIDDEN', detail: 'Accès refusé' }, 403);
    expect(toast.error).toHaveBeenCalledWith('Action non autorisée');

    await flushError({ status: 503, code: 'CONCURRENT_UPDATE', detail: 'conflit' }, 503);
    expect(toast.error).toHaveBeenCalledWith('Service momentanément indisponible, réessayez');
  });

  it('hides technical details of a server error', async () => {
    const problem = await flushError(
      { status: 500, detail: 'java.lang.NullPointerException', code: 'INTERNAL_ERROR' },
      500,
    );
    expect(toast.error).toHaveBeenCalledWith(TOAST.generic);
    expect(JSON.stringify(toast.error.mock.calls)).not.toContain('NullPointer');
    if (problem instanceof ApiProblem) {
      expect(problem.userMessage).not.toContain('NullPointer');
    }
  });

  it('clears the session and redirects on 401', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await flushError({ status: 401, code: 'UNAUTHENTICATED', detail: 'Authentification requise' }, 401);
    expect(TestBed.inject(SessionStore).accessToken()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/connexion');
    expect(toast.error).toHaveBeenCalledWith(TOAST.expired);
  });

  it('stays silent when the caller handles the error', async () => {
    const client = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);
    const pending = firstValueFrom(
      client
        .post('http://localhost:9081/bank/auth/login', {}, { context: new HttpContext().set(SILENT_ERRORS, true) })
        .pipe(catchError((error: unknown) => of(error))),
    );
    http
      .expectOne('http://localhost:9081/bank/auth/login')
      .flush({ status: 401, code: 'UNAUTHENTICATED' }, { status: 401, statusText: 'Unauthorized' });
    const problem = await pending;
    expect(problem).toBeInstanceOf(ApiProblem);
    expect(toast.error).not.toHaveBeenCalled();
    expect(TestBed.inject(SessionStore).accessToken()).toBe('jeton');
  });
});

async function flushError(body: Record<string, unknown>, status: number): Promise<unknown> {
  const client = TestBed.inject(HttpClient);
  const http = TestBed.inject(HttpTestingController);
  const pending = firstValueFrom(
    client.get('http://localhost:9081/bank/admin/customers').pipe(catchError((error: unknown) => of(error))),
  );
  http
    .expectOne('http://localhost:9081/bank/admin/customers')
    .flush(body, { status, statusText: 'error' });
  return pending;
}
