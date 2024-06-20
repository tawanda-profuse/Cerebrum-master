import React, { useEffect, useRef, useState } from 'react';
import Navigation from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmDeleteProject from '../components/Modals/ConfirmDeleteProject';
import ProfileSection from '../components/Settings/ProfileSection';
import CheckoutForm from '../components/Settings/CheckoutForm';
import ChangePassword from '../components/Settings/ChangePassword';
import ShowProjects from '../components/Settings/ShowProjects';

const Settings = () => {
    const navigate = useNavigate();
    const jwt = localStorage.getItem('jwt');
    const currentProject = localStorage.getItem('selectedProjectId');
    const isNavigationCollapsed =
        localStorage.getItem('isNavigationCollapsed') === 'true';
    const [sideMenu, setSideMenu] = useState(isNavigationCollapsed);
    const [profileSection, setProfileSection] = useState(true);
    const [openProjects, setOpenProjects] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(true);
    const [checkoutForm, setCheckoutForm] = useState(false);
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
            <section className="bg-yedu-dull min-h-screen flex gap-4 items-center justify-center dark-applied-body">
                <main
                    className={`w-[70vw] bg-yedu-white rounded-lg py-6 mt-8 px-4 form-entry h-[80vh] overflow-y-scroll scrollbar-thin  scrollbar-thumb-yedu-green scrollbar-track-transparent transition-all dark-applied ${sideMenu ? 'md:translate-x-[12%]' : 'md:translate-x-0'}`}
                >
                    <div className="flex w-full justify-between items-center mb-4">
                        <h1 className="font-semibold text-2xl">Settings</h1>
                        <button
                            className="rounded-full bg-yedu-light-green py-2 px-3 transition-all hover:scale-125"
                            title="Back to home"
                            onClick={handleHomeNavigation}
                        >
                            <i className="fas fa-home"></i>
                        </button>
                    </div>
                    <div className="m-auto flex gap-10 flex-wrap items-start px-4">
                        <div className="md:flex-[0.4] md:flex-col md:my-0 my-4 flex-auto flex justify-center gap-4">
                            <button
                                className={`rounded-md flex items-center gap-4 p-4 text-sm yeduDarkHover hover:bg-yedu-light-gray ${profileSection ? 'bg-yedu-dark-gray yeduDarkGray' : 'bg-inherit'}`}
                                onClick={() => {
                                    setProfileSection(true);
                                    setOpenChangePassword(true);
                                    setCheckoutForm(false);
                                    setOpenProjects(false);
                                }}
                            >
                                <i className="fas fa-gear text-lg"></i>
                                <span className="hidden md:block">General</span>
                            </button>
                            <button
                                className={`rounded-md flex items-center gap-4 p-4 text-sm yeduDarkHover hover:bg-yedu-light-gray ${openProjects ? 'bg-yedu-dark-gray yeduDarkGray' : 'bg-inherit'}`}
                                onClick={() => {
                                    setOpenProjects(true);
                                    setProfileSection(false);
                                    setCheckoutForm(false);
                                    setOpenChangePassword(false);
                                }}
                            >
                                <i className="fas fa-gear text-lg"></i>
                                <span className="hidden md:block">
                                    Projects
                                </span>
                            </button>
                            <button
                                className={`rounded-md flex items-center gap-4 p-4 text-sm yeduDarkHover hover:bg-yedu-light-gray ${checkoutForm ? 'bg-yedu-dark-gray yeduDarkGray' : 'bg-inherit'}`}
                                onClick={() => {
                                    setCheckoutForm(true);
                                    setProfileSection(false);
                                    setOpenProjects(false);
                                    setOpenChangePassword(false);
                                }}
                            >
                                <i className="fas fa-coins text-lg"></i>
                                <span className="hidden md:block">
                                    Buy Tokens
                                </span>
                            </button>
                            <button
                                className="rounded-md flex items-center gap-4 p-4 text-sm yeduDarkHover hover:bg-yedu-light-gray"
                                onClick={() => navigate('/pricing')}
                            >
                                <i className="fas fa-credit-card text-lg"></i>
                                <span className="hidden md:block">Plans</span>
                            </button>
                            <button
                                className="rounded-md flex items-center gap-4 p-4 text-sm yeduDarkHover hover:bg-yedu-light-gray"
                                onClick={handleLogOut}
                            >
                                <i className="fas fa-right-from-bracket text-lg"></i>
                                <span className="hidden md:block">Logout</span>
                            </button>
                        </div>
                        <div className="flex-auto md:flex-1 m-auto flex gap-10 flex-wrap items-center">
                            <ProfileSection display={profileSection} />
                            <ShowProjects display={openProjects} />
                            <ChangePassword display={openChangePassword} />
                            <CheckoutForm display={checkoutForm} />
                        </div>
                    </div>
                </main>
            </section>
        </>
    );
};

export default Settings;
