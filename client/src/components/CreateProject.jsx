import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const CreateProject = ({ display, setDisplay }) => {
    const [projectName, setProjectName] = useState('');
    const url = 'http://localhost:8000/api/user/create-project';
    const jwt = localStorage.getItem('jwt');
    const navigate = useNavigate();
    const handleProjectCreation = async () => {
        const projectId = 'proj_' + Date.now();
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
    return (
        <dialog
            className={`w-[80vw] scrollbar scrollbar-thumb-rounded-lg scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-scroll max-h-[80vh] absolute top-[10%] left-[50%] -translate-x-2/4 z-40 shadow-xl shadow-yedu-dark-gray py-4 px-8 rounded-lg ${display ? 'block' : 'hidden'}`}
        >
            <h1 className="text-3xl text-center font-bold my-12">
                Create a Project
            </h1>
            <input
                type="text"
                placeholder="Enter project name"
                className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-3/4 m-auto block focus:border-yedu-green"
                onChange={(e) => setProjectName(e.target.value)}
            />
            <button
                className="m-auto my-10 block bg-yedu-light-green hover:bg-yedu-green py-4 px-12 rounded-xl text-xl hover:text-yedu-white"
                onClick={() => handleProjectCreation}
            >
                Submit
            </button>
        </dialog>
    );
};

export default CreateProject;
