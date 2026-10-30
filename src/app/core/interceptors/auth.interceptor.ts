import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../config/environment';
import { SessionStore } from '../services/session.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const token = session.accessToken();
  const isApi = req.url.startsWith(environment.apiBaseUrl);
  const isLogin = req.url.startsWith(`${environment.apiBaseUrl}/bank/auth/login`);
  if (!isApi || isLogin || !token) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
