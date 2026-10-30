import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  it('keeps the reinforced confirmation disabled until the phrase matches', () => {
    TestBed.configureTestingModule({ imports: [ConfirmDialog] });
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.componentRef.setInput('title', 'Clôturer le compte');
    fixture.componentRef.setInput('message', 'Cette action est définitive.');
    fixture.componentRef.setInput('confirmPhrase', '9012');
    fixture.componentRef.setInput('phraseLabel', 'Saisissez les 4 derniers chiffres');
    fixture.detectChanges();

    const button = confirmButton(fixture.nativeElement);
    expect(button.disabled).toBe(true);

    const input = fixture.nativeElement.querySelector('input');
    expect(input).toBeInstanceOf(HTMLInputElement);
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    input.value = '0000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(button.disabled).toBe(true);

    const confirmed: number[] = [];
    fixture.componentInstance.confirmed.subscribe(() => confirmed.push(1));
    input.value = '9012';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
    button.click();
    expect(confirmed).toEqual([1]);
  });
});

function confirmButton(root: HTMLElement): HTMLButtonElement {
  const marker = root.querySelector('[data-confirm]');
  const button = marker?.closest('button');
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Bouton de confirmation introuvable');
  }
  return button;
}
