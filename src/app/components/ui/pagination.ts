import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted">
      <p>{{ rangeLabel() }}</p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-control border border-line bg-surface px-3 py-1.5 text-ink disabled:opacity-40"
          [disabled]="page() <= 0"
          (click)="go(page() - 1)"
        >
          Précédent
        </button>
        @for (item of pages(); track item) {
          <button
            type="button"
            class="min-w-8 rounded-control px-2 py-1.5"
            [class.bg-navy]="item === page()"
            [class.text-on-navy]="item === page()"
            [class.text-ink]="item !== page()"
            [attr.aria-current]="item === page() ? 'page' : null"
            (click)="go(item)"
          >
            {{ item + 1 }}
          </button>
        }
        <button
          type="button"
          class="rounded-control border border-line bg-surface px-3 py-1.5 text-ink disabled:opacity-40"
          [disabled]="page() >= totalPages() - 1"
          (click)="go(page() + 1)"
        >
          Suivant
        </button>
      </div>
    </div>
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly size = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly totalPages = computed(() => {
    const size = this.size();
    if (size <= 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(this.totalItems() / size));
  });

  protected readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const windowSize = 5;
    let start = Math.max(0, current - 2);
    const end = Math.min(total - 1, start + windowSize - 1);
    start = Math.max(0, end - windowSize + 1);
    const list: number[] = [];
    for (let index = start; index <= end; index += 1) {
      list.push(index);
    }
    return list;
  });

  protected readonly rangeLabel = computed(() => {
    const total = this.totalItems();
    if (total === 0) {
      return 'Aucun élément';
    }
    const start = this.page() * this.size() + 1;
    const end = Math.min(total, (this.page() + 1) * this.size());
    return `Affichage ${start}–${end} sur ${total}`;
  });

  protected go(next: number): void {
    if (next < 0 || next >= this.totalPages() || next === this.page()) {
      return;
    }
    this.pageChange.emit(next);
  }
}
