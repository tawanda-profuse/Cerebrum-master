import React, { useEffect, useRef, useState } from 'react';
import Navigation from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmDeleteProject from '../components/Modals/ConfirmDeleteProject';
import ProfileSection from '../components/Settings/ProfileSection';
import ShowProjects from '../components/Settings/ShowProjects';
import Pricing from '../components/Settings/Pricing';
import ProductionModal from '../components/Settings/ProductionModal';

const Settings = () => {
    const navigate = useNavigate();
    const jwt = localStorage.getItem('jwt');
    const currentProject = localStorage.getItem('selectedProjectId');
    const isNavigationCollapsed =
        localStorage.getItem('isNavigationCollapsed') === 'true';
    const [sideMenu, setSideMenu] = useState(isNavigationCollapsed);
    const [profileSection, setProfileSection] = useState(false);
    const [openProjects, setOpenProjects] = useState(false);
    const [openPricing, setOpenPricing] = useState(true);
    const [openProduction, setOpenProduction] = useState(false);
    const [openConfirmDelete, setConfirmDelete] = useState(false);
    const deleteProjectRef = useRef(null);

    function isTokenExpired(token) {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64);
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
            navigate('/');
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
            <section className="bg-yedu-dull min-h-screen flex gap-4 justify-center dark-applied-body">
                <main
                    className={`bg-yedu-white rounded-lg py-6 mt-[6rem] px-4 form-entry h-[80vh] overflow-y-scroll scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-transparent transition-all dark-applied ${sideMenu ? 'md:translate-x-[12%]' : 'md:translate-x-0'}`}
                >
                    <div className="flex w-full justify-between items-center mb-4">
                        <h1 className="font-semibold text-2xl">Settings</h1>
                        <button
                            className="rounded-full bg-green-100 dark:bg-green-500 py-2 px-3 transition-all hover:scale-125"
                            title="Back to home"
                            onClick={handleHomeNavigation}
                        >
                            <i className="fas fa-home"></i>
                        </button>
                    </div>
                    <div className="m-auto flex gap-10 flex-col md:flex-row items-start px-4">
                        <div className="flex-auto md:flex-[0.4] md:flex-col md:my-0 my-4 flex justify-center gap-4 m-auto">
                            <button
                                className={`rounded-md flex items-center gap-4 p-4 text-sm text-yedu-dark dark:text-yedu-white dark:hover:bg-green-100 dark:hover:text-yedu-dark hover:bg-green-500 ${openPricing ? 'bg-green-100 dark:bg-green-500' : 'bg-inherit'}`}
                                onClick={() => {
                                    setOpenPricing(true);
                                    setProfileSection(false);
                                    setOpenProjects(false);
                                }}
                            >
                                <i className="fas fa-credit-card text-lg"></i>
                                <span className="hidden md:block">Plans</span>
                            </button>
                            <button
                                className={`rounded-md flex items-center gap-4 p-4 text-sm text-yedu-dark dark:text-yedu-white dark:hover:bg-green-100 dark:hover:text-yedu-dark hover:bg-green-500 ${openProjects ? 'bg-green-100 dark:bg-green-500' : 'bg-inherit'}`}
                                onClick={() => {
                                    setOpenProjects(true);
                                    setProfileSection(false);
                                    setOpenPricing(false);
                                }}
                            >
                                <i className="fas fa-list text-lg"></i>
                                <span className="hidden md:block">
                                    Projects
                                </span>
                            </button>
                            <button
                                className={`rounded-md flex items-center gap-4 p-4 text-sm text-yedu-dark dark:text-yedu-white dark:hover:bg-green-100 dark:hover:text-yedu-dark hover:bg-green-500 ${profileSection ? 'bg-green-100 dark:bg-green-500' : 'bg-inherit'}`}
                                onClick={() => {
                                    setProfileSection(true);
                                    setOpenProjects(false);
                                    setOpenPricing(false);
                                }}
                            >
                                <i className="fas fa-gear text-lg"></i>
                                <span className="hidden md:block">General</span>
                            </button>
                            <button
                                className="rounded-md flex items-center gap-4 p-4 text-sm dark:hover:bg-yedu-dark-gray dark:hover:text-yedu-dark hover:bg-green-100"
                                onClick={handleLogOut}
                            >
                                <i className="fas fa-right-from-bracket text-lg"></i>
                                <span className="hidden md:block">Logout</span>
                            </button>
                        </div>
                        <div className="flex-auto md:flex-1 m-auto flex flex-wrap items-center">
                            <ProfileSection display={profileSection} />
                            <ShowProjects display={openProjects} setOpenProduction={setOpenProduction}/>
                            <Pricing display={openPricing} setOpenProjects={setOpenProjects} setOpenPricing={setOpenPricing}  />
                            <ProductionModal display={openProduction} setDisplay={setOpenProduction} />
                        </div>
                    </div>
                </main>
            </section>
        </>
    );
};

export default Settings;
