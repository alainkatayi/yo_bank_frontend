export interface FieldError {
  field: string;
  message: string;
}

export interface ProblemDetail {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
  errors?: FieldError[];
  instance?: string;
}

export class ApiProblem extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly detail: string | null;
  readonly errors: readonly FieldError[];
  readonly userMessage: string;

  constructor(init: {
    status: number;
    code: string | null;
    detail: string | null;
    errors: readonly FieldError[];
    userMessage: string;
  }) {
    super(init.userMessage);
    this.name = 'ApiProblem';
    this.status = init.status;
    this.code = init.code;
    this.detail = init.detail;
    this.errors = init.errors;
    this.userMessage = init.userMessage;
  }
}
