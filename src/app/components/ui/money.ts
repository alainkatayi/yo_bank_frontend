import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatMoney } from '../../core/utils/money.util';

@Component({
  selector: 'app-money',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="font-semibold text-money tabular-nums">{{ formatted() }}</span>`,
})
export class Money {
  readonly amount = input.required<string>();
  protected readonly formatted = computed(() => formatMoney(this.amount()));
}
