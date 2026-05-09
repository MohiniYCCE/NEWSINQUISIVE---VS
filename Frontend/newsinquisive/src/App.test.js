import { render, screen } from '@testing-library/react';
import App from './App';

test('renders article URL input and analyze button', () => {
  render(<App />);

  expect(screen.getByPlaceholderText(/enter article url/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /analyze/i })).toBeDisabled();
});
