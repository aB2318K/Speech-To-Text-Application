import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from './page.tsx';
import { useRouter } from 'next/navigation';
import { useAuth, useLogout } from "../../hooks/page";

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => {
  const Component = ({ href, children }) => {
    const router = useRouter();
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          router.push(href);
        }}
      >
        {children}
      </a>
    );
  };
  Component.displayName = 'Link';
  return Component;
});

jest.mock('../../hooks/page', () => ({
  useAuth: jest.fn(),
  useLogout: jest.fn(),
}));

describe('Dashboard Component', () => {
  const pushMock = jest.fn();
  const logoutMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    pushMock.mockClear();
    logoutMock.mockClear();
    useRouter.mockReturnValue({ push: pushMock });
    useAuth.mockReturnValue({});
    useLogout.mockReturnValue(logoutMock);

    jest.spyOn(global.Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'token') return 'fake-token';
      if (key === 'userID') return 'fake-user-id';
      return null;
    });

    jest.spyOn(global.Storage.prototype, 'setItem').mockImplementation(() => {});
    jest.spyOn(global.Storage.prototype, 'removeItem').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks(); 
  });

  it('renders the dashboard layout', () => {
    render(<Dashboard />);

    expect(screen.getByText('Speech to Text Application')).toBeInTheDocument();
    const createBtns = screen.getAllByRole('button', { name: /Create New/i })
    expect(createBtns[0]).toBeInTheDocument();
  });

  it('redirects to login if no token or userID is found', async () => {
    // Mock localStorage to return null for token and userID
    jest.spyOn(global.Storage.prototype, 'getItem').mockImplementation(() => null);

    render(<Dashboard />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
  });

  it('fetches and displays user speeches', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce([{ _id: '1', title: 'Test Speech' }]),
        ok: true,
    });
    
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Speech')).toBeInTheDocument();
    });
    
    const speechLink = screen.getByRole('link', { name: /Test Speech/i });
    fireEvent.click(speechLink);
    await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith('/speech/1');
      });
    
  });

  it('logs out when the logout button is clicked', () => {
    render(<Dashboard />);

    const logoutButton = screen.getByRole('button', { name: /Log Out/i });
    fireEvent.click(logoutButton);

    expect(logoutMock).toHaveBeenCalled();
  });
  
});
