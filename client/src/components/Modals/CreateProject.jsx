import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useStoreActions } from 'easy-peasy';

const env = process.env.NODE_ENV || 'development';
const baseURL =
    env === 'production'
        ? process.env.REACT_APP_PROD_API_URL
        : process.env.REACT_APP_DEV_API_URL;

const CreateProject = ({ display, setDisplay }) => {
    const [projectName, setProjectName] = useState('');
    const url = `${baseURL}/projects/create-project`;
    const jwt = localStorage.getItem('jwt');
    const navigate = useNavigate();
    const projectNameRef = useRef(null);
    const createModalRef = useRef(null);
    const setSelectedProjectId = useStoreActions(
        (actions) => actions.setSelectedProjectId
    );

    const handleProjectCreation = async () => {
        if (!projectName.trim()) {
            toast.warn('Please enter a project name.', { autoClose: 5000 });
            return;
        }

        const projectId = 'proj_' + Date.now();
        try {
            await axios.post(
                url,
                { projectId, projectName },
                { headers: { Authorization: `Bearer ${jwt}` } }
            );
            setSelectedProjectId(projectId);
            localStorage.setItem("selectedProjectId", projectId);
            setDisplay(false);
            navigate(`/chat/${projectId}`);
            toast.success(`${projectName} successfully created.`, {
                autoClose: 5000,
            });
        } catch (error) {
            console.error('Error saving project:', error);
            toast.error('Error saving project.', {
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

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [display, setDisplay]);

    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark-applied rounded-lg shadow-xl p-6 w-11/12 max-w-md z-50"
                open={display}
                ref={createModalRef}
            >
                <button
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 bg-green-100 rounded-full w-8 h-8 flex items-center justify-center"
                    onClick={() => setDisplay(false)}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h1 className="text-2xl font-bold text-center mb-6">
                    Create a Project
                </h1>
                <input
                    type="text"
                    placeholder="Enter project name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onChange={(e) => setProjectName(e.target.value)}
                    ref={projectNameRef}
                    autoFocus
                />
                <button
                    className="w-full mt-6 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-lg font-semibold"
                    onClick={handleProjectCreation}
                >
                    Submit
                </button>
            </dialog>
        </>
    );
};

export default CreateProject;
