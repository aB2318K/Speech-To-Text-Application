import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Profile from './page'; // Adjust the import path as necessary
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { useAuth, useLogout } from '../../hooks/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../hooks/page', () => ({
  useAuth: jest.fn(),
  useLogout: jest.fn(() => jest.fn()),
}));

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
});

describe('Profile Component', () => {
  const pushMock = jest.fn();
  const logoutMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    pushMock.mockClear();
    logoutMock.mockClear();
    useRouter.mockReturnValue({ push: pushMock });
    useAuth.mockReturnValue({}); 
    useLogout.mockReturnValue(logoutMock);

    jest.spyOn(window.localStorage, 'getItem').mockImplementation(() => null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('redirects to login if no token or userID is found', async () => {
    render(<Profile />);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
  });

  it('fetches user info and displays it', async () => {
    window.localStorage.getItem.mockImplementation((key) => {
      return key === 'token' ? 'fake-token' : key === 'userID' ? '123' : null;
    });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ firstname: 'John', lastname: 'Doe' }),
      })
    );

    render(<Profile />);

    await waitFor(() => expect(screen.getByText('First Name: John')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Last Name: Doe')).toBeInTheDocument());
  });

  it('opens and closes the edit first name modal', async () => {
    window.localStorage.getItem.mockImplementation((key) =>
      key === 'token' ? 'fake-token' : key === 'userID' ? '123' : null
    );

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ firstname: 'John', lastname: 'Doe' }),
      })
    );

    render(<Profile />);

    const editBtn = screen.getAllByText('Edit');
    fireEvent.click(editBtn[0]);
    await waitFor(() => expect(screen.getByLabelText('First Name:')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('First Name:'), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(screen.queryByLabelText('First Name:')).not.toBeInTheDocument());
    expect(screen.getByText('First Name: Jane')).toBeInTheDocument();
  });

  it('validates password and shows error messages', async () => {
    window.localStorage.getItem.mockImplementation((key) =>
      key === 'token' ? 'fake-token' : key === 'userID' ? '123' : null
    );

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ firstname: 'John', lastname: 'Doe' }),
      })
    );

    render(<Profile />);

    await waitFor(() => expect(screen.getByText('Change Password')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Change Password'));
    fireEvent.change(screen.getByLabelText('New Password:'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(screen.getByText(/Your password must be at least 8 characters long/)).toBeInTheDocument());
  });

  it('deletes the account and redirects to login', async () => {
    window.localStorage.getItem.mockImplementation((key) =>
      key === 'token' ? 'fake-token' : key === 'userID' ? '123' : null
    );

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ firstname: 'John', lastname: 'Doe' }),
      })
    );

    render(<Profile />);

    await waitFor(() => expect(screen.getByText('Delete Account')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Delete Account'));
    fireEvent.click(screen.getByText('Confirm'));
    await new Promise((res) => setTimeout(res, 3000));
    await waitFor(() => expect(useRouter().push).toHaveBeenCalledWith('/login'));
  });
  
});

