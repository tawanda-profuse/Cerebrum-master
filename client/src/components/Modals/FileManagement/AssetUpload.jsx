import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getSocket } from '../../../socket';
import './AssetUpload.css';
import ImageDropzone from './ImageDropzone';
import { useStoreState } from 'easy-peasy';

const AssetUpload = ({ display, setDisplay }) => {
    const [imageUploads, setImageUploads] = useState([{ id: '', file: null }]);
    const socket = getSocket();
    const assetUploadRef = useRef(null);
    const currentProject = useStoreState((state) => state.selectedProjectId);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                assetUploadRef.current &&
                !assetUploadRef.current.contains(event.target)
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

        socket.on('assetUploadError', handleUploadError);

        return () => {
            socket.off('assetUploadError', handleUploadError);
        };
    }, [display, setDisplay, socket]);

    const validateData = () => {
        if (imageUploads.some((upload) => !upload.id || !upload.file)) {
            toast.warn('All image IDs and files are required', {
                autoClose: 6000,
            });
            return false;
        }

        const maxSize = 2 * 1024 * 1024; // 2 MB
        const oversizedFiles = imageUploads.filter(
            (upload) => upload.file.size > maxSize
        );
        if (oversizedFiles.length > 0) {
            toast.warn(
                'File size exceeds the maximum limit (2 MB). Please upload smaller files.',
                { autoClose: 6000 }
            );
            return false;
        }

        if (imageUploads.length > 5) {
            toast.warn('You can only upload a maximum of 5 files.', {
                autoClose: 6000,
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        try {
            const convertToBase64 = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = (error) => reject(error);
                });
            };

            if (validateData()) {
                toast.info('Please wait...', {
                    autoClose: 6000,
                });
                // Map the files to their base64 conversion promises
                const filePromises = imageUploads.map(async (upload) => ({
                    id: upload.id,
                    file: await convertToBase64(upload.file),
                }));

                // Resolve all the promises
                const filePayload = await Promise.all(filePromises);

                socket.emit('uploadAssetImages', {
                    filePayload: filePayload,
                    projectId: currentProject,
                });

                resetForm();
                setDisplay(false); // Close the modal after submission
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        }
    };

    const resetForm = () => {
        setImageUploads([{ id: '', file: null }]);
    };

    const addImageUpload = () => {
        if (validateData()) {
            setImageUploads([...imageUploads, { id: '', file: null }]); // Adds a new input row
        }
    };

    const removeImageUpload = () => {
        if (imageUploads.length === 0) {
            toast.warn('There are no images', { autoClose: 6000 });
        }

        if (imageUploads.length >= 1) {
            imageUploads.pop();

            const newUploads = [...imageUploads];
            setImageUploads(newUploads);
        }
    };

    const updateImageUpload = (index, field, value) => {
        const newUploads = [...imageUploads];
        newUploads[index][field] = value;
        setImageUploads(newUploads);
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark-applied rounded-lg shadow-xl p-6 w-11/12 max-w-2xl z-50 max-h-[70vh] overflow-y-scroll"
                open={display}
                ref={assetUploadRef}
            >
                <button
                    className="absolute right-4 top-4 text-gray-500 dark:text-[#ccc] hover:text-gray-700 dark:hover:text-white"
                    onClick={() => {
                        setDisplay(false);
                        resetForm();
                    }}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h1 className="text-3xl font-bold text-center mb-6">
                    Website Image Upload
                </h1>
                <ul className="list-disc pl-6 mb-6 text-sm text-gray-600 dark:text-white">
    <li>
        Go to the created website, notice all images have an id or name.
    </li>
    <li>
        Enter here the specific Id or name of the image you want to replace:
        <ul className="list-disc pl-6">
            <li>
                For uploading a logo, use <code>logo</code> as the name.
            </li>
            <li>
                For a background image, use <code>background-image</code> as the name.
            </li>
            <li>
                For a favicon, use <code>favicon</code> as the name.
            </li>
            <li>
                For every other image, go to the created site and look for the associated image name or image id.
            </li>
        </ul>
    </li>
    <li>
        For image consistency, try to maintain the exact dimensions of the image.
    </li>
    <li className="font-semibold">
        Maximum File Size: <span className="text-red-500">2MB</span>
    </li>
</ul>

                {imageUploads.map((upload, index) => (
                    <div
                        key={index}
                        className="flex items-center mb-4 space-x-2"
                    >
                        <input
                            type="text"
                            className="w-2/3 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter the specific id or name of the image "
                            value={upload.id}
                            onChange={(e) =>
                                updateImageUpload(index, 'id', e.target.value)
                            }
                        />
                        <div className="w-1/3 h-10">
                            <ImageDropzone
                                index={index}
                                upload={upload}
                                updateImageUpload={updateImageUpload}
                                className={
                                    'border-dashed border-2 border-gray-300 rounded-md h-full flex items-center justify-center cursor-pointer bg-green-100'
                                }
                            />
                        </div>
                    </div>
                ))}
                <div className="flex justify-between align-center">
                    <button
                        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                        onClick={() => {
                            if (imageUploads.length >= 5) {
                                toast.warn(
                                    'You can only upload a maximum of 5 files.',
                                    {
                                        autoClose: 6000,
                                    }
                                );
                            } else {
                                addImageUpload();
                            }
                        }}
                    >
                        <i className="fas fa-plus mr-2"></i> Add Another Image
                    </button>
                    {imageUploads.length > 1 && (
                        <button
                            className="mb-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                            onClick={removeImageUpload}
                        >
                            <i className="fas fa-minus mr-2"></i> Remove Image
                        </button>
                    )}
                </div>
                <button
                    className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-lg font-semibold"
                    onClick={handleSubmit}
                >
                    Submit
                </button>
            </dialog>
        </>
    );
};

export default AssetUpload;
