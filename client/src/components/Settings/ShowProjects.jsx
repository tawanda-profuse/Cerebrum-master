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
            {projects.length > 0 &&
                projects.map((project) => (
                    <a
                        href={`http://localhost:5001/${project.id}`}
                        className="p-4 border-b border-b-yedu-dark-gray font-medium transition-all cursor-pointer flex items-center justify-start gap-6 hover:bg-yedu-light-green hover:translate-x-[2%]"
                        key={project.id}
                    >
                        <p>{project.name}</p>
                        <i className="fas fa-external-link"></i>
                    </a>
                ))}
        </div>
    );
};

export default ShowProjects;
