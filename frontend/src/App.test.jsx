
import { render, screen } from '@testing-library/react';
import App from './App';
import { getStatusDisplay, TRUSTED_THRESHOLD, PROBATIONARY_THRESHOLD } from './utils/statusDisplay';

test('renders TrustChain header', () => {
  render(<App />);
  const linkElement = screen.getAllByText(/TrustChain/i)[0];
  expect(linkElement).toBeInTheDocument();
});

describe('getStatusDisplay', () => {
    test('returns INSUFFICIENT DATA for null/undefined/NaN scores', () => {
        // App.test.jsx expects specific color/label format.
        // We need to check if the new getStatusDisplay returns objects with 'color' properties as per App expectations.
        // The shared util includes 'color', 'className', 'label'.
        // We should just check that it contains the expected subset or exact match.
        // The previous test expected { label: ..., color: ... }. The new util returns { label: ..., className: ..., color: ... }.
        // We should update the test to match strict equality or check subset. Let's update to expect the full object or use objectContaining.

        expect(getStatusDisplay(undefined, null)).toEqual(expect.objectContaining({ label: 'INSUFFICIENT DATA', color: 'slate' }));
        expect(getStatusDisplay(undefined, undefined)).toEqual(expect.objectContaining({ label: 'INSUFFICIENT DATA', color: 'slate' }));
        expect(getStatusDisplay(undefined, NaN)).toEqual(expect.objectContaining({ label: 'INSUFFICIENT DATA', color: 'slate' }));
        expect(getStatusDisplay('ERROR', 0.5)).toEqual(expect.objectContaining({ label: 'INSUFFICIENT DATA', color: 'slate' }));
    });

    test('returns NEW ENTITY for PROBATIONARY status', () => {
        expect(getStatusDisplay('PROBATIONARY', 0.5)).toEqual(expect.objectContaining({ label: 'NEW ENTITY', color: 'gold' }));
    });

    test('returns TRUSTED ACTOR for VERIFIED status', () => {
        expect(getStatusDisplay('VERIFIED', 0.5)).toEqual(expect.objectContaining({ label: 'TRUSTED ACTOR', color: 'neon-green' }));
    });

    test('returns TRUSTED ACTOR for scores below threshold', () => {
        expect(getStatusDisplay('OK', TRUSTED_THRESHOLD - 0.01)).toEqual(expect.objectContaining({ label: 'TRUSTED ACTOR', color: 'neon-green' }));
    });

    test('returns NEW ENTITY for scores below probationary threshold', () => {
         expect(getStatusDisplay('OK', PROBATIONARY_THRESHOLD)).toEqual(expect.objectContaining({ label: 'NEW ENTITY', color: 'gold' }));
         expect(getStatusDisplay('OK', TRUSTED_THRESHOLD)).toEqual(expect.objectContaining({ label: 'NEW ENTITY', color: 'gold' }));
    });

    test('returns POTENTIAL SYBIL for high scores', () => {
        expect(getStatusDisplay('OK', PROBATIONARY_THRESHOLD + 0.1)).toEqual(expect.objectContaining({ label: 'POTENTIAL SYBIL 🚨', color: 'red' }));
    });
});
