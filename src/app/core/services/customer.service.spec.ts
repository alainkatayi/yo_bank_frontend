import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CustomerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches with pagination and an optional term', () => {
    service.search('kabila', 0, 20).subscribe();
    const request = http.expectOne((call) => call.url === 'http://localhost:9081/bank/admin/customers');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('kabila');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('20');
    request.flush({ items: [], page: 0, size: 20, totalItems: 0 });

    service.search('  ', 1, 20).subscribe();
    const empty = http.expectOne((call) => call.url === 'http://localhost:9081/bank/admin/customers');
    expect(empty.request.params.has('search')).toBe(false);
    expect(empty.request.params.get('page')).toBe('1');
    empty.flush({ items: [], page: 1, size: 20, totalItems: 0 });
  });

  it('creates a customer and posts status changes without a body', () => {
    service
      .create({
        firstName: 'Amina',
        lastName: 'Kabila',
        phone: '+243810000001',
        email: null,
      })
      .subscribe();
    const created = http.expectOne('http://localhost:9081/bank/admin/customers');
    expect(created.request.method).toBe('POST');
    expect(created.request.body).toEqual({
      firstName: 'Amina',
      lastName: 'Kabila',
      phone: '+243810000001',
      email: null,
    });
    created.flush({ id: '33333333-3333-3333-3333-333333333333' });

    const id = '33333333-3333-3333-3333-333333333333';
    service.get(id).subscribe();
    const read = http.expectOne(`http://localhost:9081/bank/admin/customers/${id}`);
    expect(read.request.method).toBe('GET');
    read.flush({});

    service.suspend(id).subscribe();
    const suspended = http.expectOne(`http://localhost:9081/bank/admin/customers/${id}/suspend`);
    expect(suspended.request.method).toBe('POST');
    expect(suspended.request.body).toBeNull();
    suspended.flush({});

    service.reactivate(id).subscribe();
    const restored = http.expectOne(`http://localhost:9081/bank/admin/customers/${id}/reactivate`);
    expect(restored.request.method).toBe('POST');
    restored.flush({});
  });
});
