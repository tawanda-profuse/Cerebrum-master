import tokenIcon from '../assets/generating-tokens.svg';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreActions, useStoreState } from 'easy-peasy';
import CreateProject from './Modals/CreateProject';
import ProjectLink from './ProjectLink';
import { getSocket } from '../socket';
import { toast } from 'react-toastify';

const Navigation = ({
    sideMenu,
    setSideMenu,
    confirmDeleteDisplay,
    setConfirmDeleteDisplay,
}) => {
    const navigate = useNavigate();
    const setProjects = useStoreActions((actions) => actions.setProjects);
    const projects = useStoreState((state) => state.projects);
    const selectedProjectId = useStoreState((state) => state.selectedProjectId);
    const [projectName, setProjectName] = useState('');
    const [openCreateProject, setOpenCreateProject] = useState(false);
    const navRef = useRef(null);
    const newTabRef = useRef(null);
    const [subscriptionAmount, setSubscriptionAmount] = useState('');
    const socket = getSocket();
    const [isLoading, setIsLoading] = useState(true);
    const projectProcessing =
        localStorage.getItem('projectProcessing') === 'true';

    useEffect(() => {
        socket.emit('get-user-details');

        socket.on('user-data', (data) => {
            setIsLoading(false);
            setProjects(data.projects);
            setSubscriptionAmount(data.subscriptionAmount);
        });

        if (projects.length > 0) {
            setProjectName(
                projects.find((project) => project.id === selectedProjectId)
            );
        }

        return () => {
            socket.off('user-data');
        };
    }, [selectedProjectId, projects, socket, setProjects]);

    return (
        <>
            <CreateProject
                display={openCreateProject}
                setDisplay={setOpenCreateProject}
            />
            <nav className={`fixed transition-all w-64 top-2 left-0 z-50`}>
                <div className={`flex items-center justify-between gap-4 px-2`}>
                    {/* Open/close menu button */}
                    <button
                        className="text-yedu-gray-text dark:text-yedu-white hover:text-yedu-green dark:hover:text-yedu-green transition-colors"
                        onClick={() => {
                            localStorage.setItem(
                                'isNavigationCollapsed',
                                !sideMenu
                            );
                            setSideMenu(!sideMenu);
                        }}
                    >
                        <i
                            className={`fas ${sideMenu ? 'fa-times' : 'fa-bars-staggered'} text-2xl`}
                        ></i>
                    </button>
                    {/* New project button */}
                    <button
                        className="text-yedu-gray-text dark:text-yedu-white hover:text-yedu-green dark:hover:text-yedu-green transition-colors"
                        onClick={() => {
                            if (!projectProcessing) {
                                setOpenCreateProject(true);
                            } else {
                                toast.info('Please wait, your project is being updated', { autoClose: 6000 });
                            }
                        }}
                        ref={newTabRef}
                    >
                        <i className="fas fa-folder-plus text-2xl"></i>
                    </button>
                    {isLoading ? (
                        <div className="bg-yedu-dark-gray animate-pulse h-8 w-32 rounded-md"></div>
                    ) : (
                        subscriptionAmount && (
                            <div className="flex items-center gap-2 text-yedu-gray-text dark:text-yedu-white">
                                <span>Remaining</span>
                                <img
                                    src={tokenIcon}
                                    alt=""
                                    className="w-6 hover:animate-pulse"
                                />
                                <span className="font-semibold">
                                    $
                                    {new Intl.NumberFormat('en-US').format(
                                        subscriptionAmount
                                    )}
                                </span>
                            </div>
                        )
                    )}
                </div>
            </nav>
            {/* Side menu */}
            <aside
                className={`z-40 w-64 bg-gray-100 fixed top-0 left-0 dark-applied h-screen transform transition-transform duration-300 ease-in-out scrollbar-none overflow-y-scroll ${
                    sideMenu ? 'translate-x-0' : '-translate-x-full'
                }`}
                ref={navRef}
            >
                <div className="mt-16 flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-yedu-gray-text dark:text-yedu-white truncate">
                        {projectName ? projectName.name : 'Select a Project'}
                    </h2>
                </div>
                <div className="py-4">
                    <h3 className="px-4 py-2 text-sm font-medium text-yedu-gray-text dark:text-yedu-white">
                        Recents
                    </h3>
                    <div className="space-y-1">
                        {isLoading
                            ? Array(3)
                                  .fill(null)
                                  .map((_, index) => (
                                      <div
                                          key={index}
                                          className="mx-4 h-10 bg-yedu-dark-gray animate-pulse rounded-md"
                                      ></div>
                                  ))
                            : projects.map((project) => (
                                  <ProjectLink
                                      projectName={project}
                                      sideMenu={sideMenu}
                                      key={project.id}
                                      deleteButtonActive={confirmDeleteDisplay}
                                      setDeleteButtonActive={
                                          setConfirmDeleteDisplay
                                      }
                                  />
                              ))}
                    </div>
                </div>
            </aside>
            {/* Settings button */}
            <button
                className="fixed z-50 top-2 right-2 border-2 border-yedu-green w-10 h-10 rounded-full flex items-center justify-center text-yedu-green hover:bg-yedu-green hover:text-white transition-colors"
                onClick={() => navigate('/user/settings')}
            >
                <i className="fas fa-user-gear"></i>
            </button>
        </>
    );
};

export default Navigation;