import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import { AccountOperation } from '../models/operation';
import { OperationStatus } from '../models/operation-status';
import { OperationType } from '../models/operation-type';
import { PageResult } from '../models/page-result';

export interface OperationQuery {
  type: OperationType | null;
  status: OperationStatus | null;
  page: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class OperationService {
  private readonly http = inject(HttpClient);

  list(accountNumber: string, query: OperationQuery): Observable<PageResult<AccountOperation>> {
    let params = new HttpParams().set('page', query.page).set('size', query.size);
    if (query.type) {
      params = params.set('type', query.type);
    }
    if (query.status) {
      params = params.set('status', query.status);
    }
    return this.http.get<PageResult<AccountOperation>>(
      `${environment.apiBaseUrl}/bank/admin/accounts/${encodeURIComponent(accountNumber)}/operations`,
      { params },
    );
  }
}
