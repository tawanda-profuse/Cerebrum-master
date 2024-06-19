import newtab from '../assets/new-tab.svg';
import leftpanel from '../assets/panel-left.svg';
import tokenIcon from '../assets/generating-tokens.svg';
import logo from '../assets/logo.svg';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateProject from './Modals/CreateProject';
import ProjectLink from './ProjectLink';

const Navigation = ({
    sideMenu,
    setSideMenu,
    currentProject,
    confirmDeleteDisplay,
    setConfirmDeleteDisplay,
    deleteProjectRef,
}) => {
    const navigate = useNavigate();
    const jwt = localStorage.getItem('jwt');
    const [projects, setProjects] = useState([]);
    const url = 'http://localhost:8000/projects';
    const url2 = 'http://localhost:8000/api/messages';
    const [projectName, setProjectName] = useState('');
    const [openCreateProject, setOpenCreateProject] = useState(false);
    const navRef = useRef(null);
    const newTabRef = useRef(null);
    const [subscriptionAmount, setSubscriptionAmount] = useState('');

    useEffect(() => {
        let intervalId;
        const fetchUserData = async () => {
            try {
                const response = await axios.get(url, {
                    headers: { Authorization: `Bearer ${jwt}` },
                });

                const data = await axios.get(url2, {
                    headers: { Authorization: `Bearer ${jwt}` },
                });

                setProjects(response.data);
                setSubscriptionAmount(data.data.subscriptionAmount);
            } catch (error) {
                console.error('Error fetching projects:', error);
                return []; // Return an empty array in case of an error
            }
        };

        setProjectName(
            projects.find((project) => project.id === currentProject)
        );

        fetchUserData();

        // Set up polling to fetch data every 5 seconds (5000 milliseconds)
        intervalId = setInterval(fetchUserData, 400);

        // Cleanup event listener on component unmount
        return () => {
            clearInterval(intervalId);
        };
    }, [
        currentProject,
        jwt,
        projects,
        sideMenu,
        setSideMenu,
        deleteProjectRef,
    ]);

    const handleHomeNavigation = () => {
        if (currentProject) {
            navigate(`/chat/${currentProject}`);
        } else {
            navigate('/chat');
        }
    };

    return (
        <>
            <CreateProject
                display={openCreateProject}
                setDisplay={setOpenCreateProject}
            />
            <div
                className={
                    'sm:w-[95%] md:w-1/5 z-30 flex gap-4 absolute top-2 left-2'
                }
            >
                <button
                    className={`z-20 ${sideMenu ? 'hidden' : 'block'}`}
                    onClick={() => {
                        localStorage.setItem('isNavigationCollapsed', true);
                        setSideMenu(true);
                    }}
                >
                    <img src={leftpanel} alt="" className="w-7" />
                </button>
                <button
                    className={`z-20 ${sideMenu ? 'block' : 'hidden'}`}
                    onClick={() => {
                        localStorage.setItem('isNavigationCollapsed', false);
                        setSideMenu(false);
                    }}
                >
                    <i className="fas fa-times text-yedu-gray-text text-2xl"></i>
                </button>
                <button
                    className={`z-20 transition-all ${sideMenu ? 'absolute -right-[14rem] md:right-4' : ''}`}
                    onClick={() => {
                        setOpenCreateProject(true);
                    }}
                    ref={newTabRef}
                >
                    <img src={newtab} alt="" className="w-6" />
                </button>
                <button
                    className={`z-20 transition-all ${sideMenu ? 'hidden' : 'block'}`}
                >
                    <p className="flex gap-2 items-center text-yedu-gray-text font-medium">
                        Remaining
                        <img
                            src={tokenIcon}
                            alt=""
                            className="hover:animate-pulse"
                        />{' '}
                        <span>
                            $
                            {new Intl.NumberFormat('en-US').format(
                                subscriptionAmount
                            )}
                        </span>
                    </p>
                </button>
            </div>
            <div
                className={`w-4/5 md:w-1/5 absolute z-10 shadow-md bg-[#f0f0f0] dark-applied h-screen scrollbar-thin scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-auto transition-all ${sideMenu ? 'top-0 left-0' : 'top-0 -left-full'}`}
                ref={navRef}
            >
                <span
                    className="flex items-center justify-start gap-8 mt-16 pl-4"
                    onClick={() => {
                        localStorage.setItem(
                            'isNavigationCollapsed',
                            true ? false : true
                        );
                        setSideMenu(!sideMenu);
                    }}
                >
                    <img src={logo} alt="" className="w-10" />
                    <button
                        className="text-sm text-md font-semibold"
                        onClick={handleHomeNavigation}
                    >
                        {projectName ? projectName.name : 'Select a Project'}
                    </button>
                </span>
                <p className="py-3 font-medium pl-4 my-4">Recents</p>
                {projects.length > 0 ? (
                    projects.map((project) => (
                        <ProjectLink
                            projectName={project}
                            sideMenu={sideMenu}
                            key={project.id}
                            deleteButtonActive={confirmDeleteDisplay}
                            setDeleteButtonActive={setConfirmDeleteDisplay}
                        />
                    ))
                ) : (
                    <p className="text-center">No projects</p>
                )}
            </div>
            <button
                className="absolute top-2 right-4 border-2 border-yedu-green w-9 h-9 rounded-full z-50 hover:bg-yedu-light-gray"
                onClick={() => {
                    navigate('/user/settings');
                }}
            >
                <i className="fas fa-user-gear"></i>
            </button>
        </>
    );
};

export default Navigation;
