import { Directive, TemplateRef, ViewContainerRef, effect, inject, untracked } from '@angular/core';
import { SessionStore } from '../services/session.store';

@Directive({
  selector: '[appAdminOnly]',
})
export class AdminOnlyDirective {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);
  private readonly session = inject(SessionStore);

  constructor() {
    effect(() => {
      const admin = this.session.isAdmin();
      untracked(() => {
        this.container.clear();
        if (admin) {
          this.container.createEmbeddedView(this.template);
        }
      });
    });
  }
}
