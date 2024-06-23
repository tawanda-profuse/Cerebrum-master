import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import google from '../../assets/google.svg';
import microsoft from '../../assets/microsoft.svg';
import apple from '../../assets/apple-logo.svg';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'react-toastify';

const Login = ({
    display,
    setDisplay,
    setOpenSignUp,
    setOpenForgotPassword,
}) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState(null);
    const [password, setPassword] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const url = 'http://localhost:8000/users/login';

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
                    localStorage.setItem('isNavigationCollapsed', window.innerWidth > 640 ? true : false);
                    localStorage.setItem('theme', 'light');
                    window.location.replace("/chat");
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

    const handleOAuthSignIn = (provider) => {
        window.location.href = `http://localhost:8000/users/${provider}`;
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        setOpenForgotPassword(true);
        setDisplay(false);
        toast.info('Enter your email address for further assistance.', {
            autoClose: 6000,
        });
    };

    return (
        <>
            <div
                className={`modal-backdrop ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog
                className="modal-styles extended-modal-styles"
                open={display}
            >
                <button className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125">
                    <i
                        className="fas fa-times"
                        onClick={() => {
                            setDisplay(false);
                        }}
                    ></i>
                </button>
                <img
                    src={logo}
                    alt=""
                    className="m-auto w-16 hover:animate-spin"
                />

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
                            className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Email address"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full">
                        <i className="fas fa-asterisk self-start text-xs text-yedu-danger absolute right-20 top-2/4 -translate-y-2/4"></i>
                        <input
                            type={`${showPassword ? 'text' : 'password'}`}
                            className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
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
                        className="bg-yedu-green h-10 py-2 px-4 rounded-md border-none outline-none text-yedu-white w-full hover:opacity-80"
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
                        <button
                            className="text-yedu-green hover:underline"
                            onClick={() => {
                                setOpenSignUp(true);
                                setDisplay(false);
                            }}
                        >
                            Sign up
                        </button>
                    </p>
                    <p className="my-2">
                        Forgotten your password?{' '}
                        <button
                            className="text-yedu-green hover:underline"
                            onClick={(e) => handleForgotPassword(e)}
                        >
                            Reset it now
                        </button>
                    </p>
                    <p className=""></p>
                    <span className="w-full relative flex items-center">
                        <hr className="text-yedu-dark-gray w-1/3" />
                        <p className=" bg-yedu-white w-1/3 text-center">OR</p>
                        <hr className="text-yedu-dark-gray w-1/3" />
                    </span>
                </div>
                <div className="flex flex-col justify-center items-center w-full gap-6 m-auto my-8">
                    <button
                        className="w-full flex justify-start items-center border  py-2 px-8 rounded-md hover:bg-yedu-light-gray text-sm"
                        onClick={() => handleOAuthSignIn('google')}
                    >
                        <img src={google} alt="" />{' '}
                        <p className="w-[100%]">Continue with Google</p>
                    </button>
                    <button
                        className="w-full flex justify-start items-center border  py-2 px-8 rounded-md hover:bg-yedu-light-gray text-sm"
                        onClick={() => handleOAuthSignIn('microsoft')}
                    >
                        <img src={microsoft} alt="" />
                        <p className="w-[100%]">Continue with Microsoft</p>
                    </button>
                    <button
                        className="w-full flex justify-start items-center border  py-2 px-8 rounded-md hover:bg-yedu-light-gray text-sm"
                        onClick={() => navigate("/404")}
                    >
                        <img src={apple} alt="" />
                        <p className="w-[100%]">Continue with Apple</p>
                    </button>
                </div>
            </dialog>
        </>
    );
};

export default Login;
