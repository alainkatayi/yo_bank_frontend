import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CustomerService } from '../../core/services/customer.service';
import { CustomerListPage } from './customer-list-page';

describe('CustomerListPage', () => {
  const search = vi.fn();

  beforeEach(() => {
    search.mockReset();
    search.mockReturnValue(of({ items: [], page: 0, size: 20, totalItems: 0 }));
    TestBed.configureTestingModule({
      imports: [CustomerListPage],
      providers: [provideRouter([]), { provide: CustomerService, useValue: { search } }],
    });
  });

  it('debounces the search and shows an empty state', async () => {
    const fixture = TestBed.createComponent(CustomerListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucun client');
    expect(search).toHaveBeenCalledWith('', 0, 20);

    const input = fixture.nativeElement.querySelector('input[type="search"]');
    expect(input).toBeInstanceOf(HTMLInputElement);
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    input.value = 'k';
    input.dispatchEvent(new Event('input'));
    input.value = 'kabila';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(search.mock.calls.map((call) => call[0])).not.toContain('kabila');

    await new Promise((resolve) => setTimeout(resolve, 350));
    fixture.detectChanges();

    const terms = search.mock.calls.map((call) => call[0]);
    expect(terms).not.toContain('k');
    expect(terms[terms.length - 1]).toBe('kabila');
    expect(search).toHaveBeenLastCalledWith('kabila', 0, 20);
    expect(fixture.nativeElement.textContent).toContain('Aucun client ne correspond à cette recherche.');
  });
});
