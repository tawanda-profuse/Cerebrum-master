import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import google from '../assets/google.svg';
import microsoft from '../assets/microsoft.svg';
import apple from '../assets/apple-logo.svg';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ForgotPassword from '../components/ForgotPassword';
import ResetPassword from '../components/ResetPassword';

const Login = () => {
    const jwt = localStorage.getItem('jwt');
    const navigate = useNavigate();
    useEffect(() => {
        document.title = 'Sign In to Yedu';

        if (jwt) {
            navigate('/chat');
            toast.info('Cannot access that page. Logout first.');
        }
    }, [jwt, navigate]);
    const [email, setEmail] = useState(null);
    const [password, setPassword] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);
    const [resetPassword, setResetPassword] = useState(false);
    const url = 'http://localhost:8000/login';
    const handleSignIn = () => {
        if (email && password) {
            setIsPending(true);
            axios
                .post(url, {
                    email: email,
                    password: password,
                })
                .then((response) => {
                    localStorage.setItem('jwt', response.data.token); // Store JWT in localStorage
                    navigate('/chat');
                    toast.success('Successfully logged in', {
                        autoClose: 4000,
                    });
                })
                .catch((error) => {
                    if (error.response && error.response.status === 401) {
                        setIsPending(false);
                        toast.error(
                            'Incorrect credentials, please try again.',
                            {
                                autoClose: 5000,
                            }
                        );
                    }
                });
        } else {
            setIsPending(false);
            toast.warn('Email and password are required', {
                autoClose: 3000,
            });
        }
    };
    const handleForgotPassword = (e) => {
        e.preventDefault();
        setForgotPassword(true);
        toast.info('Enter your email address for further assistance.', {
            autoClose: 6000,
        });
    };

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    useEffect(() => {
        const retrievedToken = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:8000/reset-password?token=${token}`
                );
                const tokenData = response.data.token;
                
                if (tokenData) {
                    setResetPassword(true);
                } 
        
            } catch (error) {
                console.error(error);
                return;
            }
        };

        retrievedToken()
    }, [token]);
    return (
        <>
            <ForgotPassword
                display={forgotPassword}
                setDisplay={setForgotPassword}
            />
            <ResetPassword
                display={resetPassword}
                setDisplay={setResetPassword}
                hiddenToken={token}
            />
            <section className="w-screen h-screen py-16 px-8 overflow-x-hidden">
                <img src={logo} alt="" className="m-auto w-16" />

                <div className="md:w-2/4 m-auto">
                    <div className="flex flex-col justify-center items-center w-full gap-4 mt-16">
                        <h1 className="font-medium text-3xl text-center">
                            Welcome Back
                        </h1>
                        <p>
                            Fields marked with an{' '}
                            <i className="fas fa-asterisk self-start text-xs text-yedu-danger"></i>{' '}
                            are required
                        </p>
                        <div className="w-full relative">
                            <i className="fas fa-asterisk self-start text-xs text-yedu-danger absolute right-5 top-2/4 -translate-y-2/4"></i>
                            <input
                                type="email"
                                className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                                placeholder="Email address"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative w-full">
                            <i className="fas fa-asterisk self-start text-xs text-yedu-danger absolute right-20 top-2/4 -translate-y-2/4"></i>
                            <input
                                type={`${showPassword ? 'text' : 'password'}`}
                                className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                                placeholder="Enter your password"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-0 border rounded-md h-full w-14 hover:bg-yedu-light-green"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i
                                    className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                                ></i>
                            </button>
                        </div>
                        <button
                            className="bg-yedu-green h-10 py-2 px-4 text-white rounded-md border-none outline-none text-yedu-white w-full hover:opacity-80"
                            onClick={handleSignIn}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <i className="fas fa-spinner animate-spin"></i>
                            ) : (
                                'Continue'
                            )}
                        </button>
                        <p className="my-2">
                            Already have an account?{' '}
                            <Link
                                to="/user/signup"
                                className="text-yedu-green hover:underline"
                            >
                                Sign up
                            </Link>
                        </p>
                        <p className="my-2">
                            Forgotten your password?{' '}
                            <Link
                                to="/"
                                className="text-yedu-green hover:underline"
                                onClick={(e) => handleForgotPassword(e)}
                            >
                                Reset it now
                            </Link>
                        </p>
                        <p className=""></p>
                        <span className="w-full relative flex items-center">
                            <hr className="text-yedu-dark-gray w-1/3" />
                            <p className=" bg-yedu-white w-1/3 text-center">
                                OR
                            </p>
                            <hr className="text-yedu-dark-gray w-1/3" />
                        </span>
                    </div>
                    <div className="flex flex-col justify-center items-center w-full gap-6 m-auto my-8">
                        <button className="w-full flex justify-start items-center border border-yedu-dark-gray py-2 px-8 rounded-md hover:bg-yedu-dull text-sm">
                            <img src={google} alt="" />{' '}
                            <p className="w-[100%]">Continue with Google</p>
                        </button>
                        <button className="w-full flex justify-start items-center border border-yedu-dark-gray py-2 px-8 rounded-md hover:bg-yedu-dull text-sm">
                            <img src={microsoft} alt="" />
                            <p className="w-[100%]">Continue with Microsoft</p>
                        </button>
                        <button className="w-full flex justify-start items-center border border-yedu-dark-gray py-2 px-8 rounded-md hover:bg-yedu-dull text-sm">
                            <img src={apple} alt="" />
                            <p className="w-[100%]">Continue with Apple</p>
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Login;
