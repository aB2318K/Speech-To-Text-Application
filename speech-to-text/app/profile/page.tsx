'use client'
import Link from "next/link"
import { useState, useEffect } from "react";
import { useAuth, useLogout} from "../../hooks/page";
import { useRouter } from "next/navigation";
import { HiMenu } from 'react-icons/hi';

export default function Profile() {
    useAuth();
    const logout = useLogout();
    const router = useRouter();
    
    const [userId, setUserId] = useState(''); 
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [rePassword, setRePassword] = useState('');

    // Temporary state variables for modals
    const [tempFirstName, setTempFirstName] = useState('');
    const [tempLastName, setTempLastName] = useState('');

    const [firstNameModalOpened, setFirstNameModalOpened] = useState(false);
    const [lastNameModalOpened, setLastNameModalOpened] = useState(false);
    const [passwordModalOpened, setPasswordModalOpened] = useState(false);
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);

    // New state variables for password validation
    const [currentPasswordError, setCurrentPasswordError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [matchError, setMatchError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [deletMessage, setDeleteMessage] = useState('');

    const [loading, setLoading] = useState(true); // Loading state

    const [isMediumScreen, setIsMediumScreen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const getUserInfo = async (userId: string) => { 
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:9000/user?userId=${userId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
              }
            });
            const data = await response.json();
            return data;
        }   catch (error) {
            console.error('Error:', error);
            return {}; 
        }
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const storedUserId = localStorage.getItem('userID');
            if (storedUserId && token) {
              setLoading(false);
              const fetchUser = async () => {
                const fetchedUser = await getUserInfo(storedUserId);
                setUserId(storedUserId);
                if (fetchedUser) {
                    setFirstName(fetchedUser.firstname || "");
                    setLastName(fetchedUser.lastname|| "");
                    setTempFirstName(firstName || "");
                    setTempLastName(lastName || "");
                }
                setLoading(false);
              };
              fetchUser();
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

    const passwordValidator = () => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            setPasswordError(
                '*Your password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character'
            );
            return false;
        } else {
            setPasswordError('');
            return true;
        }
    };

    const passwordMatchValidator = () => {
        if (newPassword !== rePassword) {
            setMatchError('*Passwords do not match');
            return false;
        } else {
            setMatchError('');
            return true;
        }
    };

    //Password update
    const handlePasswordChange = async () => {
        const isPasswordValid = passwordValidator();
        const isMatching = passwordMatchValidator();
        setCurrentPasswordError('');
        // Check password requirements and matching passwords
        if (isPasswordValid && isMatching && password && newPassword) {

            try {
                const requestData = {
                    currentPassword: password,  
                    newPassword: newPassword,
                };
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userID');
    
                // Send password update request
                const response = await fetch(`http://localhost:9000/user/${userId}/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(requestData),
                });
    
                const data = await response.json();
    
                // Handle response
                if (response.ok) {
                    setSuccessMessage('Password succesfully updated!')
                    setTimeout(() => {
                        setSuccessMessage(''); // Clear success message
                        setPasswordModalOpened(false);  // Close modal
                        setPassword('');  // Clear current password
                        setNewPassword(''); // Clear new password
                        setRePassword(''); // Clear re-entered password
                    }, 2000);
                } else {
                    setNewPassword(''); // Clear new password
                    setRePassword(''); // Clear re-entered password
                    if(data.sameMessage) {
                        setPasswordError(data.sameMessage);
                    } else {
                        setCurrentPasswordError(data.message); 
                    }
                    
                }
    
            } catch (error) {
                console.error('Error updating password:', error);
                setCurrentPasswordError('An error occurred while updating password.');
            }
        }
    };
    

    // Handlers for saving changes
    const handleNameChange = async (infoName: string, newValue: string) => {
        const isNameChanged = infoName === 'firstname' ? newValue.trim() !== firstName : newValue.trim() !== lastName;
        if (newValue && isNameChanged) {         
            try {
                const requestData = {
                    info: newValue
                };
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userID');
                const response = await fetch(`http://localhost:9000/user/${userId}?infoName=${infoName}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(requestData),
                });
    
                const data = await response.json();
                if (response.ok) {
                    console.log(data);
                    if (infoName === 'firstname') {
                        setFirstName(newValue);
                        setFirstNameModalOpened(false);
                    } else if (infoName === 'lastname') {
                        setLastName(newValue);
                        setLastNameModalOpened(false);
                    }
                } else {
                    console.log(data);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };
    
    const handleFirstNameChange = () => handleNameChange('firstname', tempFirstName.trim());
    const handleLastNameChange = () => handleNameChange('lastname', tempLastName.trim());

    //Handle delete
    const handleDelete = async () => {
        const token = localStorage.getItem('token');
        const requestData = {
            userId: userId, 
        };
        try {
            const response = await fetch(`http://localhost:9000/user`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestData),
            });
    
            if (response.ok) {
                localStorage.removeItem("token");
                localStorage.removeItem("userID");
                setDeleteMessage('Your account has been deleted successfully!')
                setTimeout(() => {
                    setDeleteModalOpened(false); // Close the delete modal
                    router.push('/login');
                }, 2000)
            } else {
                const data = await response.json();
                console.error(data.message);
            }
        } catch (error) {
            console.error('Error deleting speech:', error);
        }
    };
    

    // Modal for editing first name
    const editFirstNameModal = (
        <div className="edit_first_modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-5 rounded-lg shadow-lg w-[70vw] md:w-1/4">
                <label htmlFor="first_name" className="block text-sm font-medium text-teal-800">
                    First Name:
                </label> 
                <input
                    type="text"
                    id="first_name"
                    value={tempFirstName}
                    onChange={(e) => setTempFirstName(e.target.value.replace(/\s+/g, ' '))} 
                    placeholder="Enter your first name"
                    maxLength={50}
                    required
                    className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => {
                            setTempFirstName(firstName); // Reset temp to original
                            setFirstNameModalOpened(false);
                        }}
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mr-2">
                        Cancel
                    </button>
                    <button
                        onClick={handleFirstNameChange}
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );

    // Modal for editing last name
    const editLastNameModal = (
        <div className="edit_last_modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-5 rounded-lg shadow-lg w-[70vw] md:w-1/4">
                <label htmlFor="last_name" className="block text-sm font-medium text-teal-800">
                    Last Name:
                </label> 
                <input
                    type="text"
                    id="last_name"
                    value={tempLastName}
                    onChange={(e) => setTempLastName(e.target.value.replace(/\s+/g, ' '))} 
                    placeholder="Enter your last name"
                    maxLength={50}
                    required
                    className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => {
                            setTempLastName(lastName); // Reset temp to original
                            setLastNameModalOpened(false);
                        }}
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mr-2">
                        Cancel
                    </button>
                    <button
                        onClick={handleLastNameChange}
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                        Save
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

    // Modal for changing password
    const changePasswordModal = (
        <div className="password_modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-5 rounded-lg shadow-lg w-[80vw] md:w-1/4">
                <h3 className="text-lg mb-2 text-center text-teal-700 font-semibold">Change Password</h3>
                <label htmlFor="current_password" className="block text-sm font-medium text-teal-800">
                    Current Password:
                </label>
                <input
                    type="password"
                    id="current_password"
                    placeholder="Enter your current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                {currentPasswordError && <p className="mt-1 error_message text-red-700 text-[10px]">{currentPasswordError}</p>}
                <label htmlFor="new_password" className="block text-sm font-medium text-teal-800 mt-4">
                    New Password:
                </label>
                <input
                    type="password"
                    id="new_password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                {passwordError && <p className="mt-1 error_message text-red-700 text-[10px]">{passwordError}</p>}
                <label htmlFor="re_password" className="block text-sm font-medium text-teal-800 mt-4">
                    Re-enter New Password:
                </label>
                <input
                    type="password"
                    id="re_password"
                    placeholder="Re-enter your new password"
                    value={rePassword}
                    onChange={(e) => setRePassword(e.target.value)}
                    required
                    className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                {matchError && <p className="mt-1 match_error text-red-700 text-[10px]">{matchError}</p>}
                {successMessage && <p className="success_message bg-teal-100 text-teal-600 text-center mt-4 rounded-md">{successMessage}</p>}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => {
                            setPasswordModalOpened(false);
                            setPassword('');
                            setNewPassword('');
                            setRePassword('');
                            setPasswordError('');
                            setMatchError('');
                            setCurrentPasswordError('');
                        }}
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mr-2">
                        Cancel
                    </button>
                    <button
                        onClick={handlePasswordChange}
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                        Save
                    </button>
                </div>
            </div>        
        </div>
    );

    const deleteModal = (
        <div className="delete_modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl w-[70vw] md:w-1/3">
            <h3 className="text-teal-1000 text-lg mb-4">Are you sure you want to delete your account? 
                This action is permanent, and all of your data will be lost. Please confirm if you wish to proceed.</h3>
            <div className="flex justify-end">
              <button
                onClick={() => setDeleteModalOpened(false)}
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="confirm_delete bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Confirm
              </button>
            </div>
            {deletMessage && <p className="success_message bg-teal-100 text-teal-600 text-center mt-4 rounded-md">{deletMessage}</p>}
          </div>
        </div>
    );

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
                    <li>
                        <Link href="/create">
                        <button className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2">
                            Create New
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

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center p-10">
                <h2 className="text-2xl font-semibold text-center mb-4 text-teal-700">
                    Profile
                </h2>
                <div className="w-[80vw] md:w-1/2 bg-white p-6 rounded-lg shadow-lg">
                    <ul className="space-y-6 text-teal-900">
                        <li className="first_name flex items-center justify-between">
                            <span className="text-lg">First Name: {firstName}</span>
                            <button onClick={() => {
                                setTempFirstName(firstName); // Initialize temp with current value
                                setFirstNameModalOpened(true);
                            }} className="edit_first_name py-1 px-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                                Edit
                            </button>
                        </li>
                        <li className="last_name flex items-center justify-between">
                            <span className="text-lg">Last Name: {lastName}</span>
                            <button onClick={() => {
                                setTempLastName(lastName); // Initialize temp with current value
                                setLastNameModalOpened(true);
                            }} className="edit_last_name  py-1 px-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                                Edit
                            </button>
                        </li>
                        <div className="flex space-x-4 justify-center">
                            <li>
                                <button onClick={() => setPasswordModalOpened(true)} className="py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                                    Change Password
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setDeleteModalOpened(true)} className="py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                                    Delete Account
                                </button>
                            </li>
                        </div>
                        
                    </ul>
                </div>
            </div>
            {firstNameModalOpened && editFirstNameModal}
            {lastNameModalOpened && editLastNameModal}
            {passwordModalOpened && changePasswordModal}
            {deleteModalOpened && deleteModal}
        </div>
    );
}
