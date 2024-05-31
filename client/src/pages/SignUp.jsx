import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import google from '../assets/google.svg';
import microsoft from '../assets/microsoft.svg';
import apple from '../assets/apple-logo.svg';
import axios from 'axios';
import { useState } from 'react';

const SignUp = () => {
    const navigate = useNavigate();
    const url = 'http://localhost:8000/register';
    const [password, setPassword] = useState(null);
    const [email, setEmail] = useState(null);
    const [mobileNumber, setMobileNumber] = useState(null);
    const [countryCode, setCountryCode] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState(null);

    const validateSignupData = ({
        password,
        confirmPassword,
        email,
        mobileNumber,
        countryCode,
    }) => {
        if (!email.includes('@')) {
            alert('Please enter a valid email');
            return false;
        }
        if (!/^\d{3,15}$/.test(mobileNumber)) {
            alert('Incorrect mobile number format, please try again.');
            return false;
        }
        if (
            countryCode.length < 2 ||
            countryCode.length > 4 ||
            countryCode[0] !== '+'
        ) {
            alert('Invalid country code.');
            return false;
        }
        if (password.length < 5) {
            alert('Password must be at least 5 characters long.');
            return false;
        }
        if (password !== confirmPassword) {
            alert('Your passwords do not match.');
            return false;
        }
        return true;
    };

    const signUpData = {
        password: password,
        confirmPassword: confirmPassword,
        email: email,
        mobileNumber: mobileNumber,
        countryCode: countryCode,
    };

    const handleSignUp = async () => {
        if (validateSignupData(signUpData)) {
            try {
                await axios.post(url, {
                    mobileNumber: countryCode + mobileNumber,
                    password,
                    email,
                });
                alert('Successfully registered! You may now login');
                setTimeout(() => {
                    navigate('/user/login');
                }, 4000);
            } catch (error) {
                alert(error);
            }
        }
    };

    return (
        <>
            <section className="w-screen h-screen py-16 px-8 overflow-x-hidden">
                <img src={logo} alt="" className="m-auto w-16" />

                <div className="md:w-2/4 m-auto">
                    <div className="flex flex-col justify-center items-center w-full gap-4 mt-16">
                        <h1 className="font-medium text-3xl text-center">
                            Create an Account
                        </h1>
                        <input
                            type="email"
                            className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Email address"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="text"
                            className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Country code"
                            onChange={(e) => setCountryCode(e.target.value)}
                        />
                        <input
                            type="tel"
                            className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Mobile number"
                            onChange={(e) => setMobileNumber(e.target.value)}
                        />
                        <input
                            type="password"
                            className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Enter your password"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Confirm your password"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            className="bg-yedu-green h-10 py-2 px-4 text-white rounded-md border-none outline-none text-yedu-white w-full hover:opacity-80"
                            onClick={handleSignUp}
                        >
                            Continue
                        </button>
                        <p className="my-2">
                            Already have an account?{' '}
                            <Link
                                to="/user/login"
                                className="text-yedu-green hover:underline"
                            >
                                Login
                            </Link>
                        </p>
                        <span className="w-full relative flex items-center">
                            <hr className="text-yedu-dark-gray w-1/3" />
                            <p className=" bg-yedu-white w-1/3 text-center">
                                OR
                            </p>
                            <hr className="text-yedu-dark-gray w-1/3" />
                        </span>
                    </div>
                    <div className="flex flex-col justify-center items-center w-full gap-6 m-auto my-8">
                        <button className="w-full flex justify-start items-center gap-24 border border-yedu-dark-gray py-2 px-8 rounded-md hover:bg-yedu-dull text-sm">
                            <img src={google} alt="" /> Continue with Google
                        </button>
                        <button className="w-full flex justify-start items-center gap-24 border border-yedu-dark-gray py-2 px-8 rounded-md hover:bg-yedu-dull text-sm">
                            <img src={microsoft} alt="" />
                            Continue with Microsoft
                        </button>
                        <button className="w-full flex justify-start items-center gap-24 border border-yedu-dark-gray py-2 px-8 rounded-md hover:bg-yedu-dull text-sm">
                            <img src={apple} alt="" /> Continue with Apple
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
};

export default SignUp;
