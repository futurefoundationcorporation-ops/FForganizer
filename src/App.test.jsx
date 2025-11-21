import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, it, vi } from 'vitest';

it('should render the app without console errors', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error');
  render(<App />);
  expect(consoleErrorSpy).not.toHaveBeenCalled();
});
