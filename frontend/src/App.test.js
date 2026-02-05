import { render, screen } from '@testing-library/react';
import App from './App';

test('renders TrustChain header', () => {
  render(<App />);
  const linkElement = screen.getByText(/TrustChain/i);
  expect(linkElement).toBeInTheDocument();
});
