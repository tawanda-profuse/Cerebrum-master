import axios from 'axios';
import { useEffect, useState } from 'react';

const ShowProjects = ({ display }) => {
    const jwt = localStorage.getItem('jwt');
    const [projects, setProjects] = useState([]);
    useEffect(() => {
        let intervalId;
        const fetchProjects = async () => {
            try {
                const response = await axios.get(
                    'http://localhost:8000/projects',
                    {
                        headers: { Authorization: `Bearer ${jwt}` },
                    }
                );
                setProjects(response.data);
            } catch (error) {
                console.error(`${error}`);
                return [];
            }
        };

        fetchProjects();

        intervalId = setInterval(fetchProjects, 400);

        return () => {
            clearInterval(intervalId);
        };
    }, [jwt]);

    // Select all anchor tags
    const links = document.querySelectorAll('a');

    links.forEach((link) => {
        link.setAttribute('target', '_blank');
    });
    return (
        <div
            className={`flex-auto flex flex-col gap-4 form-entry ${display ? 'block' : 'hidden'}`}
        >
            {projects.length > 0 ? (
                <table className="w-full">
                    <thead className="font-bold text-lg">
                        <tr>
                            <td className="border border-black p-2">
                                Project Name
                            </td>
                            <td className="border border-black p-2 text-center">
                                Creation Date
                            </td>
                            <td className="border border-black p-2 text-center">
                                URL
                            </td>
                        </tr>
                    </thead>
                    {projects.map((project) => (
                        <tr key={project.id}>
                            <td className="border border-black p-2">
                                {project.name}
                            </td>
                            <td className="border border-black p-2">
                                {new Date(project.createdAt).toLocaleDateString(
                                    'en-us',
                                    {
                                        month: 'long',
                                        year: 'numeric',
                                        day: 'numeric',
                                    }
                                )}
                            </td>
                            <td className="border border-black p-2">
                                {project.isCompleted ? (
                                    <a
                                        href={`http://localhost:5001/${project.id}`}
                                        className="underline text-yedu-green border-b-yedu-dark-gray cursor-pointer flex gap-2 items-center"
                                    >
                                        <p>{`http://localhost:5001/${project.id}`}</p>
                                        <i className="fas fa-external-link"></i>
                                    </a>
                                ) : (
                                    <p className="text-center">
                                        No URL for this website.
                                    </p>
                                )}
                            </td>
                        </tr>
                    ))}
                </table>
            ) : (
                <h2 className="text-center">No projects yet</h2>
            )}
        </div>
    );
};

export default ShowProjects;
