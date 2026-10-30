import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start justify-between gap-3 rounded-control border px-4 py-3 text-sm shadow-card"
          [class.border-success]="toast.tone === 'success'"
          [class.bg-success-soft]="toast.tone === 'success'"
          [class.text-success]="toast.tone === 'success'"
          [class.border-danger]="toast.tone === 'error'"
          [class.bg-danger-soft]="toast.tone === 'error'"
          [class.text-danger]="toast.tone === 'error'"
          [attr.role]="toast.tone === 'error' ? 'alert' : 'status'"
        >
          <p>{{ toast.message }}</p>
          <button type="button" class="font-medium" (click)="toasts.dismiss(toast.id)">Fermer</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected readonly toasts = inject(ToastService);
}
