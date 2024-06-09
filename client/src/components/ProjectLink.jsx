import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProjectLink = ({ projectName, sideMenu, setSideMenu }) => {
    const [deleteButtonActive, setDeleteButtonActive] = useState(false);
    const [currentProject, setCurrentProject] = useState(projectName.id);

    useEffect(() => {
        if (!sideMenu) {
            setDeleteButtonActive(false); // Closes the delete project button when the sidebar closes
        }
    }, [sideMenu, setDeleteButtonActive]);

    const jwt = localStorage.getItem('jwt');
    const projectId = localStorage.getItem('selectedProjectId');
    const openDeleteButton = useRef(null);

    async function deleteProject(projectId, jwt) {
        const url = 'http://localhost:8000/projects/project';
        try {
            // Send DELETE request to the server to delete the project
            const response = await axios.delete(url, {
                data: { projectId: projectId },
                headers: { Authorization: `Bearer ${jwt}` },
            });

            localStorage.removeItem('selectedProjectId');

            // Check if the deletion was successful and update UI accordingly
            if (response.status === 200) {
                toast.success('Project successfully deleted.', {
                    autoClose: 5000,
                });
            } else {
                toast.warn('Failed to delete the project.', {
                    autoClose: 5000,
                });
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            toast.warn('An error occurred while deleting the project.', {
                autoClose: 5000,
            });
        }
    }

    return (
        <Link
            to={`/chat/${projectName.id}`}
            className="my-2 py-1 m-auto rounded-lg text-sm w-full bg-inherit flex items-center justify-between relative px-4"
            key={projectName.id}
            onClick={(e) => {
                if (e.target !== openDeleteButton.current) {
                    setCurrentProject(projectName.id);
                    localStorage.setItem('selectedProjectId', currentProject);
                    setSideMenu(false);
                }
            }}
        >
            <p>{projectName.name}</p>
            <i
                className={`fas p-2 ${deleteButtonActive ? 'fa-times' : 'fa-ellipsis'} text-2xl`}
                onClick={() => setDeleteButtonActive(!deleteButtonActive)}
                ref={openDeleteButton}
            ></i>
            <span
                className={`absolute right-0 -bottom-[20%] bg-yedu-danger text-yedu-white p-2 rounded-lg ${deleteButtonActive ? 'block' : 'hidden'}`}
                onClick={async () => {
                    await deleteProject(projectId, jwt);
                }}
            >
                Delete Project
            </span>
        </Link>
    );
};

export default ProjectLink;
