import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import google from '../../assets/google.svg';
import microsoft from '../../assets/microsoft.svg';
import apple from '../../assets/apple-logo.svg';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'react-toastify';

const SignUp = ({ display, setDisplay, setOpenLogin }) => {
    const navigate = useNavigate();
    const url = 'http://localhost:8000/users/register';
    const [password, setPassword] = useState(null);
    const [email, setEmail] = useState(null);
    const [mobileNumber, setMobileNumber] = useState(null);
    const [countryCode, setCountryCode] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState(null);
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
            toast.info('Please enter all required fields', {
                autoClose: 5000,
            });
            return false;
        }
        if (!email.includes('@')) {
            toast.info('Please enter a valid email', {
                autoClose: 3000,
            });
            return false;
        }
        if (mobileNumber && !/^\d{3,15}$/.test(mobileNumber)) {
            toast.info(
                'Incorrect mobile number! It should be 3 to 5 digits long.',
                {
                    autoClose: 5000,
                }
            );
            return false;
        }
        if (
            countryCode &&
            (countryCode.length < 2 ||
                countryCode.length > 4 ||
                countryCode[0] !== '+')
        ) {
            toast.info('Invalid country code.', {
                autoClose: 3000,
            });
            return false;
        }
        if (password.length < 8) {
            toast.info('Password must be at least 8 characters long.', {
                autoClose: 3000,
            });
            return false;
        }
        if (password !== confirmPassword) {
            toast.info('Your passwords do not match.', {
                autoClose: 3000,
            });
            return false;
        }
        return true;
    };

    const signUpData = {
        password: password,
        confirmPassword: confirmPassword,
        email: email,
        mobileNumber: mobileNumber || '',
        countryCode: countryCode || '',
    };

    const handleSignUp = async () => {
        setIsPending(true);
        if (validateSignupData(signUpData)) {
            try {
                const response = await axios.post(url, {
                    mobileNumber: countryCode + mobileNumber,
                    password,
                    email,
                });
                localStorage.setItem('jwt', response.data.token); // Store JWT in localStorage
                localStorage.setItem('isNavigationCollapsed', window.innerWidth > 640 ? true : false);
                localStorage.setItem("theme", "light");
                navigate('/chat');
                toast.success("You've successfully registered, Welcome!", {
                    autoClose: 4000,
                });
            } catch (error) {
                toast.error(`${error.response.data}`, {
                    autoClose: 5000,
                });
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
                        Create an Account
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
                    <div className="flex w-full gap-2 flex-wrap">
                        <input
                            type="text"
                            className="sm: flex-auto md:flex-1 px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Country code e.g. +263"
                            onChange={(e) => setCountryCode(e.target.value)}
                        />
                        <input
                            type="tel"
                            className="sm: flex-auto md:flex-1 px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Mobile number"
                            onChange={(e) => setMobileNumber(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full">
                        <input
                            type={`${showPassword ? 'text' : 'password'}`}
                            className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Enter your password"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <i className="fas fa-asterisk self-start text-xs text-yedu-danger absolute right-20 top-2/4 -translate-y-2/4"></i>
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
                    <div className="relative w-full">
                        <input
                            type={`${showConfirmPassword ? 'text' : 'password'}`}
                            className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Confirm your password"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <i className="fas fa-asterisk self-start text-xs text-yedu-danger absolute right-20 top-2/4 -translate-y-2/4"></i>
                        <button
                            type="button"
                            className="absolute right-0 border rounded-md h-full w-14 hover:bg-yedu-light-green"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                        >
                            <i
                                className={`fas ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                            ></i>
                        </button>
                    </div>
                    <button
                        className="bg-yedu-green h-10 py-2 px-4 rounded-md border-none outline-none text-yedu-white w-full hover:opacity-80"
                        onClick={handleSignUp}
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
                                setDisplay(false);
                                setOpenLogin(true);
                            }}
                        >
                            Login
                        </button>
                    </p>
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

export default SignUp;
