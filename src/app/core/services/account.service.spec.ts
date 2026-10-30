import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccountService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists and opens accounts, then posts a string amount', () => {
    const customerId = '33333333-3333-3333-3333-333333333333';
    service.list(customerId).subscribe();
    const list = http.expectOne(`http://localhost:9081/bank/admin/customers/${customerId}/accounts`);
    expect(list.request.method).toBe('GET');
    list.flush([]);

    service.open(customerId).subscribe();
    const opened = http.expectOne(`http://localhost:9081/bank/admin/customers/${customerId}/accounts`);
    expect(opened.request.method).toBe('POST');
    expect(opened.request.body).toBeNull();
    opened.flush({ accountNumber: '123456789012', balance: '0.00', status: 'ACTIVE' });

    service.deposit('123456789012', '100000.00').subscribe();
    const deposit = http.expectOne('http://localhost:9081/bank/admin/accounts/123456789012/deposit');
    expect(deposit.request.body).toEqual({ amount: '100000.00' });
    const body: unknown = deposit.request.body;
    if (body && typeof body === 'object' && 'amount' in body) {
      expect(typeof body.amount).toBe('string');
    }
    deposit.flush({});

    service.block('123456789012').subscribe();
    const blocked = http.expectOne('http://localhost:9081/bank/admin/accounts/123456789012/block');
    expect(blocked.request.method).toBe('POST');
    expect(blocked.request.body).toBeNull();
    blocked.flush({});

    service.unblock('123456789012').subscribe();
    http.expectOne('http://localhost:9081/bank/admin/accounts/123456789012/unblock').flush({});

    service.close('123456789012').subscribe();
    http.expectOne('http://localhost:9081/bank/admin/accounts/123456789012/close').flush({});
  });
});
