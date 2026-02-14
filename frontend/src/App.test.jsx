
import { render, screen } from '@testing-library/react';
import App, { getStatusDisplay, TRUSTED_THRESHOLD, PROBATIONARY_THRESHOLD } from './App';

test('renders TrustChain header', () => {
  render(<App />);
  const linkElement = screen.getAllByText(/TrustChain/i)[0];
  expect(linkElement).toBeInTheDocument();
});

describe('getStatusDisplay', () => {
    test('returns INSUFFICIENT DATA for null/undefined/NaN scores', () => {
        expect(getStatusDisplay(undefined, null)).toEqual({ label: 'INSUFFICIENT DATA', color: 'slate' });
        expect(getStatusDisplay(undefined, undefined)).toEqual({ label: 'INSUFFICIENT DATA', color: 'slate' });
        expect(getStatusDisplay(undefined, NaN)).toEqual({ label: 'INSUFFICIENT DATA', color: 'slate' });
        expect(getStatusDisplay('ERROR', 0.5)).toEqual({ label: 'INSUFFICIENT DATA', color: 'slate' });
    });

    test('returns NEW ENTITY for PROBATIONARY status', () => {
        expect(getStatusDisplay('PROBATIONARY', 0.5)).toEqual({ label: 'NEW ENTITY', color: 'gold' });
    });

    test('returns TRUSTED ACTOR for VERIFIED status', () => {
        expect(getStatusDisplay('VERIFIED', 0.5)).toEqual({ label: 'TRUSTED ACTOR', color: 'neon-green' });
    });

    test('returns TRUSTED ACTOR for scores below threshold', () => {
        expect(getStatusDisplay('OK', TRUSTED_THRESHOLD - 0.01)).toEqual({ label: 'TRUSTED ACTOR', color: 'neon-green' });
    });

    test('returns NEW ENTITY for scores below probationary threshold', () => {
         expect(getStatusDisplay('OK', PROBATIONARY_THRESHOLD)).toEqual({ label: 'NEW ENTITY', color: 'gold' });
         expect(getStatusDisplay('OK', TRUSTED_THRESHOLD)).toEqual({ label: 'NEW ENTITY', color: 'gold' });
    });

    test('returns POTENTIAL SYBIL for high scores', () => {
        expect(getStatusDisplay('OK', PROBATIONARY_THRESHOLD + 0.1)).toEqual({ label: 'POTENTIAL SYBIL 🚨', color: 'red' });
    });
});
