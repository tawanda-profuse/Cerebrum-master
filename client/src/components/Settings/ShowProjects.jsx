import { getSocket } from '../../socket';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
const env = process.env.NODE_ENV || 'development';
const baseURL =
    env === 'production'
        ? process.env.REACT_APP_PROD_API_URL
        : process.env.REACT_APP_DEV_API_URL;

const ShowProjects = ({ display }) => {
    const [projects, setProjects] = useState([]);
    const socket = getSocket();
    const url = `${baseURL}/users/download`;
    const jwt = localStorage.getItem('jwt');
    const [currentProject, setCurrentProject] = useState('');

    useEffect(() => {
        socket.emit('get-user-details');

        socket.on('user-data', (data) => {
            setProjects(data.projects);
        });

        return () => {
            socket.off('user-data');
        };
    }, [socket]);

    const handleDownload = async (projectId) => {
        setCurrentProject(projectId);
        await axios
            .post(
                url,
                { projectId: currentProject },
                { headers: { Authorization: `Bearer ${jwt}` } }
            )
            .then((response) => {
                toast.success(response.data, { autoClose: 5000 });
            })
            .catch((error) => {
                toast.error('Error downloading files', { autoClose: 5000 });
                console.error(error);
            });
    };

    // Select all anchor tags
    useEffect(() => {
        const links = document.querySelectorAll('a');
        links.forEach((link) => {
            link.setAttribute('target', '_blank');
        });
    }, [projects]);

    return (
        <div
            className={`flex-auto flex flex-col mt-[1em] gap-4 min-h-screen form-entry ${display ? 'block' : 'hidden'}`}
        >
            {projects && projects.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full bg-gray-100 rounded-lg shadow-sm">
                        <thead className="font-bold text-lg bg-gray-200 dark-applied">
                            <tr>
                                <th className="border p-2 text-left">
                                    Project Name
                                </th>
                                <th className="border p-2 text-center">
                                    Creation Date
                                </th>
                                <th className="border p-2 text-center">URL</th>
                                <th className="border p-2 text-center">
                                    Source Files
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr
                                    key={project.id}
                                    className="bg-white even:bg-gray-50 dark:odd:bg-[#28282B] dark:even:bg-[#666]"
                                >
                                    <td className="border p-2">
                                        {project.name}
                                    </td>
                                    <td className="border p-2 text-center">
                                        {new Date(
                                            project.createdAt
                                        ).toLocaleDateString('en-us', {
                                            month: 'long',
                                            year: 'numeric',
                                            day: 'numeric',
                                        })}
                                    </td>
                                    <td className="border p-2 text-center">
                                        {project.isCompleted ? (
                                            <a
                                                href={`http://localhost:5001/${project.id}`}
                                                className="underline text-yedu-green border-b-yedu-dark-gray cursor-pointer flex gap-2 items-center"
                                            >
                                                <p>{`http://localhost:5001/${project.id}`}</p>
                                                <i className="fas fa-external-link"></i>
                                            </a>
                                        ) : (
                                            <p>No URL for this website.</p>
                                        )}
                                    </td>
                                    <td className="border p-2 text-center">
                                        {project.isCompleted ? (
                                            <button
                                                className="underline text-yedu-green border-b-yedu-dark-gray cursor-pointer flex gap-2 items-center"
                                                onClick={async () =>
                                                    await handleDownload(
                                                        project.id
                                                    )
                                                }
                                            >
                                                Download{' '}
                                                <i className="fas fa-download"></i>
                                            </button>
                                        ) : (
                                            <p>---</p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="w-full">
                    <h2 className="text-center">No projects yet</h2>
                </div>
            )}
        </div>
    );
};

export default ShowProjects;
