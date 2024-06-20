import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const ProfileSection = ({
    display
}) => {
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'light'
    );
    const [themeButton, setThemeButton] = useState(
        localStorage.getItem('theme') === 'light'
            ? 'fa-toggle-off'
            : 'fa-toggle-on'
    );
    const jwt = localStorage.getItem('jwt');
    const [userEmail, setUserEmail] = useState('');
    const [userMobile, setUserMobile] = useState('');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);

        let intervalId;

        const fetchUserDetails = async () => {
            try {
                const response = await axios.get(
                    'http://localhost:8000/users/api/details',
                    {
                        headers: { Authorization: `Bearer ${jwt}` },
                    }
                );
                setUserEmail(response.data.email);
                setUserMobile(response.data.mobile);
            } catch (error) {
                console.error(`${error}`);
            }
        };

        fetchUserDetails();

        intervalId = setInterval(fetchUserDetails, 400);

        return () => {
            clearInterval(intervalId);
        };
    }, [jwt, theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        setThemeButton(
            themeButton === 'fa-toggle-on' ? 'fa-toggle-off' : 'fa-toggle-on'
        );
        toast.info(
            `Theme set to ${theme === 'light' ? 'dark' : 'light'} ${theme === 'light' ? '🌙' : '☀️'}`,
            { autoClose: 4000 }
        );
    };

    return (
        <>
            <div
                className={`w-full form-entry ${display ? 'block' : 'hidden'}`}
            >
                <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all cursor-pointer flex items-center justify-between">
                    Change theme preference
                    <button onClick={toggleTheme}>
                        <i
                            className={`text-4xl text-yedu-green transition-all fas ${themeButton}`}
                        ></i>
                    </button>
                </span>
                <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all cursor-pointer flex items-center justify-start gap-6">
                    Email:
                    <p>{userEmail}</p>
                </span>
                <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all cursor-pointer flex items-center justify-start gap-6">
                    Phone Number:
                    <p>{userMobile}</p>
                </span>
            </div>
        </>
    );
};

export default ProfileSection;
