import newtab from '../assets/new-tab.svg';
import leftpanel from '../assets/panel-left.svg';
import tokenIcon from '../assets/generating-tokens.svg';
import logo from '../assets/logo.svg';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
    const [projectName, setProjectName] = useState('');
    const [openCreateProject, setOpenCreateProject] = useState(false);
    const navRef = useRef(null);
    const newTabRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setSideMenu(false);
            }
            if (newTabRef.current.contains(event.target)) {
                setOpenCreateProject(true);
            }
            if (deleteProjectRef.current.contains(event.target)) {
                setSideMenu(true);
            }
        };

        if (sideMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        let intervalId;
        const fetchProjects = async () => {
            try {
                const response = await axios.get(url, {
                    headers: { Authorization: `Bearer ${jwt}` },
                });

                setProjects(response.data);
            } catch (error) {
                console.error('Error fetching projects:', error);
                return []; // Return an empty array in case of an error
            }
        };

        setProjectName(
            projects.find((project) => project.id === currentProject)
        );

        fetchProjects();

        // Set up polling to fetch data every 5 seconds (5000 milliseconds)
        intervalId = setInterval(fetchProjects, 400);

        // Cleanup event listener on component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
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
                    'sm:w-[95%] md:w-1/5 flex gap-4 absolute top-2 left-2'
                }
            >
                <button
                    className={`z-20 ${sideMenu ? 'hidden' : 'block'}`}
                    onClick={() => {
                        setSideMenu(true);
                    }}
                >
                    <img src={leftpanel} alt="" className="w-7" />
                </button>
                <button
                    className={`z-20 ${sideMenu ? 'block' : 'hidden'}`}
                    onClick={() => {
                        setSideMenu(false);
                    }}
                >
                    <i className="fas fa-times text-yedu-gray-text text-2xl"></i>
                </button>
                <button
                    className={`z-20 transition-all ${sideMenu ? 'absolute -right-[12rem] md:right-4' : ''}`}
                    onClick={() => {
                        setOpenCreateProject(true);
                    }}
                    ref={newTabRef}
                >
                    <img src={newtab} alt="" className="w-6" />
                </button>
                <button
                    className={`z-20 transition-all ${sideMenu ? 'absolute -right-[28rem] md:-right-[12rem]' : ''}`}
                >
                    <p className="flex gap-2 items-center text-yedu-gray-text font-medium">
                        Remaining{' '}
                        <img
                            src={tokenIcon}
                            alt=""
                            className="hover:animate-pulse"
                        />{' '}
                        <span>250</span>
                    </p>
                </button>
            </div>
            <div
                className={`w-4/5 md:w-1/5 absolute z-10 shadow-md bg-[#f0f0f0] h-screen scrollbar-thin scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-auto transition-all ${sideMenu ? 'top-0 left-0' : 'top-0 -left-full'}`}
                ref={navRef}
            >
                <span
                    className="flex items-center justify-start gap-8 mt-16 pl-4"
                    onClick={() => setSideMenu(!sideMenu)}
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
