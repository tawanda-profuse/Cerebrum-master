import React, { useRef, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { getSocket } from '../../../socket';

const SketchUpload = ({ display, setDisplay }) => {
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const descriptionRef = useRef(null);
    const socket = getSocket();
    const sketchUploadRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                sketchUploadRef.current &&
                !sketchUploadRef.current.contains(event.target)
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

        const handleUploadSuccess = (data) => {
            toast.success(data.message);
            resetForm();
        };

        socket.on('uploadError', handleUploadError);
        socket.on('uploadSuccess', handleUploadSuccess);

        return () => {
            socket.off('uploadError', handleUploadError);
            socket.off('uploadSuccess', handleUploadSuccess);
        };
    }, [display, setDisplay, socket]);

    const resetForm = () => {
        setFile(null);
        setDescription('');
        if (descriptionRef.current) {
            descriptionRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        const currentProject = localStorage.getItem('selectedProjectId');

        try {
            if (!description) {
                toast.warn('The description field is required', {
                    autoClose: 6000,
                });
                return;
            }

            if (!file) {
                toast.warn('A file upload is required.', { autoClose: 6000 });
                return;
            }

            const maxSize = 2 * 1024 * 1024; // 2 MB
            if (file.size > maxSize) {
                toast.warn(
                    'File size exceeds the maximum limit (2 MB). Please upload a smaller file.',
                    { autoClose: 6000 }
                );
                return;
            }

            toast.info("Please wait...", {
                autoClose: 6000
            });

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result.split(',')[1];
                socket.emit('uploadImage', {
                    imageType: 'sketch',
                    message: description,
                    projectId: currentProject,
                    fileName: file.name,
                    file: base64,
                });
            };
            reader.readAsDataURL(file);

            resetForm();
            setDisplay(false); // Close the modal after submission
        } catch (error) {
            toast.error('Network error. Please try again.');
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'],
            'application/pdf': ['.pdf'],
        },
        maxSize: 2 * 1024 * 1024, // 2 MB
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setFile(acceptedFiles[0]);
            }
        },
        onDropRejected: (fileRejections) => {
            fileRejections.forEach(({ file, errors }) => {
                errors.forEach((error) => {
                    toast.error(
                        `Error with file ${file.name}: ${error.message}`,
                        { autoClose: 5000 }
                    );
                });
            });
        },
    });

    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-2xl z-50"
                open={display}
                ref={sketchUploadRef}
            >
                <button
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                    onClick={() => setDisplay(false)}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h1 className="text-3xl font-bold text-center mb-6">
                    Upload Your Website Sketch
                </h1>
                <textarea
                    placeholder="Enter a description of your sketch"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 resize-y text-sm"
                    ref={descriptionRef}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-sm text-gray-600 mb-4 font-bold">
                    Maximum File Size: <span className="text-red-500">2MB</span>
                </p>
                <div
                    {...getRootProps({ className: 'dropzone' })}
                    className="border-dashed border-2 border-gray-300 rounded-md p-4 text-center cursor-pointer mb-6"
                >
                    <input {...getInputProps()} />
                    {file ? (
                        <p>{file.name}</p>
                    ) : (
                        <p>
                            Drag & Drop your files or{' '}
                            <span className="text-blue-500">Browse</span>
                        </p>
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

export default SketchUpload;
