import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
const env = process.env.NODE_ENV || 'development';
const baseURL = env === 'production' ? process.env.REACT_APP_PROD_API_URL : process.env.REACT_APP_DEV_API_URL;

const ResetPassword = ({ display, setDisplay, hiddenToken }) => {
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
            toast.error('Your passwords do not match.', {
                autoClose: 5000,
            });
            return;
        }

        axios
            .post(`${baseURL}/users/reset-password`, {
                token: hiddenToken,
                password: password,
                password2: confirmPassword,
            })
            .then((response) => {
                setIsPending(false);
                setDisplay(false);
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
        <>
            <div
                className={`modal-backdrop ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog className="modal-styles" open={display}>
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
        </>
    );
};

export default ResetPassword;
