import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Speech from './page.tsx';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useLogout } from '../../../hooks/page.tsx';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn().mockReturnValue({ speechId: '1' }),
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

jest.mock('../../../hooks/page', () => ({
  useAuth: jest.fn(),
  useLogout: jest.fn(),
}));

describe('Speech Component', () => {
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

  it('renders the speech component and displays speech data', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({
        _id: '1',
        title: 'Test Speech',
        data: 'This is a test speech.',
      }),
      ok: true,
    });

    render(<Speech />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Speech')).toBeInTheDocument();
      expect(screen.getByDisplayValue('This is a test speech.')).toBeInTheDocument();
    });
  });

  it('allows editing the speech title and data', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({
        _id: '1',
        title: 'Test Speech',
        data: 'This is a test speech.',
      }),
      ok: true,
    });

    render(<Speech />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Speech')).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Test Speech');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    expect(titleInput.value).toBe('Updated Title');

    const dataInput = screen.getByDisplayValue('This is a test speech.');
    fireEvent.change(dataInput, { target: { value: 'Updated data.' } });
    expect(dataInput.value).toBe('Updated data.');
  });

  it('saves the speech when the save button is clicked', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce({
          _id: '1',
          title: 'Test Speech',
          data: 'This is a test speech.',
        }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce({}),
        ok: true,
      });

    render(<Speech />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Speech')).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Test Speech');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:9000/speeches/1',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer fake-token',
          },
          body: JSON.stringify({
            title: 'Updated Title',
            data: 'This is a test speech.',
            userId: 'fake-user-id',
          }),
        })
      );
    });
  });

  it('deletes the speech when the delete button is clicked', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce({
          _id: '1',
          title: 'Test Speech',
          data: 'This is a test speech.',
        }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce({}),
        ok: true,
      });

    render(<Speech />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Speech')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByText('Delete', { selector: '.confirm_delete' });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:9000/speeches/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer fake-token',
          },
          body: JSON.stringify({
            userId: 'fake-user-id',
          }),
        })
      );
    });

    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });

  it('exports the speech as a .txt file', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({
        _id: '1',
        title: 'Test Speech',
        data: 'This is a test speech.',
      }),
      ok: true,
    });
  
    global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/dummy-url');
    global.URL.revokeObjectURL = jest.fn();
  
    render(<Speech />);
  
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Speech')).toBeInTheDocument();
    });
  
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
  
    const exportTxtButton = screen.getByText('Export as .txt');
    fireEvent.click(exportTxtButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  
    await waitFor(() => {
      expect(screen.queryByText('Export as .txt')).not.toBeInTheDocument();
    });
  
    global.URL.createObjectURL.mockRestore();
    global.URL.revokeObjectURL.mockRestore();
  });
  

  it('navigates to the dashboard when the home button is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({
        _id: '1',
        title: 'Test Speech',
        data: 'This is a test speech.',
      }),
      ok: true,
    });

    render(<Speech />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Speech')).toBeInTheDocument();
    });

    const homeButton = screen.getByText('Home');
    fireEvent.click(homeButton);
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});