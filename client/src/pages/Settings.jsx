import React, { useEffect, useRef, useState } from 'react';
import Navigation from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmDeleteProject from '../components/Modals/ConfirmDeleteProject';

const Settings = () => {
    const navigate = useNavigate();
    const jwt = localStorage.getItem('jwt');
    const currentProject = localStorage.getItem('selectedProjectId');
    const isNavigationCollapsed =
    localStorage.getItem('isNavigationCollapsed') === 'true';
    const [sideMenu, setSideMenu] = useState(isNavigationCollapsed);
    const [toggle, setToggle] = useState(false);
    const [openConfirmDelete, setConfirmDelete] = useState(false);
    const deleteProjectRef = useRef(null);

    function isTokenExpired(token) {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64); // Decodes a string of Base64-encoded data into bytes
        const decoded = JSON.parse(decodedJson);
        const exp = decoded.exp;
        const now = Date.now().valueOf() / 1000;
        return now > exp;
    }

    useEffect(() => {
        document.title = 'Yedu User Settings';

        const isLoggedIn = () => {
            const token = jwt;
            return token != null && !isTokenExpired(token);
        };

        if (!isLoggedIn()) {
            localStorage.clear();
            navigate('/chat');
            toast.warn('You are not logged in', {
                autoClose: 3000,
            });
        }
    }, [jwt, navigate]);

    const handleHomeNavigation = () => {
        if (currentProject) {
            navigate(`/chat/${currentProject}`);
        } else {
            navigate('/chat');
        }
    };

    const handleLogOut = () => {
        if (jwt) {
            localStorage.clear();
            navigate('/');
            toast.success('Successfully logged out.', {
                autoClose: 4000,
            });
        }
    };

    return (
        <>
            <ConfirmDeleteProject
                display={openConfirmDelete}
                setDisplay={setConfirmDelete}
                deleteProjectRef={deleteProjectRef}
            />
                <Navigation
                    sideMenu={isNavigationCollapsed}
                    setSideMenu={setSideMenu}
                    currentProject={currentProject}
                    confirmDeleteDisplay={openConfirmDelete}
                    setConfirmDeleteDisplay={setConfirmDelete}
                    deleteProjectRef={deleteProjectRef}
                />
            <section className="bg-yedu-dull h-screen flex gap-4 items-center justify-center">
                <main className="w-4/5 bg-yedu-white rounded-lg py-6 px-4 form-entry">
                    <div className="flex w-full justify-between items-center">
                        <h1 className="font-semibold text-2xl">
                            Settings
                        </h1>
                        <button
                            className="rounded-full bg-yedu-light-green py-2 px-3 text-xl transition-all hover:scale-125"
                            title="Back to home"
                            onClick={handleHomeNavigation}
                        >
                            <i className="fas fa-home"></i>
                        </button>
                    </div>
                    <div className="m-auto flex gap-10 flex-wrap items-center">
                        <div className="sm:flex-auto md:flex-1 flex flex-col gap-4">
                            <button className="rounded-md flex items-center gap-4 p-4 text-sm  bg-yedu-dark-gray hover:bg-yedu-light-gray">
                                <i className="fas fa-gear text-lg"></i> General
                            </button>
                            <button className="rounded-md flex items-center gap-4 p-4 text-sm hover:bg-yedu-light-gray">
                                <i className="fas fa-coins text-lg"></i>{' '}
                                Buy Tokens
                            </button>
                            <button
                                className="rounded-md flex items-center gap-4 p-4 text-sm hover:bg-yedu-light-gray"
                                onClick={() => navigate('/pricing')}
                            >
                                <i className="fas fa-credit-card text-lg"></i>{' '}
                                Plans
                            </button>
                            <button
                                className="rounded-md flex items-center gap-4 p-4 text-sm hover:bg-yedu-light-gray"
                                onClick={handleLogOut}
                            >
                                <i className="fas fa-right-from-bracket text-lg"></i>{' '}
                                Logout
                            </button>
                        </div>
                        <div className="flex-auto flex flex-col gap-4 text-sm">
                            <span
                                className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all hover:pl-2 cursor-pointer flex items-center justify-between"
                                onClick={() => setToggle(!toggle)}
                            >
                                Always show code when using data analyst{' '}
                                <i
                                    className={`text-6xl text-yedu-green transition-all fas ${toggle ? 'fa-toggle-on' : 'fa-toggle-off'}`}
                                ></i>
                            </span>
                            <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all hover:pl-2 cursor-pointer">
                                Language
                            </span>
                            <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all hover:pl-2 cursor-pointer">
                                Archived chats
                            </span>
                            <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all hover:pl-2 cursor-pointer">
                                Archive all chats
                            </span>
                            <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all hover:pl-2 cursor-pointer">
                                Delete all chats
                            </span>
                        </div>
                    </div>
                </main>
            </section>
        </>
    );
};

export default Settings;
