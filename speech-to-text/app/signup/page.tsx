'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('')
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fieldValidator = (name: string, setError: React.Dispatch<React.SetStateAction<string>>) => {
        if (name.trim().length === 0) { 
            setError('*This field is required');
            return false;
        } else {
            setError('');
            return true;
        }
    };

    const emailValidator = () => {
        const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
        if (!emailRegex.test(email)) {
            setEmailError('*Please provide a valid email address in the format: example@domain.com');
            return false;
        } else {
            setEmailError('');
            return true;
        }
    };

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

    const handleSubmission = async (event: React.MouseEvent) => {
        event.preventDefault();
        setPasswordError('');
        setEmailError('');
        setFirstNameError('');
        setLastNameError('');
      
        const isEmailValid = emailValidator();
        const isPasswordValid = passwordValidator();
        const isFirstNameValid = fieldValidator(firstName, setFirstNameError);
        const isLastNameValid = fieldValidator(lastName, setLastNameError);
      
        if (isEmailValid && isPasswordValid && isFirstNameValid && isLastNameValid) {
          try {
            const requestData = {
                firstname: firstName, //Should match the backend expectation 
                lastname: lastName,  
                email,
                password,
            };
      
            const response = await fetch('https://speech-to-text-application.onrender.com/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData),
            });
      
            const data = await response.json();
            if (response.ok) {
              setSuccessMessage('You have successfully created an account. Redirecting to Login Page...');
              setTimeout(() => {
                router.push('/login'); // Redirect to login 
              }, 3000);
            } else {
              // email is already in use?
              setEmailError(data.message || 'An error occurred while signing up.');
            }
          } catch (error) {
            console.error('Error:', error);
            setEmailError('An error occurred while trying to sign up.');
          }
        }
      };

    return (
        <div className="min-h-screen flex items-center justify-center bg-teal-50"> 
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-3xl font-semibold text-center mb-6 text-teal-700">
                    Sign Up
                </h2>
                <form action="/submit" method="post" className="space-y-5">
                <div>
                    <label 
                        htmlFor="first_name"
                        className="block text-sm font-medium text-teal-800"
                    >
                        First Name:
                    </label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)} 
                        placeholder="Enter your first name"
                        maxLength={50}
                        required
                        className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    {firstNameError && <p className="error_message text-red-700 text-[10px] inline-block">{firstNameError}</p>}
                </div>
                <div>
                    <label 
                        htmlFor="last_name"
                        className="block text-sm font-medium text-teal-800"
                    >
                        Last Name:  
                    </label>
                    
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        maxLength={50}
                        required
                        className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    {lastNameError && <p className="error_message text-red-700 text-[10px] inline-block">{lastNameError}</p>}
                </div>
                <div>
                    <label 
                        htmlFor="email"
                        className="block text-sm font-medium text-teal-800"
                    >
                        Email:
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    {emailError && <p className="mt-1 error_message text-red-700 text-[10px]">{emailError}</p>}
                </div>

                <div>
                    <label 
                        htmlFor="password"
                        className="block text-sm font-medium text-teal-800"
                    >
                        Password:
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter your password"                       
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    {passwordError && <p className="mt-1 error_message text-red-700 text-[10px]">{passwordError}</p>}
                </div>
                <button 
                    type="submit"
                    onClick={(e) => {handleSubmission(e)}}
                    className="w-full py-3 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                    Sign Up
                </button>
                {!successMessage && <p className="mt-4 text-center text-sm text-teal-800">
                    Already have an account?{" "}
                    <Link href="/login" className="text-teal-600 hover:underline">
                        Log in here
                    </Link>
                </p>}
                {successMessage && <p className="success_message bg-teal-100 text-teal-600 text-center mt-4 rounded-md">{successMessage}</p>}
            </form>
            </div>
        </div>
    );
}
