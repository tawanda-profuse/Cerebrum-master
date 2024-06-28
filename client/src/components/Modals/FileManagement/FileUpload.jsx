import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import SketchUpload from './SketchUpload';
import AssetUpload from './AssetUpload';
import { getSocket } from '../../../socket';

const FileUpload = ({ display, setDisplay }) => {
    const [sketchUpload, setSketchUpload] = useState(false);
    const [assetUpload, setAssetUpload] = useState(false);
    const [projectCompleted, setProjectCompleted] = useState(false);
    const currentProject = localStorage.getItem('selectedProjectId');
    const socket = getSocket();

    useEffect(() => {
        socket.on('project-status-response', (data) => {
            setProjectCompleted(data.projectCompleted);
        });

        return () => {
            socket.off('project-status-response');
        };
    }, [socket]);

    return (
        <>
            <SketchUpload display={sketchUpload} setDisplay={setSketchUpload} />
            <AssetUpload display={assetUpload} setDisplay={setAssetUpload} />
            <div
                className={`modal-backdrop ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog
                className="modal-styles extended-modal-styles dark-applied"
                open={display}
            >
                <button
                    className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125"
                    onClick={() => setDisplay(false)}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h1 className="text-3xl text-center mt-14">
                    What Would You Like To Do?
                </h1>
                <div className="flex flex-wrap justify-center gap-4 m-auto w-full my-12">
                    <button
                        className="flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 min-h-36 hover:bg-yedu-light-green dark:hover:bg-yedu-dull self-start flex flex-col items-center justify-center gap-6 bg-[#ccc] dark:bg-inherit dark:hover:bg-yedu-light-green"
                        onClick={() => {
                            setSketchUpload(true);
                            setDisplay(false);
                        }}
                    >
                        <i className="fas fa-pencil text-4xl"></i>
                        Upload a Sketch
                    </button>
                    <button
                        className="flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 min-h-36 hover:bg-yedu-light-green dark:hover:bg-yedu-dull self-start flex flex-col items-center justify-center gap-6 bg-[#ccc] dark:bg-inherit dark:hover:bg-yedu-light-green"
                        onClick={() => {
                            socket.emit('get-project-status', {
                                projectId: currentProject,
                            });
                            
                            if (projectCompleted) {
                                setAssetUpload(true);
                                setDisplay(false);
                            } else {
                                toast.info(
                                    'Cannot upload an image asset before the website has been completely built.'
                                );
                            }
                        }}
                    >
                        <i className="fas fa-image text-4xl"></i>
                        Upload Image for Your Website
                    </button>
                </div>
            </dialog>
        </>
    );
};

export default FileUpload;
