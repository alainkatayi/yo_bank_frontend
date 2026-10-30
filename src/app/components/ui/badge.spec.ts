import { TestBed } from '@angular/core/testing';
import { Badge } from './badge';

describe('Badge', () => {
  it('shows the status label and not a color alone', () => {
    TestBed.configureTestingModule({ imports: [Badge] });
    const fixture = TestBed.createComponent(Badge);
    fixture.componentRef.setInput('kind', 'account');
    fixture.componentRef.setInput('value', 'BLOCKED');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Bloqué');
    const badge = fixture.nativeElement.querySelector('span');
    expect(badge?.className).toContain('bg-warning-soft');
    expect(badge?.className).toContain('text-warning');
  });
});
