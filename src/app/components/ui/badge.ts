import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeTone, badgeLabel, badgeTone } from '../../core/config/labels';

const TONE_CLASS: Record<BadgeTone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-neutral-soft text-neutral',
  info: 'bg-info-soft text-info',
};

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="classes()">
      <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
})
export class Badge {
  readonly kind = input.required<'customer' | 'account' | 'operation' | 'role'>();
  readonly value = input.required<string>();

  protected readonly label = computed(() => badgeLabel(this.kind(), this.value()));
  protected readonly classes = computed(
    () =>
      `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASS[badgeTone(this.kind(), this.value())]}`,
  );
}
