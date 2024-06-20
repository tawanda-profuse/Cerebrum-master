import { useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ChangePassword = ({display}) => {
    const [password, setPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const jwt = localStorage.getItem('jwt');
    const passwordRef = useRef(null);
    const password2Ref = useRef(null);

    const handleSubmit = (event) => {
        event.preventDefault();
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
            .post(
                'http://localhost:8000/users/user-reset-password',
                { password: password, password2: confirmPassword },
                { headers: { Authorization: `Bearer ${jwt}` } }
            )
            .then((response) => {
                setIsPending(false);
                passwordRef.current.value = "";
                password2Ref.current.value = "";
                setPassword("");
                setConfirmPassword("");
                toast.success(response.data, {
                    autoClose: 8000,
                });
            })
            .catch((error) => {
                setIsPending(false);
                passwordRef.current.value = "";
                password2Ref.current.value = "";
                setPassword("");
                setConfirmPassword("");
                console.error(error);
                toast.warn(error.response.data, {
                    autoClose: 8000,
                });
            });
    };
    return (
        <div className={`w-full md:w-[80%] form-entry ${display ? "block": "hidden"}`}>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col justify-center items-center gap-4 p-4">
                    <h1 className="font-medium text-3xl text-center my-4">
                        Change Your Password
                    </h1>
                    <div className="relative w-full my-2">
                        <input
                            type={`${showPassword ? 'text' : 'password'}`}
                            className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Enter your password"
                            onChange={(e) => setPassword(e.target.value)}
                            ref={passwordRef}
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
                    <div className="relative w-full my-2">
                        <input
                            type={`${showConfirmPassword ? 'text' : 'password'}`}
                            className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Enter your password again"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            ref={password2Ref}
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
                        disabled={isPending}
                    >
                        {isPending ? (
                            <i className="fas fa-spinner animate-spin"></i>
                        ) : (
                            'Submit'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePassword;
