import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const CreateProject = ({ display, setDisplay }) => {
    const [projectName, setProjectName] = useState('');
    const url = 'http://localhost:8000/projects/create-project';
    const jwt = localStorage.getItem('jwt');
    const navigate = useNavigate();
    const projectNameRef = useRef(null);
    const createModalRef = useRef(null);

    const handleProjectCreation = async () => {
        const projectId = 'proj_' + Date.now();
        projectNameRef.current.value = '';
        try {
            await axios.post(
                url,
                { projectId, projectName },
                { headers: { Authorization: `Bearer ${jwt}` } }
            );
            localStorage.setItem('selectedProjectId', projectId);
            setDisplay(false);
            navigate(`/chat/${projectId}`);
            toast.success(`${projectName} successfully created.`, {
                autoClose: 5000,
            });
        } catch (error) {
            console.error('Error saving project:', error);
            toast.warn('Error saving project.', {
                autoClose: 5000,
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                createModalRef.current &&
                !createModalRef.current.contains(event.target)
            ) {
                setDisplay(false);
            }
        };

        if (display) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [display, setDisplay]);
    return (
        <>
            <div
                className={`modal-backdrop ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog
                className="modal-styles"
                open={display}
                ref={createModalRef}
            >
                <button
                    className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125"
                    onClick={() => setDisplay(false)}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h1 className="text-3xl text-center my-12">Create a Project</h1>
                <input
                    type="text"
                    placeholder="Enter project name"
                    className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full m-auto block focus:border-yedu-green"
                    onChange={(e) => setProjectName(e.target.value)}
                    ref={projectNameRef}
                    autoFocus
                />
                <button
                    className="bg-yedu-green h-10 px-4 text-white rounded-md w-full border-none outline-none text-yedu-white my-8 text-lg m-auto block hover:opacity-80"
                    onClick={handleProjectCreation}
                >
                    Submit
                </button>
            </dialog>
        </>
    );
};

export default CreateProject;
