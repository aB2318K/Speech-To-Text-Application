'use client'

import { useState } from "react";
import Link from "next/link";

export default function Reset() {
    const [successMessage, setSuccessMessage] = useState('');
    const [emailError, setEmailError] = useState('');
    const [email, setEmail] = useState('');

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

    const handleClick = async (event: React.MouseEvent) => {
        event.preventDefault();
        setSuccessMessage('');
        const isEmailValid = emailValidator();
        const requestBody = {
            email
        }
        if(isEmailValid) {
            try {
                const response = await fetch(`https://speech-to-text-application.onrender.com/reset`, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(requestBody)
                });
                if(response.ok) {
                    setSuccessMessage('A password reset link has been sent to your email');
                } else if(response.status === 404) {
                    setEmailError('*Email not found. Please check for typos or create a new account.');
                } else {
                    const errorData = await response.json();
                    console.log(errorData);
                    setEmailError('*There was an error. Please try again later');
                }

              } catch (error) {
                console.error('Error:', error);
              } 
        } 
    }

    return(
        <div className="min-h-screen flex items-center justify-center bg-teal-50">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-3xl font-semibold text-center mb-6 text-teal-700">
                    Reset Password
                </h2>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="mt-1 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                {emailError && <p className="mt-1 error_message text-red-700 text-[10px]">{emailError}</p>}
                <button 
                    type="button"
                    onClick={handleClick}
                    className="mt-5 w-full py-3 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                    Send Link
                </button>
                {successMessage && <p className="success_message bg-teal-100 text-teal-600 text-center mt-4 rounded-md">{successMessage}</p>}
                <p className="mt-4 text-center text-sm text-teal-800">
                    <Link href="/login" className="text-teal-600 hover:underline">
                        Back to log in
                    </Link>
                </p>
            </div>
         </div>
    )
}