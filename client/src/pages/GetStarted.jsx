import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import logo from '../assets/logo.svg';
import TermsOfUse from '../components/Modals/TermsOfUse';
import Policy from '../components/Modals/Policy';
import Login from '../components/Modals/Login';
import SignUp from '../components/Modals/SignUp';
import ResetPassword from '../components/Modals/ResetPassword';
import ForgotPassword from '../components/Modals/ForgotPassword';
import AnimatedChat from './AnimatedChat';

const baseURL = process.env.VITE_NODE_ENV === 'production' 
  ? process.env.VITE_PROD_API_URL 
  : process.env.VITE_DEV_API_URL;

const GetStarted = () => {
    const jwt = localStorage.getItem('jwt');
    const navigate = useNavigate();
    const [termsOfUse, setTermsOfUse] = useState(false);
    const [privacyPolicy, setPrivacyPolicy] = useState(false);
    const [loginModal, setLoginModal] = useState(false);
    const [signUpModal, setSignUpModal] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);
    const [resetPassword, setResetPassword] = useState(false);
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    useEffect(() => {
        document.title = 'Get Started with Yedu ';

        if (jwt) {
            window.location.replace('/chat');
        }

        const retrievedToken = async () => {
            try {
                if (token) {
                    const response = await axios.get(
                        `${baseURL}/users/reset-password?token=${token}`
                    );

                    if (response.data.token) {
                        setResetPassword(true);
                    }
                }
            } catch (error) {
                console.error(error);
            }
        };
        retrievedToken();
    }, [jwt, navigate, token]);

    return (
        <>
            <Login
                display={loginModal}
                setDisplay={setLoginModal}
                setOpenSignUp={setSignUpModal}
                setOpenForgotPassword={setForgotPassword}
            />
            <SignUp
                display={signUpModal}
                setDisplay={setSignUpModal}
                setOpenLogin={setLoginModal}
            />
            <ResetPassword
                display={resetPassword}
                setDisplay={setResetPassword}
                hiddenToken={token}
            />
            <ForgotPassword
                display={forgotPassword}
                setDisplay={setForgotPassword}
            />
            <TermsOfUse show={termsOfUse} setShow={setTermsOfUse} />
            <Policy display={privacyPolicy} setDisplay={setPrivacyPolicy} />

            <section className="flex flex-col md:flex-row w-screen md:h-screen bg-gray-50">
                <div className="order-2 md:order-1 flex w-full md:w-1/2 bg-gradient-to-br from-green-500 to-green-600 flex-col justify-between p-12 relative overflow-hidden">
                    <div className="z-10">
                        <h1 className="text-white text-4xl font-bold mb-4">
                            Yedu{' '}
                        </h1>
                        <p className="text-white text-lg opacity-90">
                            Create web applications with ease
                        </p>
                    </div>
                    <AnimatedChat />
                    <p className="text-white text-md opacity-90 z-10">
                        Experience the future of web development
                    </p>

                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white opacity-10 rounded-full filter blur-3xl"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-white opacity-10 rounded-full filter blur-2xl"></div>
                    </div>
                </div>

                <div className="order-1 md:order-2 w-full md:w-1/2 flex flex-col justify-center items-center bg-white p-12">
                    <div className="w-full max-w-md">
                        <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center">
                            Get Started
                        </h2>
                        <div className="space-y-6">
                            <button
                                className="w-full bg-green-500 text-white py-3 px-5 rounded-lg text-lg font-semibold hover:bg-green-600 transition duration-300 shadow-md hover:shadow-lg"
                                onClick={() => setLoginModal(true)}
                            >
                                Login
                            </button>
                            <button
                                className="w-full bg-white text-green-500 py-3 px-5 rounded-lg text-lg font-semibold border-2 border-green-500 hover:bg-green-50 transition duration-300 shadow-sm hover:shadow-md"
                                onClick={() => setSignUpModal(true)}
                            >
                                Sign up
                            </button>
                        </div>
                        <div className="mt-16 text-center">
                            <img
                                src={logo}
                                alt="Yedu Logo"
                                className="w-8 inline-block mr-3"
                            />
                            <span className="text-gray-500 text-md">
                                Yedu AI
                            </span>
                            <div className="mt-6 space-x-6 text-md">
                                <button
                                    className="text-gray-500 hover:text-green-500 transition duration-300"
                                    onClick={() => setTermsOfUse(true)}
                                >
                                    Terms of Use
                                </button>
                                <button
                                    className="text-gray-500 hover:text-green-500 transition duration-300"
                                    onClick={() => setPrivacyPolicy(true)}
                                >
                                    Privacy Policy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="absolute bottom-2 right-2 text-gray-400 text-xs">
                NIP: 5273003980
            </div>
        </>
    );
};

export default GetStarted;
