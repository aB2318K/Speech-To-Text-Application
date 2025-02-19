'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function NewPassword() {
    const router = useRouter();
    const params = useParams();
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [matchError, setMatchError] = useState('');
    const [reEnter, setReEnter] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [loading, setLoading] = useState(true); // Loading state
    const [isTokenValid, setIsTokenValid] = useState(true); // State to track token validity
    const [errorMessage, setErrorMessage] = useState(''); // State to store error message for invalid token

    const passwordValidator = () => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
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
        if (password !== reEnter) {
            setMatchError('*Passwords do not match');
            return false;
        } else {
            setMatchError('');
            return true;
        }
    };

    const getResetToken = async (resetId: string) => { 
        try {
            const response = await fetch(`http://localhost:9000/reset-password?resetId=${resetId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            const data = await response.json();
            // If the token is invalid or expired
            if (response.ok && data) {
                setResetToken(data);
                setIsTokenValid(true); // Token is valid
            } else {
                setIsTokenValid(false); // Token is invalid or expired
                setErrorMessage('The link you used to reset the password is either expired or invalid. Please request a new one.');
            }
        } catch (error) {
            console.error('Error:', error);
            setIsTokenValid(false);
            setErrorMessage('An error occurred while verifying the reset link.');
        } finally {
            setLoading(false); // Stop loading after token verification
        }
    };

    useEffect(() => {
        const resetId = Array.isArray(params.id) ? params.id[0] : params.id;
        if (resetId) {
            getResetToken(resetId);
        }
    }, [params.id]);

    const handleSubmission = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const isPasswordValid = passwordValidator();
        const isMatching = passwordMatchValidator();
        if (isPasswordValid && isMatching && resetToken) {
            try {
                const requestData = {  
                    newPassword: password,
                    resetToken: resetToken
                };
    
                // Send password update request
                const response = await fetch(`http://localhost:9000/reset-password`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resetToken}`, 
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });
    
                const data = await response.json();
    
                // Handle response
                if (response.ok) {
                    setSuccessMessage('You have successfully updated your password. Redirecting to Log In page');

                    setTimeout(() => {
                        router.push('/login'); // Redirect to login page
                    }, 3000); 
                } else {
                    setPassword('');
                    if(data.sameMessage) {
                        setPasswordError(data.sameMessage);
                    } else {
                        setPasswordError(data.message); 
                    }
                }
    
            } catch (error) {
                console.error('Error updating password:', error);
                setPasswordError('An error occurred while updating password.');
            }
        }
    };

    // Loading spinner while waiting for token validation
    if (loading) {
        return (
          <div className="flex h-screen bg-teal-50 items-center justify-center">
            <div className="spinner"></div> 
          </div>
        );
    }

    // If the token is invalid or expired, show error message
    if (!isTokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-teal-50">
                <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-semibold text-center mb-6 text-teal-700">
                        Reset Link Invalid
                    </h2>
                    <p className="text-center text-red-700">{errorMessage}</p>
                    <p className="text-center mt-4">
                        <Link href="/login" className="text-teal-600 hover:underline">
                            Go back to login
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-teal-50">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-3xl font-semibold text-center mb-6 text-teal-700">
                    Create New Password
                </h2>
                <form onSubmit={handleSubmission} className="space-y-5">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-teal-800"
                        >
                            New Password:
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            name="password"
                            placeholder="Enter your password"
                            className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {passwordError && <p className="mt-1 error_message text-red-700 text-[10px] inline-block">{passwordError}</p>}
                    </div>
                    <div>
                        <label
                            htmlFor="re-enter-password"
                            className="block text-sm font-medium text-teal-800"
                        >
                            Re-enter your password: 
                        </label>
                        <input
                            type="password"
                            id="re-enter-password"
                            value={reEnter}
                            placeholder="Re-enter your password"
                            onChange={(e) => setReEnter(e.target.value)}
                            name="re-enter-password"
                            className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {matchError && <p className="match_error text-red-700 text-[10px] inline-block">{matchError}</p>}
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        Update Password
                    </button>
                    {successMessage && <p className="success_message bg-teal-100 text-teal-600 text-center mt-4 rounded-md">{successMessage}</p>}
                    {!successMessage && 
                    <p className="mt-4 text-center text-sm text-teal-800">
                        <Link href="/login" className="text-teal-600 hover:underline">
                            Back to log in
                        </Link>
                    </p>}
                </form>
            </div>
        </div>
    );
}
