import { formatMoney, isPositiveMoney, isValidMoney, normalizeMoneyInput } from './money.util';

const CDF = '\u00a0CDF';
const SPACE = '\u202f';

describe('money.util', () => {
  it('accepts a canonical amount and rejects more than two decimals', () => {
    expect(isValidMoney('0.00')).toBe(true);
    expect(isValidMoney('0')).toBe(true);
    expect(isValidMoney('100000.00')).toBe(true);
    expect(isValidMoney('10.5')).toBe(true);
    expect(isValidMoney('100,50')).toBe(true);
    expect(isValidMoney('10.555')).toBe(false);
    expect(isValidMoney('')).toBe(false);
    expect(isValidMoney('10.')).toBe(false);
    expect(isValidMoney('-1.00')).toBe(false);
    expect(isValidMoney('1e2')).toBe(false);
  });

  it('treats zero as a valid amount that is not strictly positive', () => {
    expect(isPositiveMoney('0.00')).toBe(false);
    expect(isPositiveMoney('0')).toBe(false);
    expect(isPositiveMoney('00.00')).toBe(false);
    expect(isPositiveMoney('0.01')).toBe(true);
    expect(isPositiveMoney('100000.00')).toBe(true);
    expect(isPositiveMoney('10.555')).toBe(false);
  });

  it('normalizes a French decimal comma and grouping spaces', () => {
    expect(normalizeMoneyInput('100 000,50')).toBe('100000.50');
  });

  it('formats zero, padded decimals and keeps extra fractional digits', () => {
    expect(formatMoney('0.00')).toBe(`0,00${CDF}`);
    expect(formatMoney('1.5')).toBe(`1,50${CDF}`);
    expect(formatMoney('1.234')).toBe(`1,234${CDF}`);
    expect(formatMoney('abc')).toBe('abc');
  });

  it('formats a large amount without losing integer digits', () => {
    const formatted = formatMoney('9007199254740993.01');
    expect(formatted.replace(/[^\d]/g, '')).toBe('900719925474099301');
    expect(formatted.includes('e')).toBe(false);
    expect(formatted).toBe(`9${SPACE}007${SPACE}199${SPACE}254${SPACE}740${SPACE}993,01${CDF}`);
  });

  it('groups a corporate balance the French way', () => {
    expect(formatMoney('14850200.00')).toBe(`14${SPACE}850${SPACE}200,00${CDF}`);
  });
});
