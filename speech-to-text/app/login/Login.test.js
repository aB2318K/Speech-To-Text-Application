import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogIn from './page.tsx';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

global.fetch = jest.fn();

describe('LogIn Component', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    pushMock.mockClear();
    useRouter.mockReturnValue({
      push: pushMock,
    });

    jest.clearAllMocks();
  });

  it('renders the LogIn form correctly', () => {
    render(<LogIn />);

    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  
  it('shows validation errors for empty fields', () => {
    render(<LogIn />);

    const submitButton = screen.getByRole('button', { name: 'Log In' });
    fireEvent.click(submitButton);

    const requiredErrors = screen.getAllByText('*This field is required');
    expect(requiredErrors.length).toBe(2);
  });

  it('shows error for incorrect password', async () => {
    render(<LogIn />);

    const emailInput = screen.getByLabelText('Email:');
    const passwordInput = screen.getByLabelText('Password:');
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    // Mocking the API response for incorrect password
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Incorrect password' }),
    });

    const submitButton = screen.getByRole('button', { name: 'Log In' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('*Incorrect password. Please try again or reset your password.')).toBeInTheDocument();
    });
  });

  it('shows error for email not found', async () => {
    render(<LogIn />);

    const emailInput = screen.getByLabelText('Email:');
    const passwordInput = screen.getByLabelText('Password:');
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'somepassword' } });

    // Mocking the API response for email not found
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Email not found' }),
    });

    const submitButton = screen.getByRole('button', { name: 'Log In' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('*This email address was not found. Please check for typos or create a new account.')).toBeInTheDocument();
    });
  });

  it('submits the form successfully with valid data', async () => {
    render(<LogIn />);

    const emailInput = screen.getByLabelText('Email:');
    const passwordInput = screen.getByLabelText('Password:');
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword1!' } });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        userID: '12345',
        token: 'fake-jwt-token',
      }),
    });

    const submitButton = screen.getByRole('button', { name: 'Log In' });
    fireEvent.click(submitButton);

    await waitFor(() => expect(screen.getByText('You have successfully logged in.')).toBeInTheDocument());
    await new Promise(resolve => setTimeout(resolve, 3000)); 
   

    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
  
});
