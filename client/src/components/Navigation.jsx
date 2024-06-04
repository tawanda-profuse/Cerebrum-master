import newtab from '../assets/new-tab.svg';
import leftpanel from '../assets/panel-left.svg';
import logo from '../assets/logo.svg';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import CreateProject from './CreateProject';
import ProjectLink from './ProjectLink';

const Navigation = ({ sideMenu, setSideMenu, currentProject }) => {
    const [userAccount, setUserAccount] = useState(false);
    const navigate = useNavigate();
    const jwt = localStorage.getItem('jwt');
    const [projects, setProjects] = useState([]);
    const url = 'http://localhost:8000/api/user/projects';
    const [projectName, setProjectName] = useState('');

    const [openCreateProject, setOpenCreateProject] = useState(false);

    useEffect(() => {
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

        // Clean up the interval on component unmount
        return () => clearInterval(intervalId);
    }, [currentProject, jwt, projects]);

    const handleLogOut = () => {
        if (jwt) {
            localStorage.clear();
            navigate('/');
            toast.success('Successfully logged out.', {
                autoClose: 4000,
            });
        } else {
            navigate('/user/login');
            toast.warn('You are not logged in!', {
                autoClose: 4000,
            });
        }
    };

    return (
        <>
            <CreateProject
                display={openCreateProject}
                setDisplay={setOpenCreateProject}
            />
            <div className="sm: w-[95%] md:w-1/5 flex gap-4 absolute top-2 left-2">
                <button
                    className="z-20"
                    onClick={() => {
                        setSideMenu(!sideMenu);
                        setUserAccount(false);
                    }}
                >
                    <img src={leftpanel} alt="" />
                </button>
                <button
                    className={`z-20 transition-all ${sideMenu ? 'absolute right-4' : ''}`}
                    onClick={() => {
                        setOpenCreateProject(true);
                        setSideMenu(false);
                        setUserAccount(false);
                    }}
                >
                    <img src={newtab} alt="" />
                </button>
            </div>
            <div
                className={`sm: w-full md:w-1/5 absolute z-10 shadow-xl shadow-yedu-dark-gray bg-yedu-light-gray h-screen scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-auto transition-all ${sideMenu ? 'top-0 left-0' : 'top-0 -left-full'}`}
            >
                <span
                    className="flex items-center justify-start gap-8 mt-16 pl-4"
                    onClick={() => setSideMenu(!sideMenu)}
                >
                    <img src={logo} alt="" className="w-10" />
                    <Link to="/chat" className="text-sm text-md font-semibold">
                        {projectName ? projectName.name : "Select a Project"}
                    </Link>
                </span>
                <p className="py-3 font-medium pl-4 my-4">Recents</p>
                {projects.length > 0 ? (
                    projects.map((project) => (
                        <ProjectLink
                            projectName={project}
                            sideMenu={sideMenu}
                            setSideMenu={setSideMenu}
                            key={project.id}
                        />
                    ))
                ) : (
                    <p className="text-center">No projects</p>
                )}
            </div>
            <button
                className="absolute top-2 right-4 bg-yedu-dark border-2 border-yedu-green w-10 h-10 rounded-full z-50"
                onClick={() => {
                    setUserAccount(!userAccount);
                    setSideMenu(false);
                }}
            ></button>
            <div
                className={`absolute w-64 rounded-lg bg-yedu-white p-4 shadow-sm shadow-yedu-dark-gray transition-all z-50 ${userAccount ? 'top-14 right-4' : '-top-full -right-4'}`}
            >
                <Link
                    to="/user/settings"
                    className="py-4 text-yedu-gray-text flex gap-6 items-center"
                    onClick={() => setUserAccount(false)}
                >
                    <i className="fas fa-gear"></i> Settings
                </Link>
                <hr />
                <button
                    className="py-4 text-yedu-gray-text flex gap-6 items-center"
                    onClick={() => {
                        setUserAccount(false);
                        handleLogOut();
                    }}
                >
                    <i className="fas fa-right-from-bracket"></i> Log Out
                </button>
            </div>
        </>
    );
};

export default Navigation;
