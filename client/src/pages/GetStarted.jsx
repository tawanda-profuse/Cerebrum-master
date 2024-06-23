import { useEffect, useState } from 'react';
import logoGray from '../assets/logo-gray.svg';
import { useNavigate } from 'react-router-dom';
import TermsOfUse from '../components/Modals/TermsOfUse';
import Policy from '../components/Modals/Policy';
import Login from '../components/Modals/Login';
import SignUp from '../components/Modals/SignUp';
import { toast } from 'react-toastify';
import ResetPassword from '../components/Modals/ResetPassword';
import ForgotPassword from '../components/Modals/ForgotPassword';
import axios from 'axios';

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
            navigate('/chat');
            toast.success('Welcome back!', {
                autoClose: 5000,
            });
        }

        const retrievedToken = async () => {
            try {
                if (token) {
                    const response = await axios.get(
                        `http://localhost:8000/users/reset-password?token=${token}`
                    );
                    const tokenData = response.data.token;

                    if (tokenData) {
                        setResetPassword(true);
                    }
                }
            } catch (error) {
                console.error(error);
                return;
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
            <section className="flex w-screen h-screen">
                <div className="hidden md:block bg-yedu-light-gray w-2/4"></div>
                <div className="w-full md:w-2/4 flex flex-col gap-8 justify-center items-center relative">
                    <h1 className="text-yedu-dark text-3xl">Get Started</h1>
                    <div className="flex flex-col md:flex-row justify-center gap-4 flex-wrap w-3/5 md:w-2/4">
                        <button
                            className="flex-auto md:flex-1 min-w-32 bg-yedu-green py-2 px-4 rounded-md border-none outline-none text-yedu-white hover:opacity-80"
                            onClick={() => {
                                setLoginModal(true);
                            }}
                        >
                            Login
                        </button>
                        <button
                            className="flex-auto md:flex-1 min-w-32 bg-yedu-green py-2 px-4 rounded-md border-none outline-none text-yedu-white hover:opacity-80"
                            onClick={() => {
                                setSignUpModal(true);
                            }}
                        >
                            Sign up
                        </button>
                    </div>
                    <div className="absolute bottom-4">
                        <div className="flex justify-center items-center gap-2 mb-4">
                            <img
                                src={logoGray}
                                alt=""
                                className="w-8 fill-yedu-light-gray"
                            />
                            <h3 className="text-yedu-dark-gray font-medium">
                                Yedu Studio
                            </h3>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                className="text-yedu-dark-gray underline hover:no-underline"
                                onClick={() => {
                                    setTermsOfUse(true);
                                    setPrivacyPolicy(false);
                                }}
                            >
                                Terms of Use
                            </button>
                            <p className="text-yedu-dark-gray">|</p>
                            <button
                                className="text-yedu-dark-gray underline hover:no-underline"
                                onClick={() => {
                                    setPrivacyPolicy(true);
                                    setTermsOfUse(false);
                                }}
                            >
                                Privacy Policy
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default GetStarted;
