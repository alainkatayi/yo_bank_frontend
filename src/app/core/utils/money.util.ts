const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
const DISPLAY_PATTERN = /^-?\d+(\.\d+)?$/;
const GROUP_SEPARATOR = '\u202f';
const CURRENCY_SEPARATOR = '\u00a0';

export function normalizeMoneyInput(value: string): string {
  return value.trim().replace(/\s/g, '').replace(',', '.');
}

export function isValidMoney(value: string): boolean {
  return MONEY_PATTERN.test(normalizeMoneyInput(value));
}

export function isPositiveMoney(value: string): boolean {
  const normalized = normalizeMoneyInput(value);
  if (!MONEY_PATTERN.test(normalized)) {
    return false;
  }
  const [whole, fraction = ''] = normalized.split('.');
  return /[1-9]/.test(`${whole ?? ''}${fraction}`);
}

export function formatMoney(amount: string): string {
  const trimmed = amount.trim();
  const negative = trimmed.startsWith('-');
  const raw = negative ? trimmed.slice(1) : trimmed;
  if (!DISPLAY_PATTERN.test(negative ? `-${raw}` : raw) || raw === '') {
    return amount;
  }
  const [whole, fraction = ''] = raw.split('.');
  const grouped = groupDigits(whole ?? '0');
  const decimals = fraction.length < 2 ? `${fraction}00`.slice(0, 2) : fraction;
  const sign = negative ? '-' : '';
  return `${sign}${grouped},${decimals}${CURRENCY_SEPARATOR}CDF`;
}

function groupDigits(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
}
