import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Create from './page';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('../../hooks/page', () => ({
  useAuth: jest.fn(),
  useLogout: jest.fn(() => jest.fn()),
}));

jest.mock('socket.io-client', () => {
    return {
      __esModule: true,
      io: jest.fn(() => ({
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      })),
    };
});  

global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

describe('Create Component', () => {
  const mockPush = jest.fn();
  const mockMediaRecorder = {
    start: jest.fn(),
    stop: jest.fn().mockImplementation(function() {
      this.state = 'inactive';
      this.onstop?.();
    }),
    ondataavailable: jest.fn(),
    onstop: jest.fn(),
    state: 'inactive',
  };
  const mockRecorderInstances = []; 
  beforeEach(() => {
    useRouter.mockImplementation(() => ({ push: mockPush }));
    
    // Mock media devices
    global.navigator.mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }])
      }),
    };
  
    global.MediaRecorder = jest.fn().mockImplementation(() => {
      const instance = {
        ...mockMediaRecorder,
        state: 'inactive',
      };
      mockRecorderInstances.push(instance);
      return instance;
    });
    
    Storage.prototype.getItem = jest.fn((key) => 
      key === 'token' ? 'fake-token' : 'fake-user-id'
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the create page correctly', async () => {
    render(<Create />);
    expect(await screen.findByText('Create Your Speech')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('handles recording start/stop', async () => {
    render(<Create />);
    
    const startButton = screen.getByRole('button', { name: /start/i });
    fireEvent.click(startButton);
    
    expect(await screen.findByText('Stop')).toBeInTheDocument();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    
    fireEvent.click(startButton);
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  test('handles pause/resume functionality', async () => {
    render(<Create />);
    
    fireEvent.click(screen.getByRole('button', { name: /start/i }));

    const pauseButton = await screen.findByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);
    
    expect(await screen.findByText('Resume')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /resume/i }));
    expect(await screen.findByText('Pause')).toBeInTheDocument();
  });

    test('records speech, types in textarea, stops recording, and saves speech successfully', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true });
        render(<Create />);

        const startButton = screen.getByRole('button', { name: /start/i });
        fireEvent.click(startButton);
        expect(await screen.findByText('Stop')).toBeInTheDocument();

        const textArea = screen.getByRole('textbox');
        fireEvent.change(textArea, { target: { value: 'This is a test speech' } });
        expect(textArea).toHaveValue('This is a test speech');

        const stopButton = screen.getByRole('button', { name: /stop/i });
        fireEvent.click(stopButton);
        expect(await screen.findByText('Start')).toBeInTheDocument(); // Should switch back to 'Start'

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        const titleInput = await screen.findByPlaceholderText('Enter title');
        fireEvent.change(titleInput, { target: { value: 'Test Speech' } });

        fireEvent.click(screen.getByTestId('confirm-save'));

        await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:9000/speeches',
            expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer fake-token'
            }
            })
        );
        });
    });

    test('records speech, types in textarea, stops recording, and deletes speech successfully', async () => {
        // Mock window.location.reload by replacing window.location with a mock object
        const mockReload = jest.fn();
        delete window.location; 
        window.location = { reload: mockReload };

        render(<Create />);

        const startButton = screen.getByRole('button', { name: /start/i });
        fireEvent.click(startButton);
        expect(await screen.findByText('Stop')).toBeInTheDocument();

        const textArea = screen.getByRole('textbox');
        fireEvent.change(textArea, { target: { value: 'This is a speech to delete' } });
        expect(textArea).toHaveValue('This is a speech to delete');

        const stopButton = screen.getByRole('button', { name: /stop/i });
        fireEvent.click(stopButton);
        expect(await screen.findByText('Start')).toBeInTheDocument(); 

        fireEvent.click(screen.getByRole('button', { name: /delete/i }));

        const confirmButton = await screen.findByText('Delete', { selector: '.confirm_delete' });
        fireEvent.click(confirmButton);

        await waitFor(() => {
        expect(mockReload).toHaveBeenCalled();
        });
    });

    test('exports speech files', async () => {
        global.URL.createObjectURL = jest.fn(); 

        render(<Create />);

        const startButton = screen.getByRole('button', { name: /start/i });
        fireEvent.click(startButton);
        expect(await screen.findByText('Stop')).toBeInTheDocument(); 

        const textArea = screen.getByRole('textbox');
        fireEvent.change(textArea, { target: { value: 'This is a speech to export' } });
        expect(textArea).toHaveValue('This is a speech to export');

        const stopButton = screen.getByRole('button', { name: /stop/i });
        fireEvent.click(stopButton);
        expect(await screen.findByText('Start')).toBeInTheDocument(); 

        fireEvent.click(screen.getByRole('button', { name: /export/i }));

        const txtButton = await screen.findByText('Export as .txt');
        fireEvent.click(txtButton);
        expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
});