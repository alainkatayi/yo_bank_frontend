import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error';

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<readonly ToastMessage[]>([]);
  private nextId = 1;
  readonly toasts = this.items.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((toast) => toast.id !== id));
  }

  private push(tone: ToastTone, message: string): void {
    const id = this.nextId;
    this.nextId += 1;
    this.items.update((list) => [...list, { id, tone, message }]);
    window.setTimeout(() => this.dismiss(id), 5000);
  }
}
