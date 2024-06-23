import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getSocket } from '../../socket';

const ProfileSection = ({ display }) => {
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'light'
    );
    const [themeButton, setThemeButton] = useState(
        localStorage.getItem('theme') === 'light'
            ? 'fa-toggle-off'
            : 'fa-toggle-on'
    );
    const [userEmail, setUserEmail] = useState('');
    const [userMobile, setUserMobile] = useState('');
    const socket = getSocket();

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
                <span className="py-4 border-b border-b-yedu-dark-gray  transition-all cursor-pointer flex items-center justify-between">
                    Change theme preference
                    <button onClick={toggleTheme}>
                        <i
                            className={`text-4xl text-yedu-green transition-all fas ${themeButton}`}
                        ></i>
                    </button>
                </span>
                <span className="py-4 border-b border-b-yedu-dark-gray  transition-all cursor-pointer flex items-center justify-start gap-6">
                    Email:
                    <p>{userEmail}</p>
                </span>
                <span className="py-4 border-b border-b-yedu-dark-gray  transition-all cursor-pointer flex items-center justify-start gap-6">
                    Phone Number:
                    <p>{userMobile}</p>
                </span>
            </div>
        </>
    );
};

export default ProfileSection;
