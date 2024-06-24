import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

import logoGray from '../assets/logo-gray.svg';
import TermsOfUse from '../components/Modals/TermsOfUse';
import Policy from '../components/Modals/Policy';
import Login from '../components/Modals/Login';
import SignUp from '../components/Modals/SignUp';
import ResetPassword from '../components/Modals/ResetPassword';
import ForgotPassword from '../components/Modals/ForgotPassword';
import AnimatedChat from './AnimatedChat';

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
        document.title = 'Get Started with Yedu Studio';

        if (jwt) {
            window.location.replace('/chat');
        }

        const retrievedToken = async () => {
            try {
                if (token) {
                    const response = await axios.get(`http://localhost:8000/users/reset-password?token=${token}`);
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
            <Login display={loginModal} setDisplay={setLoginModal} setOpenSignUp={setSignUpModal} setOpenForgotPassword={setForgotPassword} />
            <SignUp display={signUpModal} setDisplay={setSignUpModal} setOpenLogin={setLoginModal} />
            <ResetPassword display={resetPassword} setDisplay={setResetPassword} hiddenToken={token} />
            <ForgotPassword display={forgotPassword} setDisplay={setForgotPassword} />
            <TermsOfUse show={termsOfUse} setShow={setTermsOfUse} />
            <Policy display={privacyPolicy} setDisplay={setPrivacyPolicy} />
            
            <section className="flex w-screen h-screen">
                <div className="hidden md:flex w-1/2 bg-gradient-to-br from-yedu-green to-green-700 flex-col justify-between p-8 relative overflow-hidden">
                    <div className="z-10">
                        <h1 className="text-yedu-white text-4xl font-bold mb-2">Yedu Studio</h1>
                    </div>
                    <AnimatedChat />
                    <p className="text-yedu-white text-sm opacity-90 z-10">Experience the future of web development</p>
                    
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yedu-white opacity-10 rounded-full filter blur-3xl"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-yedu-white opacity-10 rounded-full filter blur-2xl"></div>
                    </div>
                </div>
                
                <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-yedu-white p-8">
                    <div className="w-full max-w-md">
                        <h2 className="text-4xl font-bold text-yedu-dark mb-8 text-center">Get Started</h2>
                        <div className="space-y-4">
                            <button
                                className="w-full bg-yedu-green text-yedu-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition duration-300 shadow-md hover:shadow-lg"
                                onClick={() => setLoginModal(true)}
                            >
                                Login
                            </button>
                            <button
                                className="w-full bg-yedu-white text-yedu-green py-3 px-6 rounded-lg text-lg font-semibold border-2 border-yedu-green hover:bg-yedu-light-green transition duration-300 shadow-sm hover:shadow-md"
                                onClick={() => setSignUpModal(true)}
                            >
                                Sign up
                            </button>
                        </div>
                        <div className="mt-12 text-center">
                            <img src={logoGray} alt="Yedu Studio Logo" className="w-8 inline-block mr-2" />
                            <span className="text-yedu-gray-text">Yedu Studio</span>
                            <div className="mt-4 space-x-4 text-sm">
                                <button className="text-yedu-gray-text hover:text-yedu-green transition duration-300" onClick={() => setTermsOfUse(true)}>
                                    Terms of Use
                                </button>
                                <button className="text-yedu-gray-text hover:text-yedu-green transition duration-300" onClick={() => setPrivacyPolicy(true)}>
                                    Privacy Policy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default GetStarted;