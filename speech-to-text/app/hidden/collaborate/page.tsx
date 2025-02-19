'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useLogout } from "../../../hooks/page";

//This is just an example of invited users
//You have to write the logic to invite users in real time to collaborate
const invitedUsers = ['User2', 'User3'];

export default function Collaborate() {
    useAuth();
    const router = useRouter();
    const [isListening, setIsListening] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [sessionEnd, setSessionEnd] = useState(false);
    const [sessionCount, setSessionCount] = useState(0);
    const [delModalOpened, setDelModalOpened] = useState(false);
    const [saveModalOpened, setSaveModalOpened] = useState(false);
    const [exportModalOpened, setExportModalOpened] = useState(false);
    const [removeModalOpened, setRemoveModalOpened] = useState(false);
    const [inviteModalOpened, setInviteModalOpened] = useState(false);
    const [speechData, setspeechData] = useState(""); // State to hold speech text
    const [speechTitle, setSpeechTitle] = useState("");
    const [collaborators, setCollaborators] = useState(invitedUsers);
    const [collaboratorToRemove, setCollaboratorToRemove] = useState('');
    const [iniviteeEmail, setIniviteeEmail] = useState('');
    const [successInviteMessage, setSuccessInviteMessage] = useState('');
    const [emailError, setEmailError] = useState('');
    const [userId, setUserId] = useState('');

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
    }, [router]);;

    // Toggle the listening state
    const handleMicrophoneClick = () => {
        if (isListening) {
            setIsPaused(true); // Pause when stopping listening
        } else {
            setIsPaused(false); // Unpause when starting listening
        }
        if (sessionCount > 0) {
            setSessionEnd(true); // End session after 3 listening cycles
        }
        setSessionCount((state) => state + 1);
        setIsListening(!isListening); // Toggle listening state
    };

    // Toggle the pause state
    const handlePlayPauseClick = () => {
        setIsPaused(!isPaused);
    };

    const handleDelete = () => {
        // Later write the logic to delete from the database
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
                    console.log(data);
                    
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

      const handleRemoveCollaborator = () => {
        setCollaborators((prev) => prev.filter((collaborator) => collaborator !== collaboratorToRemove));
        setRemoveModalOpened(false);
    };

    const emailValidator = () => {
        const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
        if (!emailRegex.test(iniviteeEmail)) {
            setEmailError('*Please provide a valid email address in the format: example@domain.com');
            return false;
        } else {
            setEmailError('');
            return true;
        }
    };

    const handleInvite = () => {
        setSuccessInviteMessage('');
        setEmailError('');
        const isEmailValid = emailValidator();
        if(isEmailValid) {
            /* if (email not found in database) {
                setErrorMessage('*User not found')
            } else {
                handle logic to send the reset link to the user's email
             }
                */
             setSuccessInviteMessage('Invitation link sent'); 
             setTimeout(() => {
                setSuccessInviteMessage('');
                setIniviteeEmail('');
                setInviteModalOpened(false);
                setCollaborators((prev) => [...prev, iniviteeEmail]);
             }, 1000);
        } 
    }

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
            <div className="bg-white p-5 rounded-lg shadow-lg w-1/4">
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
                        disabled={speechTitle.trim().length === 0}
                        onClick={handleSave} // Redirects on save
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

    const removeModal = (
        <div className="remove_modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-5 rounded-lg shadow-xl">
                <h3 className="text-teal-1000 text-lg mb-4">Are you sure you want to remove '{collaboratorToRemove.slice(0, 5)}'?</h3>
                <div className="flex justify-end">
                    <button
                        onClick={() => setRemoveModalOpened(false)} // Close modal on cancel
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mr-2">
                        Cancel
                    </button>
                    <button
                        onClick={handleRemoveCollaborator}
                        className="confirm_remove bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );

    const inviteModal = (
        <div className="invite_modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-5 rounded-lg shadow-lg w-1/4">
                <h3 className="text-lg mb-2 text-teal-1000">Invite collaborator:</h3> 
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={iniviteeEmail}
                    onChange={(e) => setIniviteeEmail(e.target.value)}
                    placeholder="Enter email"
                    required
                    className="w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                {emailError && <p className="mt-1 error_message text-red-700 text-[10px]">{emailError}</p>}
                {successInviteMessage && <p className="success_message bg-teal-100 text-teal-600 text-center mt-1 rounded-md">{successInviteMessage}</p>}
                <div className="mt-3 flex justify-end">
                    <button
                        onClick={() => {setInviteModalOpened(false); ; setIniviteeEmail(''); setEmailError('')}} // Close modal on cancel
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mr-2">
                        Cancel
                    </button>
                    <button
                        onClick={handleInvite} 
                        className="confirm_invite bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                        Invite
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
            {/* Sidebar */}
            <div className="side_bar w-1/6 bg-white text-black p-4 rounded-lg shadow-lg ">
                <p className="text-sm font-semibold mb-4 text-teal-800 text-center">Speech to Text Application</p>
                <ul className="space-y-2">
                    <li>
                        <Link href={`/dashboard`}>
                            <button className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2">
                                Home
                            </button>
                        </Link>
                    </li>
                    <li>
                        <Link href="/create">
                            <button className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2">
                                Create New
                            </button>
                        </Link>
                    </li>
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
                    Collaborate
                </h2>
                <textarea
                    id="speech"
                    name="speech"
                    rows={12}
                    value={speechData} // Bind the value to state
                    onChange={(e) => setspeechData(e.target.value.replace(/\s+/g, ' '))} // Update state on change
                    className="w-full p-2 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <div className="flex justify-evenly">
                    <button
                        disabled={sessionEnd} // Disable when session has ended
                        className={`start_button w-1/4 py-3 px-4 rounded-md mt-5
                            ${sessionEnd
                                ? 'bg-teal-100 text-gray-600' // Disabled style when session ends
                                : isListening
                                    ? 'bg-red-600 hover:bg-red-700' // Active style when listening
                                    : 'bg-teal-600 hover:bg-teal-700' // Active style when not listening
                            }
                            text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        onClick={handleMicrophoneClick}
                    >
                        {isListening ? 'Stop' : 'Start'}
                    </button>
                    <button
                        disabled={!isListening} // Only enabled when listening
                        className={`controller w-1/4 py-3 px-4 rounded-md mt-5         
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
                        className={`w-1/4 py-3 px-4 rounded-md mt-5
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
                        className={`save_button w-1/4 py-3 px-4 rounded-md
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
                        className={`w-1/4 py-3 px-4 rounded-md
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
                        className={`export_button w-1/4 py-3 px-4 rounded-md
                            ${speechData.trim().length === 0 || !sessionEnd
                                ? 'bg-teal-100 text-gray-600' // Disabled style
                                : 'bg-teal-600 hover:bg-teal-700 text-white'
                            }
                            focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                        Export
                    </button>
                    {exportModalOpened && exportModal}
                </div>
            </div>
            {/* Collaborators Sidebar */}
            <div className="collab_bar w-1/6 bg-white p-4 rounded-lg shadow-lg ">
                <p className="text-sm font-semibold mb-4 text-teal-800 text-center">Collaborators</p>
                <button
                    onClick={() => setInviteModalOpened(true)} 
                    className="invite_btn w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4 transition duration-200">
                    Invite User
                </button>
                <div className="mt-4">
                    <ul className="collaborators_list space-y-3">
                        <li className="flex justify-between items-center text-teal-800">
                            <span className="font-semibold text-sm">User1 (Host)</span>
                        </li>
                        {collaborators.map((collaborator) => (
                            <li key={collaborator} className="flex justify-between items-center text-teal-800">
                                <span className="font-semibold text-sm">
                                    {collaborator.includes('@') ? (
                                        <>
                                            {collaborator.slice(0, 5)} <span className="text-teal-500 text-xs">(Pending)</span>
                                        </>
                                    ) : (
                                        collaborator
                                    )}
                                </span>
                                <button
                                    id={`${collaborator.slice(0, 5)}_remove`}
                                    className="text-teal-500 hover:text-teal-700 font-semibold text-xs"
                                    onClick={() => {
                                        setCollaboratorToRemove(collaborator);
                                        setRemoveModalOpened(true);
                                    }}
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {inviteModalOpened && inviteModal}
            {removeModalOpened && removeModal}
        </div>
    );
}
