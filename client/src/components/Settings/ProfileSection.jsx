import { useEffect, useState } from 'react';
import ShowProjects from './ShowProjects';
import ChangePassword from './ChangePassword';
import { toast } from 'react-toastify';
import axios from 'axios';

const ProfileSection = ({
    display,
    setDisplay,
    openProjects,
    setOpenProjects,
    openChangePassword,
    setOpenChangePassword,
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
                <div className="flex flex-wrap my-4 gap-2 items-center justify-center w-3/4 m-auto">
                    <button
                        className="flex-auto md:flex-1 bg-yedu-green min-h-10 p-4 rounded-md w-full border-none outline-none text-yedu-white my-8 text-lg m-auto block hover:opacity-80"
                        onClick={() => {
                            setOpenProjects(true);
                            setOpenChangePassword(false);
                            setDisplay(false);
                        }}
                    >
                        Show Projects
                    </button>
                    <button
                        className="flex-auto md:flex-1 bg-yedu-green min-h-10 p-4 rounded-md w-full border-none outline-none text-yedu-white my-8 text-lg m-auto block hover:opacity-80"
                        onClick={() => {
                            setOpenChangePassword(true);
                            setOpenProjects(false);
                            setDisplay(false);
                        }}
                    >
                        Change Password
                    </button>
                </div>
            </div>
            <ShowProjects display={openProjects} />
            <ChangePassword display={openChangePassword} />
        </>
    );
};

export default ProfileSection;
