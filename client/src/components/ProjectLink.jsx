import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSocket } from '../socket';

const ProjectLink = ({
    projectName,
    sideMenu,
    deleteButtonActive,
    setDeleteButtonActive,
}) => {
    const [currentProject, setCurrentProject] = useState(projectName.id);
    const socket = getSocket();

    useEffect(() => {
        if (!sideMenu) {
            setDeleteButtonActive(false); // Closes the delete project button when the sidebar closes
        }
    }, [sideMenu, setDeleteButtonActive]);

    const openDeleteButton = useRef(null);

    return (
        <Link
            to={`/chat/${projectName.id}`}
            className="dark-applied my-2 py-1 m-auto rounded-lg text-sm w-full bg-inherit flex items-center justify-between relative px-8"
            key={projectName.id}
            onClick={(e) => {
                if (e.target !== openDeleteButton.current) {
                    setCurrentProject(projectName.id);
                    localStorage.setItem('selectedProjectId', currentProject);
                    if (currentProject) {
                        // Join the room for the current project ID
                        socket.emit('join', currentProject);
                    }
                }
            }}
        >
            <p className="transition-all hover:translate-x-[10%]">
                {projectName.name}
            </p>
            <i
                className={`fas fa-trash p-2 text-lg text-yedu-gray-text hover:text-yedu-danger`}
                onClick={(e) => {
                    e.preventDefault();
                    setCurrentProject(projectName.id);
                    localStorage.setItem('selectedProjectId', currentProject);
                    setDeleteButtonActive(!deleteButtonActive);
                }}
                ref={openDeleteButton}
            ></i>
        </Link>
    );
};

export default ProjectLink;
