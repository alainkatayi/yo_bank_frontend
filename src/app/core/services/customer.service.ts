import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import { CreateCustomerPayload, Customer } from '../models/customer';
import { PageResult } from '../models/page-result';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/bank/admin/customers`;

  search(search: string, page: number, size: number): Observable<PageResult<Customer>> {
    let params = new HttpParams().set('page', page).set('size', size);
    const term = search.trim();
    if (term !== '') {
      params = params.set('search', term);
    }
    return this.http.get<PageResult<Customer>>(this.base, { params });
  }

  get(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.base}/${encodeURIComponent(id)}`);
  }

  create(payload: CreateCustomerPayload): Observable<Customer> {
    return this.http.post<Customer>(this.base, payload);
  }

  suspend(id: string): Observable<Customer> {
    return this.http.post<Customer>(`${this.base}/${encodeURIComponent(id)}/suspend`, null);
  }

  reactivate(id: string): Observable<Customer> {
    return this.http.post<Customer>(`${this.base}/${encodeURIComponent(id)}/reactivate`, null);
  }
}
