import { getSocket } from '../../socket';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './ShowProjects.css';
import { toast } from 'react-toastify';

const baseURL = process.env.VITE_NODE_ENV === 'production' 
  ? process.env.VITE_PROD_API_URL 
  : process.env.VITE_DEV_API_URL;
const serverURL = process.env.VITE_NODE_ENV === 'development'
        ? process.env.VITE_SERVER_DEV_URL 
        : process.env.VITE_SERVER_PROD_URL;

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                {children}
            </div>
        </div>
    );
};

const ShowProjects = ({ display, setOpenProduction }) => {
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const socket = getSocket();
    const url = `${baseURL}/projects/download`;
    const jwt = localStorage.getItem('jwt');
    const [windowDimensions, setWindowDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        function handleResize() {
            setWindowDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        socket.emit('get-user-details');
        socket.on('user-data', (data) => {
            setProjects(data.projects);
        });
        return () => {
            socket.off('user-data');
        };
    }, [socket]);

    const handleDownloadClick = (project) => {
        setCurrentProject(project);
        setIsModalOpen(true);
    };

    const handleDownloadConfirm = async () => {
        setIsModalOpen(false);
        try {
            const response = await axios.post(
                url,
                { projectId: currentProject.id },
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                    responseType: 'blob',
                }
            );

            const blob = new Blob([response.data], {
                type: response.headers['content-type'],
            });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `${currentProject.name}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Project files downloaded successfully', {
                autoClose: 5000,
            });
        } catch (error) {
            if (error.response && error.response.status === 400) {
                toast.error(error.response.data.message, { autoClose: 5000 });
            } else {
                toast.error('Error downloading files', { autoClose: 5000 });
            }
            console.error(error);
        }
    };

    const handleHostSite = (project) => {
        localStorage.setItem('selectedProjectId', project.id);
        setCurrentProject(project);
        setOpenProduction(true);
    };

    useEffect(() => {
        const links = document.querySelectorAll('a');
        links.forEach((link) => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
    }, [projects]);

    const MobileView = () => (
        <div className="grid grid-cols-1 gap-6">
            {projects.map((project) => (
                <div
                    key={project.id}
                    className="bg-white rounded-lg shadow-lg p-6 relative"
                >
                    <h3 className="text-xl font-bold mb-4 text-center">
                        {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 text-center">
                        {new Date(project.createdAt).toLocaleDateString(
                            'en-us',
                            {
                                month: 'long',
                                year: 'numeric',
                                day: 'numeric',
                            }
                        )}
                    </p>
                    {project.isCompleted ? (
                        <div className="space-y-3">
                            <button
                                onClick={() =>
                                    window.open(
                                        `${serverURL}/${project.id}`,
                                        '_blank'
                                    )
                                }
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center"
                            >
                                View Site
                                <svg
                                    className="w-4 h-4 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                </svg>
                            </button>
                            <button
                                className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center"
                                onClick={() => handleDownloadClick(project)}
                            >
                                Download Source Files
                                <svg
                                    className="w-4 h-4 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                </svg>
                            </button>
                            <button
                                className="w-full bg-red-500 hover:bg-green-600 text-white text-sm font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center"
                                onClick={() => handleHostSite(project)}
                            >
                                Host Site
                                <svg
                                    className="w-4 h-4 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 11l7-7 7 7M5 19l7-7 7 7"
                                    />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center">
                            Project not completed
                        </p>
                    )}
                </div>
            ))}
        </div>
    );

    const TabletViewLandscape = () => (
        <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="w-full bg-white">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project Name
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Creation Date
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            URL
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source Files
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Host Site
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                            <td className="p-3 text-sm text-gray-900">
                                {project.name}
                            </td>
                            <td className="p-3 text-sm text-gray-500 text-center">
                                {new Date(project.createdAt).toLocaleDateString(
                                    'en-us',
                                    {
                                        month: 'long',
                                        year: 'numeric',
                                        day: 'numeric',
                                    }
                                )}
                            </td>
                            <td className="p-3 text-sm text-center">
                                {project.isCompleted ? (
                                    <a
                                        href={`${serverURL}/${project.id}`}
                                        className="text-blue-600 hover:text-blue-900 flex items-center justify-center"
                                    >
                                        <span className="truncate max-w-xs">
                                            View Site
                                        </span>
                                        <svg
                                            className="w-4 h-4 ml-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                    </a>
                                ) : (
                                    <span className="text-gray-500">
                                        Not available
                                    </span>
                                )}
                            </td>
                            <td className="p-3 text-sm text-center">
                                {project.isCompleted ? (
                                    <button
                                        className="bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 text-white text-sm font-medium py-1 px-3 rounded transition duration-300 ease-in-out h-8 w-28"
                                        onClick={() =>
                                            handleDownloadClick(project)
                                        }
                                    >
                                        Download
                                        <svg
                                            className="w-4 h-4 ml-1 inline"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                            />
                                        </svg>
                                    </button>
                                ) : (
                                    <span className="text-gray-500">---</span>
                                )}
                            </td>
                            <td className="p-3 text-sm text-center">
                                {project.isCompleted ? (
                                    <button
                                        className="bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 text-white text-sm font-medium py-1 px-3 rounded transition duration-300 ease-in-out h-8 w-28"
                                        onClick={() => handleHostSite(project)}
                                    >
                                        Host Site
                                        <svg
                                            className="w-4 h-4 ml-1 inline"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 11l7-7 7 7M5 19l7-7 7 7"
                                            />
                                        </svg>
                                    </button>
                                ) : (
                                    <span className="text-gray-500">---</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const TabletViewPortrait = () => (
        <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="w-full bg-white">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project Name
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Creation Date
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            URL
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source Files
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Host Site
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                            <td className="p-3 text-sm text-gray-900">
                                {project.name}
                            </td>
                            <td className="p-3 text-sm text-gray-500 text-center">
                                {new Date(project.createdAt).toLocaleDateString(
                                    'en-us',
                                    {
                                        month: 'long',
                                        year: 'numeric',
                                        day: 'numeric',
                                    }
                                )}
                            </td>
                            <td className="p-3 text-sm text-center">
                                {project.isCompleted ? (
                                    <a
                                        href={`${serverURL}/${project.id}`}
                                        className="text-blue-600 hover:text-blue-900 flex items-center justify-center"
                                    >
                                        <span className="truncate max-w-xs">
                                            View Site
                                        </span>
                                        <svg
                                            className="w-4 h-4 ml-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                    </a>
                                ) : (
                                    <span className="text-gray-500">
                                        Not available
                                    </span>
                                )}
                            </td>
                            <td className="p-3 text-sm text-center">
                                {project.isCompleted ? (
                                    <button
                                        className="bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 text-white text-sm font-medium py-1 px-3 rounded transition duration-300 ease-in-out h-8 w-28"
                                        onClick={() =>
                                            handleDownloadClick(project)
                                        }
                                    >
                                        Download
                                        <svg
                                            className="w-4 h-4 ml-1 inline"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                            />
                                        </svg>
                                    </button>
                                ) : (
                                    <span className="text-gray-500">---</span>
                                )}
                            </td>
                            <td className="p-3 text-sm text-center">
                                {project.isCompleted ? (
                                    <button
                                        className="bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 text-white text-sm font-medium py-1 px-3 rounded transition duration-300 ease-in-out h-8 w-28"
                                        onClick={() => handleHostSite(project)}
                                    >
                                        Host Site
                                        <svg
                                            className="w-4 h-4 ml-1 inline"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 11l7-7 7 7M5 19l7-7 7 7"
                                            />
                                        </svg>
                                    </button>
                                ) : (
                                    <span className="text-gray-500">---</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const WebView = () => (
        <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="w-full bg-white">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project Name
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Creation Date
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            URL
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source Files
                        </th>
                        <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Host Site
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                            <td className="p-3 text-sm text-gray-900">
                                {project.name}
                            </td>
                            <td className="p-3 text-sm text-gray-500 text-center">
                                {new Date(project.createdAt).toLocaleDateString(
                                    'en-us',
                                    {
                                        month: 'long',
                                        year: 'numeric',
                                        day: 'numeric',
                                    }
                                )}
                            </td>
                            <td className="p-3 text-sm text-center">
                                {project.isCompleted ? (
                                    <a
                                        href={`${serverURL}/${project.id}`}
                                        className="text-blue-600 hover:text-blue-900 flex items-center justify-center"
                                    >
                                        <span className="truncate max-w-xs">
                                            View Site
                                        </span>
                                        <svg
                                            className="w-4 h-4 ml-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                    </a>
                                ) : (
                                    <span className="text-gray-500">
                                        Not available
                                    </span>
                                )}
                            </td>
                            <td className="p-3 text-sm text-center">
                                {project.isCompleted ? (
                                    <button
                                        className="bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 text-white text-sm font-medium py-1 px-3 rounded transition duration-300 ease-in-out h-8 w-28"
                                        onClick={() =>
                                            handleDownloadClick(project)
                                        }
                                    >
                                        Download
                                        <svg
                                            className="w-4 h-4 ml-1 inline"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                            />
                                        </svg>
                                    </button>
                                ) : (
                                    <span className="text-gray-500">---</span>
                                )}
                            </td>
                            <td className="p-3 text-sm text-center">
                                {project.isCompleted ? (
                                    <button
                                        className="bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 text-white text-sm font-medium py-1 px-3 rounded transition duration-300 ease-in-out h-8 w-28"
                                        onClick={() => handleHostSite(project)}
                                    >
                                        Host Site
                                        <svg
                                            className="w-4 h-4 ml-1 inline"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 11l7-7 7 7M5 19l7-7 7 7"
                                            />
                                        </svg>
                                    </button>
                                ) : (
                                    <span className="text-gray-500">---</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const getView = () => {
        if (windowDimensions.width < 768) {
            return <MobileView />;
            } else if (windowDimensions.width >= 768 && windowDimensions.width < 1200) {
            return windowDimensions.width > windowDimensions.height ? (
                <TabletViewLandscape />
            ) : (
                <TabletViewPortrait />
            );
        } else {
            return <WebView />;
        }
    };

    return (
        <div
            className={`projects-container flex-auto flex flex-col mt-4 gap-4 min-h-screen ${display ? 'block' : 'hidden'}`}
        >
            {projects && projects.length > 0 ? (
                <>{getView()}</>
            ) : (
                <div className="w-full text-center p-4 bg-gray-50 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-700">
                        No projects yet
                    </h2>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2 className="text-xl font-bold mb-4">Confirm Download</h2>
                <p className="mb-4">
                    $2 will be deducted from your tokens to download this
                    project's files. Do you want to proceed?
                </p>
                <div className="flex justify-end">
                    <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2 text-sm"
                        onClick={() => setIsModalOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-sm"
                        onClick={handleDownloadConfirm}
                    >
                        Confirm Download
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ShowProjects;
