import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ROLE_LABELS, labelFrom } from '../../core/config/labels';
import { AuthService } from '../../core/services/auth.service';
import { SessionStore } from '../../core/services/session.store';
import { Badge } from '../ui/badge';
import { Icon } from '../ui/icon';

@Component({
  selector: 'app-topbar',
  imports: [Icon, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex h-16 items-center justify-between border-b border-line bg-surface px-4 md:px-6">
      <div class="flex items-center gap-3">
        <button type="button" class="rounded-control p-2 text-ink md:hidden" (click)="menu.emit()" aria-label="Ouvrir le menu">
          <app-icon name="menu" />
        </button>
        <p class="hidden items-center gap-2 rounded-full bg-chip px-3 py-1 text-xs font-medium text-muted sm:flex">
          <app-icon name="shield" [size]="14" />
          Session authentifiée
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right">
          <p class="text-sm font-medium text-ink">{{ session.displayName() }}</p>
          <p class="text-xs text-muted">{{ roleName() }}</p>
        </div>
        @if (session.roleLabel(); as role) {
          <app-badge kind="role" [value]="role" />
        }
        <button type="button" class="rounded-control p-2 text-ink hover:bg-chip" (click)="auth.logout()" aria-label="Se déconnecter">
          <app-icon name="logout" />
        </button>
      </div>
    </header>
  `,
})
export class Topbar {
  readonly menu = output<void>();
  protected readonly session = inject(SessionStore);
  protected readonly auth = inject(AuthService);

  protected roleName(): string {
    const role = this.session.roleLabel();
    return role ? labelFrom(ROLE_LABELS, role) : '';
  }
}
