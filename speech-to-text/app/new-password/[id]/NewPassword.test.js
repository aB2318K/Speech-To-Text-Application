import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewPassword from './page.tsx'; 
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

global.fetch = jest.fn();

describe('NewPassword Component', () => {
  let mockPush;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });
  });

  test('renders the NewPassword form correctly', async () => {
    useParams.mockReturnValue({ id: 'testResetId' });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'valid-token' }), 
    });
  
    render(<NewPassword />);
  
    await waitFor(() => {
      expect(screen.getByText('Create New Password')).toBeInTheDocument();
    });
  
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/re-enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
  });
  

  test('shows error message for invalid password format', async () => {
    useParams.mockReturnValue({ id: 'testResetId' });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'valid-token' }),
    });
  
    render(<NewPassword />);
  
    await waitFor(() => {
      expect(screen.getByText('Create New Password')).toBeInTheDocument();
    });
  
    const passwordInput = screen.getByLabelText(/new password/i);
    const reEnterPasswordInput = screen.getByLabelText(/re-enter your password/i);
    const submitButton = screen.getByRole('button', { name: /update password/i });
  
    fireEvent.change(passwordInput, { target: { value: 'invalid' } });
    fireEvent.change(reEnterPasswordInput, { target: { value: 'invalid' } });
  
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          '*Your password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character'
        )
      ).toBeInTheDocument();
    });
  });
  

  test('shows error message for mismatching passwords', async () => {
    useParams.mockReturnValue({ id: 'testResetId' });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'valid-token' }),
    });
  
    render(<NewPassword />);

    await waitFor(() => {
      expect(screen.getByText('Create New Password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const reEnterPasswordInput = screen.getByLabelText(/re-enter your password/i);
    const submitButton = screen.getByRole('button', { name: /update password/i });

    fireEvent.change(passwordInput, { target: { value: 'Valid123!' } });
    fireEvent.change(reEnterPasswordInput, { target: { value: 'Invalid123!' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('*Passwords do not match')).toBeInTheDocument();
    });
  });
  
  test('shows success message and redirects to login page on successful password update', async () => {
    useParams.mockReturnValue({ id: 'testResetId' });
  
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ resetToken: 'validToken' }), 
    });
    
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Password successfully reset' }), 
    });
      
  
    const mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });
  
    render(<NewPassword />);
  
    await waitFor(() => {
      expect(screen.getByText('Create New Password')).toBeInTheDocument();
    });
  
    const passwordInput = screen.getByLabelText(/new password/i);
    const reEnterPasswordInput = screen.getByLabelText(/re-enter your password/i);
    const submitButton = screen.getByRole('button', { name: /update password/i });
  
    fireEvent.change(passwordInput, { target: { value: 'Valid123!' } });
    fireEvent.change(reEnterPasswordInput, { target: { value: 'Valid123!' } });
    fireEvent.click(submitButton);
    console.log(fetch.mock.calls)
    await waitFor(() => {
      expect(screen.getByText('You have successfully updated your password. Redirecting to Log In page')).toBeInTheDocument();
    });

    await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 4000 }); 
  });
  
  test('shows invalid token error when reset token is invalid', async () => {
    useParams.mockReturnValue({ id: 'invalidResetId' });
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
    });

    render(<NewPassword />);

    await waitFor(() => {
      expect(screen.getByText('Reset Link Invalid')).toBeInTheDocument();
    });
  });
  
});
