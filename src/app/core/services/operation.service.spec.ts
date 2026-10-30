import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OperationService } from './operation.service';

describe('OperationService', () => {
  let service: OperationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OperationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends optional type and status filters', () => {
    service.list('123456789012', { type: 'DEBIT', status: 'SUCCESS', page: 0, size: 20 }).subscribe();
    const filtered = http.expectOne(
      (call) => call.url === 'http://localhost:9081/bank/admin/accounts/123456789012/operations',
    );
    expect(filtered.request.method).toBe('GET');
    expect(filtered.request.params.get('type')).toBe('DEBIT');
    expect(filtered.request.params.get('status')).toBe('SUCCESS');
    expect(filtered.request.params.get('page')).toBe('0');
    expect(filtered.request.params.get('size')).toBe('20');
    filtered.flush({ items: [], page: 0, size: 20, totalItems: 0 });

    service.list('123456789012', { type: null, status: null, page: 1, size: 20 }).subscribe();
    const plain = http.expectOne(
      (call) => call.url === 'http://localhost:9081/bank/admin/accounts/123456789012/operations',
    );
    expect(plain.request.params.has('type')).toBe(false);
    expect(plain.request.params.has('status')).toBe(false);
    expect(plain.request.params.get('page')).toBe('1');
    plain.flush({ items: [], page: 1, size: 20, totalItems: 0 });
  });
});
