import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ProjectLink = ({ projectName, sideMenu, setSideMenu }) => {
    const [deleteButtonActive, setDeleteButtonActive] = useState(false);
    const [currentProject, setCurrentProject] = useState(projectName.id);

    useEffect(() => {
        if (!sideMenu) {
            setDeleteButtonActive(false); // Closes the delete project button when the sidebar closes
        }
    }, [sideMenu, setDeleteButtonActive]);

    return (
        <Link
            to={`/chat/${projectName.id}`}
            className="my-3 py-3 m-auto rounded-lg text-sm w-full bg-inherit flex items-center justify-between px-4 hover:bg-yedu-dull"
            key={projectName.id}
            onClick={() => {
                setCurrentProject(projectName.id);
                localStorage.setItem('selectedProjectId', currentProject);
                setSideMenu(false);
            }}
        >
            <p>{projectName.name}</p>
            <i
                className={`fas ${deleteButtonActive ? 'fa-times' : 'fa-ellipsis'} text-2xl`}
                onClick={() => setDeleteButtonActive(!deleteButtonActive)}
            ></i>
            <span
                className={`absolute -right-[50%] bg-yedu-danger text-yedu-white p-2 rounded-lg ${deleteButtonActive ? 'block' : 'hidden'}`}
            >
                Delete Project
            </span>
        </Link>
    );
};

export default ProjectLink;
