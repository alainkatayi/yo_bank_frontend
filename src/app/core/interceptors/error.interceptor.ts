import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { appPaths } from '../config/app-paths';
import { messageFor } from '../config/problem-messages';
import { ApiProblem, FieldError } from '../models/problem-detail';
import { ToastService } from '../services/toast.service';
import { SessionStore } from '../services/session.store';
import { isRecord, readString } from '../utils/type-guards';
import { SILENT_ERRORS } from './http-context';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);
  const session = inject(SessionStore);
  return next(req).pipe(
    catchError((error: unknown) => {
      const silent = req.context.get(SILENT_ERRORS);
      const problem = toApiProblem(error);
      if (!silent) {
        toast.error(problem.userMessage);
        if (problem.status === 401) {
          session.clear();
          if (!router.url.startsWith(appPaths.login)) {
            void router.navigateByUrl(appPaths.login);
          }
        }
      }
      return throwError(() => problem);
    }),
  );
};

export function toApiProblem(error: unknown): ApiProblem {
  if (error instanceof ApiProblem) {
    return error;
  }
  if (error instanceof HttpErrorResponse) {
    const body = readProblem(error.error);
    const status = error.status;
    return new ApiProblem({
      status,
      code: body.code,
      detail: body.detail,
      errors: body.errors,
      userMessage: messageFor(status, body.code),
    });
  }
  return new ApiProblem({
    status: 0,
    code: null,
    detail: null,
    errors: [],
    userMessage: messageFor(0, null),
  });
}

function readProblem(value: unknown): { code: string | null; detail: string | null; errors: FieldError[] } {
  const record = typeof value === 'string' ? parseJson(value) : value;
  if (!isRecord(record)) {
    return { code: null, detail: null, errors: [] };
  }
  return {
    code: readString(record['code']),
    detail: readString(record['detail']),
    errors: readErrors(record['errors']),
  };
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function readErrors(value: unknown): FieldError[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const errors: FieldError[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const field = readString(item['field']);
    if (!field) {
      continue;
    }
    errors.push({ field, message: readString(item['message']) ?? '' });
  }
  return errors;
}
