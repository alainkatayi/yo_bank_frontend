import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import { AuditAction } from '../models/audit-action';
import { AuditLog } from '../models/audit-log';
import { PageResult } from '../models/page-result';

export interface AuditQuery {
  actor: string;
  action: AuditAction | null;
  page: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);

  search(query: AuditQuery): Observable<PageResult<AuditLog>> {
    let params = new HttpParams().set('page', query.page).set('size', query.size);
    const actor = query.actor.trim();
    if (actor !== '') {
      params = params.set('actor', actor);
    }
    if (query.action) {
      params = params.set('action', query.action);
    }
    return this.http.get<PageResult<AuditLog>>(`${environment.apiBaseUrl}/bank/admin/audit`, { params });
  }
}
