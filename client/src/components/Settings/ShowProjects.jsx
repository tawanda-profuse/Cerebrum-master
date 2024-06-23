import { getSocket } from '../../socket';
import { useEffect, useState } from 'react';

const ShowProjects = ({ display }) => {
    const [projects, setProjects] = useState([]);
    const socket = getSocket();
    useEffect(() => {
        socket.emit('get-user-details');

        socket.on('user-data', (data) => {
            setProjects(data.projects);
        });

        return () => {
            socket.off('user-data');
        };
    }, [socket]);

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
                        <thead className="font-bold text-lg bg-gray-200">
                            <tr>
                                <th className="border p-2 text-left">
                                    Project Name
                                </th>
                                <th className="border p-2 text-center">
                                    Creation Date
                                </th>
                                <th className="border p-2 text-center">
                                    URL
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id} className="bg-white even:bg-gray-50">
                                    <td className="border p-2">
                                        {project.name}
                                    </td>
                                    <td className="border p-2 text-center">
                                        {new Date(project.createdAt).toLocaleDateString('en-us', {
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <h2 className="text-center">No projects yet</h2>
            )}
        </div>
    );
};

export default ShowProjects;
