import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends optional actor and action filters', () => {
    service.search({ actor: 'admin1', action: 'ACCOUNT_BLOCKED', page: 0, size: 20 }).subscribe();
    const filtered = http.expectOne((call) => call.url === 'http://localhost:9081/bank/admin/audit');
    expect(filtered.request.method).toBe('GET');
    expect(filtered.request.params.get('actor')).toBe('admin1');
    expect(filtered.request.params.get('action')).toBe('ACCOUNT_BLOCKED');
    expect(filtered.request.params.get('page')).toBe('0');
    expect(filtered.request.params.get('size')).toBe('20');
    filtered.flush({ items: [], page: 0, size: 20, totalItems: 0 });

    service.search({ actor: '   ', action: null, page: 2, size: 20 }).subscribe();
    const plain = http.expectOne((call) => call.url === 'http://localhost:9081/bank/admin/audit');
    expect(plain.request.params.has('actor')).toBe(false);
    expect(plain.request.params.has('action')).toBe(false);
    expect(plain.request.params.get('page')).toBe('2');
    plain.flush({ items: [], page: 2, size: 20, totalItems: 0 });
  });
});
