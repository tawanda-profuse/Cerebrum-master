import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginFileEncode from 'filepond-plugin-file-encode';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import { useRef, useState, useEffect } from 'react';
import './FilePondStyles.css';
import { toast } from 'react-toastify';
import { getSocket } from '../../../socket';

// Register the plugins
registerPlugin(
    FilePondPluginImageExifOrientation,
    FilePondPluginFileValidateType,
    FilePondPluginFileEncode
);

const SketchUpload = ({ display, setDisplay }) => {
    const [files, setFiles] = useState([]);
    const [name, setFileName] = useState('');
    const nameInputRef = useRef(null);
    const socket = getSocket();

    useEffect(() => {
        const resetForm = () => {
            if (nameInputRef.current) {
                nameInputRef.current.value = '';
            }
            setFiles([]);
            setFileName('');
            setDisplay(false);
        };

        const handleUploadError = (errorMessage) => {
            toast.error(errorMessage);
        };

        const handleNewMessage = (data) => {
            toast.success('File uploaded successfully');
            resetForm();
        };

        socket.on('uploadError', handleUploadError);
        socket.on('new-message', handleNewMessage);

        // Cleanup listeners on component unmount
        return () => {
            socket.off('uploadError', handleUploadError);
            socket.off('new-message', handleNewMessage);
        };
    }, [setDisplay, socket]);

    const handleFileValidateTypeError = (error, file) => {
        toast.error(`File type not allowed: ${file.filename}`, {
            autoClose: 5000,
        });
    };

    const toBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });

    const handleSubmit = async () => {
        const currentProject = localStorage.getItem('selectedProjectId');

        try {
            if (!name) {
                toast.warn('The text field is required', {
                    autoClose: 6000,
                });
                return;
            }

            if (!files || files.length === 0) {
                toast.warn('At least one file upload is required.', {
                    autoClose: 6000,
                });
                return;
            }

            const filesData = await Promise.all(
                files.map(async (file) => {
                    const base64 = await toBase64(file.file);
                    return {
                        name: file.file.name,
                        data: base64.split(',')[1], // Remove the data URL prefix
                    };
                })
            );

            // Check file size before uploading
            const maxSize = 2 * 1024 * 1024; // 2 MB in bytes
            const oversizedFiles = files.filter(
                (file) => file.file.size > maxSize
            );
            if (oversizedFiles.length > 0) {
                toast.warn(
                    'File size exceeds the maximum limit (2 MB). Please upload smaller files.',
                    {
                        autoClose: 6000,
                    }
                );
                return;
            }

            socket.emit('uploadImage', {
                imageType: "sketch",
                message: name,
                projectId: currentProject,
                fileName: files[0].file.name,
                file: filesData[0].data,
            });

            // Immediately reset the form
            resetForm();
        } catch (error) {
            toast.error('Network error. Please try again.');
        }
    };

    const resetForm = () => {
        if (nameInputRef.current) {
            nameInputRef.current.value = '';
        }
        setFiles([]);
        setFileName('');
        setDisplay(false);
    };

    return (
        <>
            <div
                className={`modal-backdrop ${display ? 'block' : 'hidden'}`}
            ></div>
            <dialog
                className="modal-styles extended-modal-styles dark-applied"
                open={display}
            >
                <button
                    className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125"
                    onClick={resetForm}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h1 className="text-3xl text-center my-12">
                    Upload Your Website Sketch
                </h1>
                <textarea
                    className="px-2 border-2  outline-none rounded-md min-h-14 w-full mb-8 focus:border-yedu-green"
                    placeholder="Enter a description of your sketch"
                    onChange={(e) => setFileName(e.target.value)}
                    ref={nameInputRef}
                />
                <p className="text-sm yedu-light-gray my-4 font-bold">
                    Maximum File Size:{' '}
                    <span className="text-yedu-danger">2MB</span>
                </p>
                <FilePond
                    files={files}
                    onupdatefiles={setFiles}
                    allowMultiple={true}
                    maxFiles={5}
                    name="files"
                    labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
                    className="filepond-tailwind"
                    acceptedFileTypes={['image/*', 'application/pdf']}
                    fileValidateTypeDetectType={(source, type) =>
                        new Promise((resolve, reject) => {
                            // Custom file type detection
                            resolve(type);
                        })
                    }
                    fileValidateTypeLabelExpectedTypesMap={{
                        'image/*': '.jpg, .jpeg, .png, .gif',
                        'application/pdf': '.pdf',
                    }}
                    fileValidateTypeLabelExpectedTypes="Expects {allButLastType} or {lastType}"
                    onerror={handleFileValidateTypeError}
                    labelFileTypeNotAllowed="File of invalid type. Please upload an image or PDF file."
                />
                <button
                    className="bg-yedu-green h-10 py-2 px-4 rounded-md border-none outline-none text-yedu-white w-full text-lg hover:opacity-80"
                    onClick={handleSubmit}
                >
                    Submit
                </button>
            </dialog>
        </>
    );
};

export default SketchUpload;
