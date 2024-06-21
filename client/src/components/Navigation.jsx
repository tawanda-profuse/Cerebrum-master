import tokenIcon from '../assets/generating-tokens.svg';
import logo from '../assets/logo.svg';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateProject from './Modals/CreateProject';
import ProjectLink from './ProjectLink';
import { getSocket } from '../socket';

const Navigation = ({
    sideMenu,
    setSideMenu,
    currentProject,
    confirmDeleteDisplay,
    setConfirmDeleteDisplay,
}) => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [openCreateProject, setOpenCreateProject] = useState(false);
    const navRef = useRef(null);
    const newTabRef = useRef(null);
    const [subscriptionAmount, setSubscriptionAmount] = useState('');
    const socket = getSocket();

    useEffect(() => {
        socket.emit('get-user-details');

        socket.on('user-data', (data) => {
            setProjects(data.projects);
            setSubscriptionAmount(data.subscriptionAmount);
        });

        if (projects.length > 0) {
            setProjectName(
                projects.find((project) => project.id === currentProject)
            );
        }

        return () => {
            socket.off('user-data');
        };
    }, [currentProject, projects, socket]);

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
                    <i className="fas fa-bars-staggered text-yedu-gray-text text-2xl"></i>
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
                    <i className="fas fa-folder-plus text-yedu-gray-text text-2xl"></i>
                </button>
                <button
                    className={`z-20 transition-all ${sideMenu ? 'hidden' : 'block'}`}
                >
                    <p className="flex gap-2 items-center text-yedu-gray-text font-medium">
                        Remaining
                        <img
                            src={tokenIcon}
                            alt=""
                            className="w-8 hover:animate-pulse"
                        />{' '}
                        <span>
                            $
                            {subscriptionAmount &&
                                new Intl.NumberFormat('en-US').format(
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
                    <button className="text-sm text-md font-semibold">
                        {projectName ? projectName.name : 'Select a Project'}
                    </button>
                </span>
                <p className="py-3 font-medium pl-4 my-4">Recents</p>
                {projects && projects.length > 0 ? (
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
