import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('disables the previous control on the first page and emits the next page', () => {
    TestBed.configureTestingModule({ imports: [Pagination] });
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', 0);
    fixture.componentRef.setInput('size', 20);
    fixture.componentRef.setInput('totalItems', 45);
    fixture.detectChanges();

    const buttons = [...fixture.nativeElement.querySelectorAll('button')];
    const previous = buttons.find((button) => button.textContent?.includes('Précédent'));
    const next = buttons.find((button) => button.textContent?.includes('Suivant'));
    expect(previous).toBeInstanceOf(HTMLButtonElement);
    expect(next).toBeInstanceOf(HTMLButtonElement);
    if (!(previous instanceof HTMLButtonElement) || !(next instanceof HTMLButtonElement)) {
      return;
    }
    expect(previous.disabled).toBe(true);

    const pages: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => pages.push(page));
    next.click();
    expect(pages).toEqual([1]);
    expect(fixture.nativeElement.textContent).toContain('Affichage 1–20 sur 45');
  });
});
