import React, { useState } from 'react';

const ChangePassword = ({ display }) => {
    const [password, setPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const handleSubmit = (event) => {
        event.preventDefault();
        alert(`Password: ${password}\nConfirm Password: ${confirmPassword}`);
    };
    return (
        <div className={`w-full form-entry ${display ? 'block' : 'hidden'}`}>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col justify-center items-center gap-4 p-4">
                    <h1 className="font-medium text-3xl text-center">
                        Change Your Password
                    </h1>
                    <div className="relative w-full">
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
                    <div className="relative w-full">
                        <input
                            type={`${showConfirmPassword ? 'text' : 'password'}`}
                            className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
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
                        type="submit"
                        className="bg-yedu-green h-10 py-2 px-4 rounded-md border-none outline-none text-yedu-white w-full hover:opacity-80"
                    >
                        Submit
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePassword;
