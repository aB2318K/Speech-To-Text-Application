import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Reset from './page.tsx'; 

global.fetch = jest.fn();

describe('Reset Component', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the Reset component correctly', () => {
    render(<Reset />);
    
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send link/i })).toBeInTheDocument();
  });

  test('shows error message when an invalid email is provided', async () => {
    render(<Reset />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send link/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('*Please provide a valid email address in the format: example@domain.com')).toBeInTheDocument();
    });
  });

  test('shows success message when email is valid and reset link is sent', async () => {
    render(<Reset />);

    global.fetch.mockResolvedValueOnce({
      ok: true,
    });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send link/i });

    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('A password reset link has been sent to your email')).toBeInTheDocument();
    });
  });

  test('shows error message when email is not found', async () => {
    render(<Reset />);

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send link/i });

    fireEvent.change(emailInput, { target: { value: 'notfound@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('*Email not found. Please check for typos or create a new account.')).toBeInTheDocument();
    });
  });
});
