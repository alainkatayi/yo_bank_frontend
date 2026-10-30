import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { appPaths } from '../config/app-paths';
import { environment } from '../config/environment';
import { SILENT_ERRORS } from '../interceptors/http-context';
import { TokenResponse } from '../models/token-response';
import { extractRolesFromAccessToken, mergeRoles, normalizeRole, sessionExpiry } from '../utils/auth-token';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  readonly user = this.session.agent;
  readonly roles = this.session.roles;
  readonly isAdmin = this.session.isAdmin;
  readonly displayName = this.session.displayName;

  login(username: string, password: string): Observable<void> {
    return this.http
      .post<TokenResponse>(
        `${environment.apiBaseUrl}/bank/auth/login`,
        { username, password },
        { context: new HttpContext().set(SILENT_ERRORS, true) },
      )
      .pipe(
        tap((response) => {
          const roles = mergeRoles(
            extractRolesFromAccessToken(response.access_token),
            normalizeRole(response.agent.role),
          );
          this.session.setSession({
            accessToken: response.access_token,
            expiresAt: sessionExpiry(response.access_token, response.expires_in),
            roles,
            agent: {
              ...response.agent,
              email: response.agent.email ?? null,
            },
          });
        }),
        map(() => undefined),
      );
  }

  logout(): void {
    this.session.clear();
    void this.router.navigateByUrl(appPaths.login);
  }
}
