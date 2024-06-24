import logo from '../../assets/logo.svg';
import google from '../../assets/google.svg';
import microsoft from '../../assets/microsoft.svg';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const SignUp = ({ display, setDisplay, setOpenLogin }) => {
    const navigate = useNavigate();
    const registrationURL = 'http://localhost:8000/users/register';
    const loginURL = 'http://localhost:8000/users/login';
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const validateSignupData = ({
        password,
        confirmPassword,
        email,
        mobileNumber,
        countryCode,
    }) => {
        if (!email || !confirmPassword || !password) {
            toast.info('Please enter all required fields', { autoClose: 5000 });
            return false;
        }
        if (!email.includes('@')) {
            toast.info('Please enter a valid email', { autoClose: 3000 });
            return false;
        }
        if (mobileNumber && !/^\d{3,15}$/.test(mobileNumber)) {
            toast.info(
                'Incorrect mobile number! It should be 3 to 15 digits long.',
                { autoClose: 5000 }
            );
            return false;
        }
        if (
            countryCode &&
            (countryCode.length < 2 ||
                countryCode.length > 4 ||
                countryCode[0] !== '+')
        ) {
            toast.info('Invalid country code.', { autoClose: 3000 });
            return false;
        }
        if (password.length < 8) {
            toast.info('Password must be at least 8 characters long.', {
                autoClose: 3000,
            });
            return false;
        }
        if (password !== confirmPassword) {
            toast.info('Your passwords do not match.', { autoClose: 3000 });
            return false;
        }
        return true;
    };

    const handleLogIn = async (email, password) => {
        if (email && password) {
            setIsPending(true);
            axios
                .post(loginURL, { email, password })
                .then((response) => {
                    localStorage.setItem('jwt', response.data.token);
                    localStorage.setItem(
                        'isNavigationCollapsed',
                        window.innerWidth > 640
                    );
                    localStorage.setItem('theme', 'light');
                    window.location.replace('/chat');
                    toast.success('Welcome! You have successfully registered', {
                        autoClose: 4000,
                    });
                })
                .catch((error) => {
                    if (error.response && error.response.status === 401) {
                        setIsPending(false);
                        toast.error(
                            'Incorrect credentials, please try again.',
                            { autoClose: 5000 }
                        );
                    }
                });
        } else {
            toast.warn('Email and password are required', { autoClose: 3000 });
        }
    };

    const handleSignUp = async () => {
        setIsPending(true);
        const signUpData = {
            password,
            confirmPassword,
            email,
            mobileNumber,
            countryCode,
        };
        if (validateSignupData(signUpData)) {
            try {
                await axios.post(registrationURL, {
                    mobileNumber: countryCode + mobileNumber,
                    password,
                    email,
                });
                await handleLogIn(email, password);
            } catch (error) {
                toast.error(`${error.response.data}`, { autoClose: 5000 });
                setIsPending(false);
            }
        } else {
            setIsPending(false);
        }
    };

    const handleOAuthSignIn = (provider) => {
        window.location.href = `http://localhost:8000/users/${provider}`;
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity ${display ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            ></div>
            <div
                className={`fixed modal-content inset-0 z-10 overflow-y-auto ${display ? 'block' : 'hidden'}`}
            >
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                        <div className="bg-gradient-to-br from-gray-50 to-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <button
                                        className="absolute right-4 top-4 rounded-full bg-yedu-light-green p-2 text-gray-600 hover:bg-yedu-green hover:text-white transition-all duration-300"
                                        onClick={() => setDisplay(false)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                    <img
                                        src={logo}
                                        alt=""
                                        className="mx-auto w-16 hover:animate-spin"
                                    />
                                    <h3
                                        className="text-3xl font-semibold leading-6 text-gray-900 mt-8 mb-4"
                                        id="modal-title"
                                    >
                                        Create an Account
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 mb-4">
                                            Fields marked with an{' '}
                                            <i className="fas fa-asterisk text-xs text-yedu-danger"></i>{' '}
                                            are required
                                        </p>
                                        <div className="space-y-4">
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yedu-green focus:border-transparent"
                                                    placeholder="Email address"
                                                    onChange={(e) =>
                                                        setEmail(e.target.value)
                                                    }
                                                />
                                                <i className="fas fa-asterisk text-xs text-yedu-danger absolute right-3 top-1/2 -translate-y-1/2"></i>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yedu-green focus:border-transparent"
                                                    placeholder="Country code e.g. +263"
                                                    onChange={(e) =>
                                                        setCountryCode(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <input
                                                    type="tel"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yedu-green focus:border-transparent"
                                                    placeholder="Mobile number"
                                                    onChange={(e) =>
                                                        setMobileNumber(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={
                                                        showPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yedu-green focus:border-transparent"
                                                    placeholder="Enter your password"
                                                    onChange={(e) =>
                                                        setPassword(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-yedu-light-green transition-colors duration-200"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword
                                                        )
                                                    }
                                                >
                                                    <i
                                                        className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                                                    ></i>
                                                </button>
                                                <i className="fas fa-asterisk text-xs text-yedu-danger absolute right-10 top-1/2 -translate-y-1/2"></i>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={
                                                        showConfirmPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yedu-green focus:border-transparent"
                                                    placeholder="Confirm your password"
                                                    onChange={(e) =>
                                                        setConfirmPassword(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-yedu-light-green transition-colors duration-200"
                                                    onClick={() =>
                                                        setShowConfirmPassword(
                                                            !showConfirmPassword
                                                        )
                                                    }
                                                >
                                                    <i
                                                        className={`fas ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                                                    ></i>
                                                </button>
                                                <i className="fas fa-asterisk text-xs text-yedu-danger absolute right-10 top-1/2 -translate-y-1/2"></i>
                                            </div>
                                            <button
                                                className="w-full bg-yedu-green text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yedu-green"
                                                onClick={handleSignUp}
                                                disabled={isPending}
                                            >
                                                {isPending ? (
                                                    <i className="fas fa-spinner animate-spin"></i>
                                                ) : (
                                                    'Continue'
                                                )}
                                            </button>
                                            <p className="text-sm">
                                                Already have an account?{' '}
                                                <button
                                                    className="text-yedu-green hover:underline focus:outline-none"
                                                    onClick={() => {
                                                        setDisplay(false);
                                                        setOpenLogin(true);
                                                    }}
                                                >
                                                    Login
                                                </button>
                                            </p>
                                            <div className="relative flex items-center py-2">
                                                <div className="flex-grow border-t border-gray-300"></div>
                                                <span className="flex-shrink mx-4 text-gray-400">
                                                    OR
                                                </span>
                                                <div className="flex-grow border-t border-gray-300"></div>
                                            </div>
                                            <button
                                                className="w-full flex items-center justify-center border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yedu-green"
                                                onClick={() =>
                                                    handleOAuthSignIn('google')
                                                }
                                            >
                                                <img
                                                    src={google}
                                                    alt=""
                                                    className="w-5 h-5 mr-2"
                                                />
                                                <span>
                                                    Continue with Google
                                                </span>
                                            </button>
                                            <button
                                                className="w-full flex items-center justify-center border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yedu-green"
                                                onClick={() =>
                                                    handleOAuthSignIn(
                                                        'microsoft'
                                                    )
                                                }
                                            >
                                                <img
                                                    src={microsoft}
                                                    alt=""
                                                    className="w-5 h-5 mr-2"
                                                />
                                                <span>
                                                    Continue with Microsoft
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignUp;
