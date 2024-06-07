import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ResetPassword = ({ display, setDisplay, hiddenToken }) => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handlePasswordReset = () => {
        setIsPending(true);

        if (!password || !confirmPassword) {
            setIsPending(false);
            toast.info('Both password fields are required.', {
                autoClose: 5000,
            });
            return;
        }

        if (password !== confirmPassword) {
            setIsPending(false);
            toast.info('Your passwords do not match.', {
                autoClose: 5000,
            });
            return;
        }

        axios
            .post('http://localhost:8000/reset-password', {
                token: hiddenToken,
                password: password,
                password2: confirmPassword,
            })
            .then((response) => {
                setIsPending(false);
                setDisplay(false);
                navigate('/user/login');
                toast.success(response.data, {
                    autoClose: 8000,
                });
            })
            .catch((error) => {
                setIsPending(false);
                console.error(error);
                toast.warn(error.response.data, {
                    autoClose: 8000,
                });
            });
    };

    return (
        <dialog
            className={`w-[80vw] md:w-[50vw] absolute top-[50%] left-[50%] -translate-x-2/4 -translate-y-2/4 z-40 shadow-xl shadow-yedu-dark-gray py-4 px-8 rounded-lg transition-all ${display ? 'block' : 'hidden'}`}
        >
            <h1 className="text-3xl text-center my-12">
                Reset Your Password Below
            </h1>
            <div className="relative w-full my-8">
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
            <div className="relative w-full my-8">
                <i className="fas fa-asterisk self-start text-xs text-yedu-danger absolute right-20 top-2/4 -translate-y-2/4"></i>
                <input
                    type={`${showConfirmPassword ? 'text' : 'password'}`}
                    className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                    placeholder="Enter your password again"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                    type="button"
                    className="absolute right-0 border rounded-md h-full w-14 hover:bg-yedu-light-green"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                    <i
                        className={`fas ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                    ></i>
                </button>
            </div>
            <button
                className="bg-yedu-green h-10 py-2 px-4 text-white rounded-md border-none outline-none text-yedu-white w-full hover:opacity-80"
                onClick={handlePasswordReset}
                disabled={isPending}
            >
                {isPending ? (
                    <i className="fas fa-spinner animate-spin"></i>
                ) : (
                    'Continue'
                )}
            </button>
        </dialog>
    );
};

export default ResetPassword;
