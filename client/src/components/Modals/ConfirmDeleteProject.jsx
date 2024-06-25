import React from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
const env = process.env.NODE_ENV || 'development';
const baseURL = env === 'production' ? process.env.REACT_APP_PROD_API_URL : process.env.REACT_APP_DEV_API_URL;

const ConfirmDeleteProject = ({ display, setDisplay, deleteProjectRef }) => {
    const jwt = localStorage.getItem('jwt');
    const projectId = localStorage.getItem('selectedProjectId');

    async function deleteProject(projectId, jwt) {
        if (!projectId) {
            toast.warn('There is no project selected. Cannot delete.');
        }
        const url = `${baseURL}/projects/project`;
        try {
            // Send DELETE request to the server to delete the project
            const response = await axios.delete(url, {
                data: { projectId: projectId },
                headers: { Authorization: `Bearer ${jwt}` },
            });

            // Check if the deletion was successful and update UI accordingly
            if (response.status === 200) {
                toast.success('Project successfully deleted.', {
                    autoClose: 5000,
                });
                localStorage.removeItem('selectedProjectId');
                window.location.replace('/chat');
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
        <>
            <div
                className={`modal-backdrop ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog
                className="modal-styles dark-applied"
                open={display}
                ref={deleteProjectRef}
            >
                <button
                    className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125"
                    onClick={() => setDisplay(false)}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h1 className="text-2xl text-center my-12">
                    Are you sure you want to delete this project? This action
                    cannot be undone.
                </h1>
                <div className="flex w-full my-12 gap-8 m-auto flex-wrap justify-center items-center">
                    <button
                        className="w-full md:w-2/5 bg-yedu-green h-10 px-4 text-white rounded-md border-none outline-none text-yedu-white text-lg m-auto block hover:opacity-80"
                        onClick={async () => {
                            await deleteProject(projectId, jwt);
                            setDisplay(false);
                        }}
                    >
                        Confirm
                    </button>
                    <button
                        className="w-full md:w-2/5 bg-yedu-danger h-10 px-4 text-white rounded-md border-none outline-none text-yedu-white text-lg m-auto block hover:opacity-80"
                        onClick={() => setDisplay(false)}
                    >
                        Cancel
                    </button>
                </div>
            </dialog>
        </>
    );
};

export default ConfirmDeleteProject;
