import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ForgotPassword = ({ display, setDisplay }) => {
    const emailRef = useRef(null);
    const modalRef = useRef(null);
    const [email, setEmail] = useState('');

    const handleForgotPassword = async () => {
        try {
            const response = await axios.post(
                'http://localhost:8000/forgot-password',
                {
                    email: email,
                }
            );

            emailRef.current.value = '';
            setDisplay(false);
            toast.success(response.data, {
                autoClose: false,
            });
        } catch (error) {
            console.error(error);
            toast.error(
                'An error occurred. Contact the administrator for assistance.',
                {
                    autoClose: 6000,
                }
            );
        }

        // axios
        //     .post('http://localhost:8000/forgot-password', {
        //         email: email,
        //     })
        //     .then(function (response) {
        //         toast.success(response.data, {
        //             autoClose: false,
        //         });
        //         emailRef.current.value = '';
        //         setDisplay(false);
        //     })
        //     .catch(function (error) {
        //         console.error(error);
        //         toast.error(
        //             'An error occurred. Contact the administrator for assistance.',
        //             {
        //                 autoClose: 6000,
        //             }
        //         );
        //     });
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
        <dialog
            className={`w-[80vw] md:w-[50vw] sm:h-96 md:h-72 absolute top-[50%] left-[50%] -translate-x-2/4 -translate-y-2/4 z-40 shadow-xl shadow-yedu-dark-gray py-4 px-8 rounded-lg transition-all ${display ? 'block' : 'hidden'}`}
            ref={modalRef}
        >
            <button
                className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125"
                onClick={() => setDisplay(false)}
            >
                <i className="fas fa-times"></i>
            </button>
            <h1 className="text-3xl text-center my-12">We Need Your Email</h1>
            <input
                type="email"
                placeholder="Enter your email address"
                className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full m-auto block focus:border-yedu-green"
                onChange={(e) => setEmail(e.target.value)}
                ref={emailRef}
            />
            <button
                className="bg-yedu-green h-10 px-4 text-white rounded-md w-full border-none outline-none text-yedu-white my-8 text-lg m-auto block hover:opacity-80"
                onClick={handleForgotPassword}
            >
                Submit
            </button>
        </dialog>
    );
};

export default ForgotPassword;
