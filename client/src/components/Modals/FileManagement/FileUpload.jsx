import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import SketchUpload from './SketchUpload';
import AssetUpload from './AssetUpload';
import { getSocket } from '../../../socket';
import { useStoreState } from 'easy-peasy';

const FileUpload = ({ display, setDisplay }) => {
    const [sketchUpload, setSketchUpload] = useState(false);
    const [assetUpload, setAssetUpload] = useState(false);
    const [projectCompleted, setProjectCompleted] = useState(false);
    const currentProject = useStoreState((state) => state.selectedProjectId);
    const socket = getSocket();
    const fileUploadRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                fileUploadRef.current &&
                !fileUploadRef.current.contains(event.target)
            ) {
                setDisplay(false);
            }
        };

        if (display) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        const handleUploadError = (errorMessage) => {
            toast.error(errorMessage);
        };

        socket.on('project-completed-response', (data) => {
            setProjectCompleted(data.projectCompleted);

            if (!data.projectCompleted) {
                toast.info(
                    'Cannot upload an image asset before the website has been completely built.'
                );
            }

            if (data.projectCompleted) {
                setAssetUpload(true);
                setDisplay(false);
            }
        });

        socket.on('project-completed-error', handleUploadError);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            socket.off('project-completed-response');
            socket.off('project-completed-error');
        };
    }, [display, setDisplay, socket]);

    return (
        <>
            <SketchUpload display={sketchUpload} setDisplay={setSketchUpload} />
            <AssetUpload display={assetUpload} setDisplay={setAssetUpload} />
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark-applied rounded-lg shadow-xl p-6 w-11/12 max-w-md z-50"
                open={display}
                ref={fileUploadRef}
            >
                <button
                    className="absolute right-2 top-2 text-gray-500 dark:text-white hover:text-gray-700 bg-green-100 dark:bg-green-500 rounded-full w-8 h-8 flex items-center justify-center"
                    onClick={() => setDisplay(false)}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h1 className="text-2xl font-bold text-center mb-6">
                    What Would You Like To Do?
                </h1>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        className="bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#666] rounded-lg p-4 flex flex-col items-center justify-center transition-colors"
                        onClick={() => {
                            setSketchUpload(true);
                            setDisplay(false);
                        }}
                    >
                        <i className="fas fa-pencil-alt text-2xl mb-2"></i>
                        <span>Upload a Sketch</span>
                    </button>
                    <button
                        className="bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#666] rounded-lg p-4 flex flex-col items-center justify-center transition-colors"
                        onClick={() => {
                            socket.emit(
                                'get-project-completed',
                                currentProject
                            );
                        }}
                    >
                        <i className="fas fa-image text-2xl mb-2"></i>
                        <span>Upload Image for Your Website</span>
                    </button>
                </div>
            </dialog>
        </>
    );
};

export default FileUpload;
