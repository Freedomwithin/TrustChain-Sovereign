import { expect, test } from 'vitest';
import { calculateGini, calculateHHI } from './integrityEngine';

test('calculateGini returns 0 for < 3 transactions', () => {
  expect(calculateGini([])).toBe(0);
  expect(calculateGini([{ amount: 10 }])).toBe(0);
  expect(calculateGini([{ amount: 10 }, { amount: 20 }])).toBe(0);
});

test('calculateGini calculates correct gini', () => {
  // Example: 3 equal transactions -> 0 gini
  expect(calculateGini([{ amount: 10 }, { amount: 10 }, { amount: 10 }])).toBe(0);
});

test('calculateHHI calculates correct HHI', () => {
  expect(calculateHHI([])).toBe(0);
  expect(calculateHHI([{ value: 100 }])).toBe(1); // 100% -> 100^2 / 10000 = 1

  // 50-50 -> 2500 + 2500 = 5000 / 10000 = 0.5
  expect(calculateHHI([{ value: 50 }, { value: 50 }])).toBe(0.5);
});
