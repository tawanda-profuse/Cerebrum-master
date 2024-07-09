import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStoreActions } from 'easy-peasy';
import { getSocket } from '../socket';
import { toast } from 'react-toastify';

const ProjectLink = ({
    projectName,
    sideMenu,
    deleteButtonActive,
    setDeleteButtonActive,
}) => {
    const setSelectedProjectId = useStoreActions(
        (actions) => actions.setSelectedProjectId
    );
    // const [currentProject, setCurrentProject] = useState(projectName.id);
    const socket = getSocket();
    const projectProcessing =
        localStorage.getItem('projectProcessing') === 'true';

    useEffect(() => {
        if (!sideMenu) {
            setDeleteButtonActive(false); // Closes the delete project button when the sidebar closes
        }
    }, [sideMenu, setDeleteButtonActive]);

    const openDeleteButton = useRef(null);

    return (
        <Link
            to={`/chat/${projectName.id}`}
            className="my-2 py-1 m-auto rounded-lg text-sm w-full bg-inherit flex items-center justify-between relative px-8"
            key={projectName.id}
            onClick={(e) => {
                if (projectProcessing) {
                    e.preventDefault();
                    toast.info('Please wait, your project is being updated', {
                        autoClose: 6000,
                    });
                } else {
                    if (e.target !== openDeleteButton.current) {
                        setSelectedProjectId(projectName.id);
                        if (projectName.id) {
                            // Join the room for the current project ID
                            socket.emit('join', projectName.id);
                        }
                    }
                }
            }}
        >
            <p className="transition-all dark:text-yedu-white hover:translate-x-[10%]">
                {projectName.name}
            </p>
            <i
                className={`fas fa-trash p-2 text-lg text-yedu-gray-text dark:text-yedu-white hover:text-yedu-danger dark:hover:text-red-400`}
                onClick={(e) => {
                    e.preventDefault();
                    if (!projectProcessing) {
                        setSelectedProjectId(projectName.id);
                        setDeleteButtonActive(!deleteButtonActive);
                    }
                }}
                ref={openDeleteButton}
            ></i>
        </Link>
    );
};

export default ProjectLink;
