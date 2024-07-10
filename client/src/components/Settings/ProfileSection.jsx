import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { getSocket } from '../../socket';
import axios from 'axios';

const baseURL = process.env.VITE_NODE_ENV === 'production' 
  ? process.env.VITE_PROD_API_URL 
  : process.env.VITE_DEV_API_URL;

const ProfileSection = ({ display }) => {
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'light'
    );
    const [userEmail, setUserEmail] = useState('');
    const [userMobile, setUserMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const socket = getSocket();
    const jwt = localStorage.getItem('jwt');
    const passwordRef = useRef(null);
    const password2Ref = useRef(null);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);

        socket.emit('user-profile');

        socket.on('profile-details', (data) => {
            setUserEmail(data.email);
            setUserMobile(data.mobile);
        });

        return () => {
            socket.off('profile-details');
        };
    }, [socket, theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        toast.info(
            `Theme set to ${newTheme} ${newTheme === 'light' ? '☀️' : '🌙'}`,
            { autoClose: 4000 }
        );
    };

    const handlePasswordChange = (event) => {
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
            toast.error('Your passwords do not match.', { autoClose: 5000 });
            return;
        }

        axios
            .post(
                `${baseURL}/users/user-reset-password`,
                { password: password, password2: confirmPassword },
                { headers: { Authorization: `Bearer ${jwt}` } }
            )
            .then((response) => {
                setIsPending(false);
                passwordRef.current.value = '';
                password2Ref.current.value = '';
                setPassword('');
                setConfirmPassword('');
                toast.success(response.data, { autoClose: 8000 });
            })
            .catch((error) => {
                setIsPending(false);
                passwordRef.current.value = '';
                password2Ref.current.value = '';
                setPassword('');
                setConfirmPassword('');
                console.error(error);
                toast.warn(error.response.data, { autoClose: 8000 });
            });
    };

    return (
        <div className={`w-full form-entry ${display ? 'block' : 'hidden'}`}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-lg">Change theme preference</span>
                    <button
                        onClick={toggleTheme}
                        className="relative inline-flex items-center h-6 rounded-full w-11 bg-gray-400 dark:bg-gray-200 transition-colors focus:outline-none"
                    >
                        <span
                            className={`${theme === 'dark' ? 'translate-x-6 bg-green-500' : 'translate-x-1 bg-white'} inline-block w-4 h-4 transform rounded-full transition-transform`}
                        />
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-white">
                            Email:
                        </span>
                        <span className="font-medium">{userEmail}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-white">
                            Phone Number:
                        </span>
                        <span className="font-medium">
                            {userMobile || 'Not provided'}
                        </span>
                    </div>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Enter new password"
                            onChange={(e) => setPassword(e.target.value)}
                            ref={passwordRef}
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-2 text-gray-500 dark:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <i
                                className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                            ></i>
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Confirm password"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            ref={password2Ref}
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-2 text-gray-500 dark:text-white"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                        >
                            <i
                                className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                            ></i>
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <i className="fas fa-spinner animate-spin"></i>
                        ) : (
                            'Change Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSection;
