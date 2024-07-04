import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
const env = process.env.NODE_ENV || 'development';
const baseURL = env === 'production' ? process.env.REACT_APP_PROD_API_URL : process.env.REACT_APP_DEV_API_URL;

const ForgotPassword = ({ display, setDisplay }) => {
    const emailRef = useRef(null);
    const modalRef = useRef(null);
    const [email, setEmail] = useState('');
    const [isPending, setIsPending] = useState(false);

    const handleForgotPassword = async () => {
        setIsPending(true);
        emailRef.current.value = '';
        try {
            const response = await axios.post(
                `${baseURL}/users/forgot-password`,
                {
                    email: email,
                }
            );

            toast.success(response.data, {
                autoClose: 8000,
            });
            setDisplay(false);
            setEmail('');
            setIsPending(false);
        } catch (error) {
            setIsPending(false);
            console.error(error);
            toast.error(
                'An error occurred. Contact the administrator for assistance.',
                {
                    autoClose: 6000,
                }
            );
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setDisplay(false);
            }
        };

        if (display) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        // Cleanup event listener on component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [display, setDisplay]);

    return (
        <>
            <div
                className={`modal-backdrop ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog className="modal-styles" ref={modalRef} open={display}>
                <button
                    className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125"
                    onClick={() => setDisplay(false)}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h1 className="text-3xl text-center my-12">
                    We Need Your Email
                </h1>
                <input
                    type="email"
                    placeholder="Enter your email address"
                    className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full m-auto block focus:border-yedu-green"
                    onChange={(e) => setEmail(e.target.value)}
                    ref={emailRef}
                />
                <button
                    className="bg-yedu-green h-10 px-4 rounded-md w-full border-none outline-none text-yedu-white my-8 text-lg m-auto block hover:opacity-80"
                    onClick={handleForgotPassword}
                >
                    {isPending ? (
                        <i className="fas fa-spinner animate-spin"></i>
                    ) : (
                        'Submit'
                    )}
                </button>
            </dialog>
        </>
    );
};

export default ForgotPassword;
