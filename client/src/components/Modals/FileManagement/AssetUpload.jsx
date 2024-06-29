import React, { useRef, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { getSocket } from '../../../socket';
import './AssetUpload.css';

const AssetUpload = ({ display, setDisplay }) => {
    const [imageUploads, setImageUploads] = useState([{ id: '', file: null }]);
    const [description, setDescription] = useState('');
    const descriptionRef = useRef(null);
    const socket = getSocket();
    const assetUploadRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (assetUploadRef.current && !assetUploadRef.current.contains(event.target)) {
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

        const handleNewMessage = (data) => {
            toast.success('Files uploaded successfully');
            resetForm();
        };

        socket.on('uploadError', handleUploadError);
        socket.on('new-message', handleNewMessage);

        return () => {
            socket.off('uploadError', handleUploadError);
            socket.off('new-message', handleNewMessage);
        };
    }, [display, setDisplay, socket]);

    const validateData = () => {
        if (imageUploads.some(upload => !upload.id || !upload.file)) {
            toast.warn('All image IDs and files are required', { autoClose: 6000 });
            return false;
        }

        const maxSize = 2 * 1024 * 1024; // 2 MB
        const oversizedFiles = imageUploads.filter(upload => upload.file.size > maxSize);
        if (oversizedFiles.length > 0) {
            toast.warn('File size exceeds the maximum limit (2 MB). Please upload smaller files.', { autoClose: 6000 });
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        try {
            if (validateData()) {
                const filePayload = imageUploads.map(upload => ({
                    id: upload.id,
                    file: upload.file,
                }));

                console.log('File Payload: ', filePayload);

                resetForm();
                setDisplay(false);  // Close the modal after submission
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        }
    };

    const resetForm = () => {
        setImageUploads([{ id: '', file: null }]);
        setDescription('');
        if (descriptionRef.current) {
            descriptionRef.current.value = '';
        }
    };

    const addImageUpload = () => {
        setImageUploads([...imageUploads, { id: '', file: null }]);
    };

    const updateImageUpload = (index, field, value) => {
        const newUploads = [...imageUploads];
        newUploads[index][field] = value;
        setImageUploads(newUploads);
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${display ? 'block' : 'hidden'}`}></div>
            <dialog className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-2xl z-50" open={display} ref={assetUploadRef}>
                <button
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                    onClick={() => setDisplay(false)}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h1 className="text-3xl font-bold text-center mb-6">Website Image Upload</h1>
                <ul className="list-disc pl-6 mb-6 text-sm text-gray-600">
                    <li>You cannot upload an image if you have not created a full project.</li>
                    <li>Enter the exact image ID consistent with the image you want to replace on your website.</li>
                    <li>For image consistency, try to maintain the exact dimensions of the image.</li>
                    <li className="font-semibold">Maximum File Size: <span className="text-red-500">2MB</span></li>
                </ul>
                
                {imageUploads.map((upload, index) => (
                    <div key={index} className="flex items-center mb-4 space-x-2">
                        <input
                            type="text"
                            className="w-2/3 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Specific image ID"
                            value={upload.id}
                            onChange={(e) => updateImageUpload(index, 'id', e.target.value)}
                        />
                        <div className="w-1/3 h-10">
                            <ImageDropzone 
                                index={index} 
                                upload={upload}
                                updateImageUpload={updateImageUpload}
                            />
                        </div>
                    </div>
                ))}

                <button
                    className="mb-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                    onClick={addImageUpload}
                >
                    <i className="fas fa-plus mr-2"></i> Add Another Image
                </button>

                <textarea
                    placeholder="What do you want to do?"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 resize-y text-sm"
                    ref={descriptionRef}
                    onChange={(e) => setDescription(e.target.value)}
                />

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

const ImageDropzone = ({ index, upload, updateImageUpload }) => {
    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
        },
        maxSize: 2 * 1024 * 1024, // 2 MB
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                updateImageUpload(index, 'file', acceptedFiles[0]);
            }
        },
        onDropRejected: (fileRejections) => {
            fileRejections.forEach(({ file, errors }) => {
                errors.forEach(error => {
                    toast.error(`Error with file ${file.name}: ${error.message}`, { autoClose: 5000 });
                });
            });
        },
    });

    return (
        <div {...getRootProps({ className: 'dropzone' })} className="border-dashed border-2 border-gray-300 rounded-md h-full flex items-center justify-center cursor-pointer">
            <input {...getInputProps()} />
            {
                upload.file ? (
                    <div className="text-center">
                        <p className="text-sm">{upload.file.name}</p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">Upload</p>
                )
            }
        </div>
    );
};

export default AssetUpload;