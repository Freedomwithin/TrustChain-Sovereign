import { render, screen } from '@testing-library/react';
import App from './App';

test('renders TrustChain header', () => {
  render(<App />);
  const linkElement = screen.getAllByText(/TrustChain/i)[0];
  expect(linkElement).toBeInTheDocument();
});
