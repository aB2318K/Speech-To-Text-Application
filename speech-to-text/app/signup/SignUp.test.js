import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignUp from './page.tsx';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

global.fetch = jest.fn();

describe('SignUp Component', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    pushMock.mockClear();
    useRouter.mockReturnValue({
      push: pushMock,
    });
    fetch.mockClear();
  });

  it('renders the SignUp form correctly', () => {
    render(<SignUp />);
    expect(screen.getByText('Sign Up', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByLabelText('First Name:')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name:')).toBeInTheDocument();
    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', () => {
    render(<SignUp />);

    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    fireEvent.click(submitButton);
    const requiredErrors = screen.getAllByText('*This field is required');
    expect(requiredErrors.length).toBe(2);

    expect(screen.getByText('*Please provide a valid email address in the format: example@domain.com')).toBeInTheDocument();
    expect(screen.getByText('*Your password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character')).toBeInTheDocument();
  });

  it('validates correct email format', () => {
    render(<SignUp />);

    const emailInput = screen.getByLabelText('Email:');
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('*Please provide a valid email address in the format: example@domain.com')).toBeInTheDocument();
  });

  it('validates correct password format', () => {
    render(<SignUp />);

    const passwordInput = screen.getByLabelText('Password:');
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    fireEvent.change(passwordInput, { target: { value: 'weakpass' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('*Your password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character')).toBeInTheDocument();
  });

  it('submits the form with valid data', async () => {
    render(<SignUp />);
  
    const firstNameInput = screen.getByLabelText('First Name:');
    const lastNameInput = screen.getByLabelText('Last Name:');
    const emailInput = screen.getByLabelText('Email:');
    const passwordInput = screen.getByLabelText('Password:');
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });
  
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword1!' } });
  
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' }),
    });
  
    fireEvent.click(submitButton);

    await waitFor(() => expect(screen.getByText('You have successfully created an account. Redirecting to Login Page...')).toBeInTheDocument());
  
    await new Promise(resolve => setTimeout(resolve, 3000)); 
  
    expect(pushMock).toHaveBeenCalledWith('/login');
  });
  

  it('handles server error during form submission', async () => {
    render(<SignUp />);

    const firstNameInput = screen.getByLabelText('First Name:');
    const lastNameInput = screen.getByLabelText('Last Name:');
    const emailInput = screen.getByLabelText('Email:');
    const passwordInput = screen.getByLabelText('Password:');
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword1!' } });

    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Email already in use' }),
    });

    fireEvent.click(submitButton);

    await waitFor(() => expect(screen.getByText('Email already in use')).toBeInTheDocument());
  });
});
