'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useLogout } from "../../hooks/page";
import { io } from "socket.io-client";
import { HiMenu } from 'react-icons/hi';
import { HiMicrophone, HiPlay, HiPause, HiTrash, HiSave, HiBookmark } from "react-icons/hi";
import { motion } from "framer-motion";

export default function Create() {
    useAuth();
    const router = useRouter();
    const [userId, setUserId] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [sessionEnd, setSessionEnd] = useState(false);
    const [sessionCount, setSessionCount] = useState(0);
    const [delModalOpened, setDelModalOpened] = useState(false);
    const [saveModalOpened, setSaveModalOpened] = useState(false);
    const [exportModalOpened, setExportModalOpened] = useState(false);
    const [speechData, setSpeechData] = useState(""); 
    const [speechTitle, setSpeechTitle] = useState("");
    const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
    const [isMediumScreen, setIsMediumScreen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const logout = useLogout();
    const [loading, setLoading] = useState(true); // Loading state

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const storedUserId = localStorage.getItem('userID');
            if (storedUserId && token) {
                setLoading(false);
                setUserId(storedUserId);
            }else {
                router.push('/login');
            }
        }
    }, [router]);

    useEffect(() => {
        const handleResize = () => {
          if (window.innerWidth <= 768) {
            setIsMediumScreen(true);
          } else {
            setIsMediumScreen(false);
          }
        };
      
        handleResize(); 
      
        window.addEventListener('resize', handleResize);
      
        // Cleanup the event listener on unmount
        return () => window.removeEventListener('resize', handleResize);
      }, []);

    //Recording speech
    const handleRecording = () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
                mediaRecorder.start(100); 
                console.log('Recording started');

                const socketInstance = io('http://localhost:9000');
                
                socketInstance.on('connect', () => {
                    console.log('Connected to the server for audio streaming');
                });
    
                socketInstance.on('transcription', (transcribedText) => {
                    setSpeechData(prev => {
                        if (prev && !prev.endsWith(' ')) {
                          return prev + ' ' + transcribedText;
                        }
                        return prev + transcribedText;
                      });
                });
    
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0 && socketInstance) {
                        // Convert Blob to ArrayBuffer for consistent streaming
                        const reader = new FileReader();
                        reader.onload = () => {
                            const arrayBuffer = reader.result;
                            socketInstance.emit('audioData', arrayBuffer);
                            console.log('Audio data sent to server');
                        };
                        reader.readAsArrayBuffer(event.data);
                    }
                };
    
                mediaRecorder.onstop = () => {
                    console.log('Recording stopped');
                    stream.getTracks().forEach(track => track.stop());
                    socketInstance.emit('stopAudio'); 
                    socketInstance.disconnect(); 
                };
    
                setRecorder(mediaRecorder);
            })
            .catch((err) => {
                console.error('Error accessing microphone:', err);
            });
    };       

    // Toggle the listening state
    const handleMicrophoneClick = () => {
        if (sessionCount < 1) {
            handleRecording();
        }
    
        if (isListening) {
            setIsPaused(true);
        } else {
            setIsPaused(false);
        }
        if (sessionCount > 0) {
            setSessionEnd(true);
            recorder?.stop();
            setRecorder(null);
        }
        setSessionCount((state) => state + 1);
        setIsListening(!isListening);
    };
    

    // Toggle the pause state
    const handlePlayPauseClick = () => {
        if (recorder) {
            if (isPaused) {
                handleRecording();
                console.log('Recording resumed');
            } else {
                recorder.stop();
                console.log('Recording paused');
            }
            setIsPaused(!isPaused);
        }
    };

    const handleDelete = () => {
        setDelModalOpened(false);
        window.location.reload();
    }

    const handleSave = async () => {
        if (speechTitle && speechData) {
            try {
                const requestData = {
                    title: speechTitle.trim(),
                    speechData: speechData.trim(),
                    userId: userId
                };
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:9000/speeches', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify(requestData),
                });
                
                const data = await response.json();
                if (response.ok) {
                    //console.log(data);
                    
                } else {
                    console.log(data)
                }
              } catch (error) {
                console.error('Error:', error);
              }
        }

        setSaveModalOpened(false);
        router.push('/dashboard');
        setSpeechTitle("");   
    }

    const handleExportTxt = () => {
        const blob = new Blob([speechData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${speechTitle}.txt`; 
        link.click();
        URL.revokeObjectURL(url); // Clean up the URL object after use
        setExportModalOpened(false); // Close the export modal
      };
    
      const handleExportCsv = () => {
        const csvData = `"Title","Data"\n"${speechTitle}","${speechData}"`; // Format as CSV
        const blob = new Blob([csvData], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${speechTitle}.csv`; 
        link.click();
        URL.revokeObjectURL(url); // Clean up the URL object after use
        setExportModalOpened(false); // Close the export modal
      };

    const deleteModal = (
        <div className="delete_modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-5 rounded-lg shadow-xl">
                <h3 className="text-teal-1000 text-lg mb-4">Are you sure you want to delete this speech?</h3>
                <div className="flex justify-end">
                    <button
                        onClick={() => setDelModalOpened(false)} // Close modal on cancel
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mr-2">
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        className="confirm_delete bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );

    const saveModal = (
        <div className="save_modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-5 rounded-lg shadow-lg w-[80vw] md:w-1/4">
                <h3 className="text-lg mb-2 text-teal-1000">Save Your Speech</h3> 
                <input
                    type="text"
                    id="title"
                    value={speechTitle}
                    onChange={(e) => setSpeechTitle(e.target.value.replace(/\s+/g, ' '))}
                    name="title"
                    placeholder="Enter title"
                    className="mb-4 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <div className="flex justify-end">
                    <button
                        onClick={() => setSaveModalOpened(false)} // Close modal on cancel
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mr-2">
                        Cancel
                    </button>
                    <button
                        data-testid="confirm-save"
                        disabled={speechTitle.trim().length === 0}
                        onClick={handleSave} 
                        className="confirm_save bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );

    const exportModal = (
        <div className="export_modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl">
            <h3 className="text-teal-1000 text-lg mb-4">Export as a file</h3>
            <div className="flex justify-between space-x-2">
              <button
                onClick={handleExportTxt}
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Export as .txt
              </button>
              <button
                onClick={handleExportCsv}
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Export as .csv
              </button>
              <button
                onClick={() => setExportModalOpened(false)}
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mr-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );

    if (loading) {
        return (
          <div className="flex h-screen bg-teal-50 items-center justify-center">
            <div className="spinner"></div> 
          </div>
        ); // Show spinner while checking auth
    }

    return (
        <div className="flex h-screen bg-teal-50">
            {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
                onClick={() => setIsSidebarOpen(false)} 
            />
            )}
            {isMediumScreen && !isSidebarOpen && 
                <HiMenu className="bg-teal-200 h-8 w-8 cursor-pointer absolute top-2 left-2 z-50 rounded-full p-1"
                        onClick={() => setIsSidebarOpen(true)}
                />
            }
            {/* Sidebar */}
            <div className={`side_bar w-1/3 md:w-1/6 bg-white text-black p-4 shadow-lg left-0 h-full ${isMediumScreen && 'fixed'} transition-transform duration-300 ease-in-out z-50
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:transition-none`}
            >
                <p className="text-sm font-semibold mb-4 text-teal-800 text-center">Speech to Text Application</p>
                <ul className="space-y-2">
                    <li>
                        <Link href={`/dashboard`}>
                            <button className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2">
                                Home
                            </button>
                        </Link>
                    </li>
                    {/*
                    <li>
                        <Link href="/collaborate">
                            <button className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2">
                                Collaborate
                            </button>
                        </Link>
                    </li>
                    */}
                    <li>
                        <Link href="/profile">
                        <button className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2">
                            Profile
                        </button>
                        </Link>
                    </li>
                    <li>
                        <Link href="/login">
                            <button 
                                onClick={logout}
                                className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                                Log Out
                            </button>
                        </Link>
                    </li>
                </ul>
            </div>

            <div className="flex-1 p-8">
                <h2 className="text-2xl font-semibold text-center mb-4 text-teal-700">
                    Create Your Speech
                </h2>
                <textarea
                    id="speech"
                    name="speech"
                    rows={12}
                    value={speechData} 
                    onChange={(e) => setSpeechData(e.target.value.replace(/\s+/g, ' '))} 
                    className="w-full p-2 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
               {!isMediumScreen && <div className="flex justify-center my-4">
                    <motion.div 
                        onClick={!sessionEnd ? handleMicrophoneClick : undefined}
                        className={`flex items-center justify-center w-16 h-16 bg-teal-500 rounded-full text-white shadow-md transition-opacity ${
                            sessionEnd ? "pointer-events-none cursor-default" : "pointer-events-auto cursor-pointer"
                        }`}
                        animate={isListening ? { opacity: [1, 0.2, 1] } : sessionEnd ? { opacity: 0.5 } : { opacity: 1}}
                        transition={isListening ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" } : {}}
                    >
                        <HiMicrophone className="w-10 h-10" />
                    </motion.div>
                    <div
                        onClick={handlePlayPauseClick}
                        className={`flex items-center justify-center w-16 h-16 bg-teal-500 rounded-full text-white shadow-md ml-4 ${
                            isListening ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-50 pointer-events-none cursor-default"
                        }`}
                    >
                        {isPaused ? (
                            <HiPlay className="w-12 h-12" />
                        ) : (
                            <HiPause className="w-12 h-12" />
                        )}
                    </div>
                    <div
                        onClick={sessionEnd ? () => setSaveModalOpened(true) : undefined}  
                        className={`flex items-center justify-center w-16 h-16 bg-teal-500 rounded-full text-white shadow-md ml-4 ${speechData.trim().length === 0 || !sessionEnd ? "opacity-50 pointer-events-none cursor-default" : "opacity-100 pointer-events-auto cursor-pointer"}`}
                    >
                        <HiBookmark className="w-10 h-10" />
                    </div>
                    <div
                        onClick={sessionEnd ? () => setDelModalOpened(true) : undefined}  
                        className={`flex items-center justify-center w-16 h-16 bg-teal-500 rounded-full text-white shadow-md ml-4 ${sessionEnd ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-50 pointer-events-none cursor-default"}`}
                    >
                        <HiTrash className="w-10 h-10" />
                    </div>
                    <div
                        onClick={sessionEnd ? () => setSaveModalOpened(true) : undefined}  
                        className={`flex items-center justify-center w-16 h-16 bg-teal-500 rounded-full text-white shadow-md ml-4 ${speechData.trim().length === 0 || !sessionEnd ? "opacity-50 pointer-events-none cursor-default" : "opacity-100 pointer-events-auto cursor-pointer"}`}
                    >
                        <HiSave className="w-10 h-10" />
                    </div>
                </div>}
                <div className="flex justify-evenly">
                    <button
                        disabled={sessionEnd} 
                        className={`start_button w-1/4 h-8 md:h-auto py-1 px-2 md:py-3 md:px-4 rounded-md mt-2 md:mt-5
                            ${sessionEnd
                                ? 'bg-teal-100 text-gray-600' 
                                : isListening
                                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                                    : 'bg-teal-600 hover:bg-teal-700 text-white' 
                            }
                            focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        onClick={handleMicrophoneClick}
                    >
                        {isListening ? 'Stop' : 'Start'}
                    </button>
                    <button
                        disabled={!isListening} // Only enabled when listening
                        className={`controller w-1/4 h-8 md:h-auto py-1 px-2 md:py-3 md:px-4 rounded-md mt-2 md:mt-5         
                            ${(!isListening
                                ? 'bg-teal-100 text-gray-600'
                                : 'bg-teal-600 hover:bg-teal-700 text-white'
                            )}
                            focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        onClick={handlePlayPauseClick}
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                        disabled={!sessionEnd} // Disabled if session has not ended
                        className={`w-1/4 h-8 md:h-auto py-1 px-2 md:py-3 md:px-4 rounded-md mt-2 md:mt-5
                            ${!sessionEnd
                                ? 'bg-teal-100 text-gray-600'
                                : 'bg-teal-600 hover:bg-teal-700 text-white'
                            }
                            focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        onClick={() => window.location.reload()}
                    >
                        Create New
                    </button>
                </div>

                <div className="flex justify-evenly mt-5">
                    <button
                        onClick={() => setSaveModalOpened(true)}
                        disabled={speechData.trim().length === 0 || !sessionEnd} // Disabled if text area is empty or session has not ended
                        className={`save_button w-1/4 h-8 md:h-auto py-1 px-2 md:py-3 md:px-4 rounded-md
                            ${speechData.trim().length === 0 || !sessionEnd
                                ? 'bg-teal-100 text-gray-600' // Disabled style
                                : 'bg-teal-600 hover:bg-teal-700 text-white'
                            }
                            focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                        Save
                    </button>
                    {saveModalOpened && saveModal}
                    <button
                        onClick={() => setDelModalOpened(true)}
                        disabled={!sessionEnd} // Disabled if session has not ended
                        className={`w-1/4 h-8 md:h-auto py-1 px-2 md:py-3 md:px-4 rounded-md
                            ${!sessionEnd
                                ? 'bg-teal-100 text-gray-600'
                                : 'bg-teal-600 hover:bg-teal-700 text-white'
                            }
                            focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                        Delete
                    </button>
                    {delModalOpened && deleteModal}
                    <button
                        onClick={() => setExportModalOpened(true)}
                        disabled={speechData.trim().length === 0 || !sessionEnd} // Disabled if text area is empty or session has not ended
                        className={`export_button w-1/4 h-8 md:h-auto py-1 px-2 md:py-3 md:px-4 rounded-md
                            ${speechData.trim().length === 0 || !sessionEnd
                                ? 'bg-teal-100 text-gray-600' 
                                : 'bg-teal-600 hover:bg-teal-700 text-white'
                            }
                            focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                        Export
                    </button>
                    {exportModalOpened && exportModal}
                </div>
            </div>
        </div>
    );
}
