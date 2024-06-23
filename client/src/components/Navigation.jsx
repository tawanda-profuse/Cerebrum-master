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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        socket.emit('get-user-details');

        socket.on('user-data', (data) => {
            setIsLoading(false);
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
            <div className="flex justify-between items-center w-full px-4 h-12 bg-[#f0f0f0] dark-applied">
                <div className={'z-30 flex gap-4'}>
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
                            localStorage.setItem(
                                'isNavigationCollapsed',
                                false
                            );
                            setSideMenu(false);
                        }}
                    >
                        <i className="fas fa-times text-yedu-gray-text text-2xl"></i>
                    </button>
                    <button
                        className="z-20 transition-all"
                        onClick={() => {
                            setOpenCreateProject(true);
                        }}
                        ref={newTabRef}
                    >
                        <i className="fas fa-folder-plus text-yedu-gray-text text-2xl"></i>
                    </button>
                    {isLoading && (
                        <button className="bg-yedu-dark-gray animate-pulse text-transparent my-4 z-20 w-[10rem] m-auto rounded-md">
                            Yedu AI
                        </button>
                    )}
                    {subscriptionAmount && (
                        <button className={`z-20 transition-all`}>
                            <p className="flex gap-2 items-center text-yedu-gray-text font-medium">
                                Remaining
                                <img
                                    src={tokenIcon}
                                    alt=""
                                    className="w-8 hover:animate-pulse"
                                />{' '}
                                <span>
                                    ${' '}
                                    {new Intl.NumberFormat('en-US').format(
                                        subscriptionAmount
                                    )}
                                </span>
                            </p>
                        </button>
                    )}
                </div>
                <div
                    className={`absolute top-12 z-50 w-4/5 md:w-1/5 shadow-md shadow-yedu-dark-gray bg-[#f0f0f0] dark-applied min-h-screen scrollbar-thin scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-auto transition-all ${sideMenu ? 'left-0' : '-left-full'}`}
                    ref={navRef}
                >
                    <span
                        className="flex items-center justify-start gap-8 mt-2 pl-4"
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
                            {projectName
                                ? projectName.name
                                : 'Select a Project'}
                        </button>
                    </span>
                    <p className="py-3 font-medium pl-4 my-4">Recents</p>
                    {/* Loading animation */}
                    {isLoading && (
                        <>
                            {new Array(3).fill(
                                <p className="bg-yedu-dark-gray animate-pulse text-transparent my-8 w-[90%] m-auto rounded-md">
                                    YeduAI
                                </p>
                            )}
                        </>
                    )}
                    {projects &&
                        projects.map((project) => (
                            <ProjectLink
                                projectName={project}
                                sideMenu={sideMenu}
                                key={project.id}
                                deleteButtonActive={confirmDeleteDisplay}
                                setDeleteButtonActive={setConfirmDeleteDisplay}
                            />
                        ))}
                </div>
                <button
                    className="border-2 border-yedu-green w-9 h-9 rounded-full"
                    onClick={() => {
                        navigate('/user/settings');
                    }}
                >
                    <i className="fas fa-user-gear"></i>
                </button>
            </div>
        </>
    );
};

export default Navigation;
