import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import { Account } from '../models/account';
import { AccountOperation } from '../models/operation';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/bank/admin`;

  list(customerId: string): Observable<Account[]> {
    return this.http.get<Account[]>(
      `${this.base}/customers/${encodeURIComponent(customerId)}/accounts`,
    );
  }

  open(customerId: string): Observable<Account> {
    return this.http.post<Account>(
      `${this.base}/customers/${encodeURIComponent(customerId)}/accounts`,
      null,
    );
  }

  deposit(accountNumber: string, amount: string): Observable<AccountOperation> {
    return this.http.post<AccountOperation>(
      `${this.base}/accounts/${encodeURIComponent(accountNumber)}/deposit`,
      { amount },
    );
  }

  block(accountNumber: string): Observable<Account> {
    return this.http.post<Account>(`${this.accounts(accountNumber)}/block`, null);
  }

  unblock(accountNumber: string): Observable<Account> {
    return this.http.post<Account>(`${this.accounts(accountNumber)}/unblock`, null);
  }

  close(accountNumber: string): Observable<Account> {
    return this.http.post<Account>(`${this.accounts(accountNumber)}/close`, null);
  }

  private accounts(accountNumber: string): string {
    return `${this.base}/accounts/${encodeURIComponent(accountNumber)}`;
  }
}
