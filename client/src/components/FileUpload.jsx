import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginFileEncode from 'filepond-plugin-file-encode';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import { useState } from 'react';
import './FilePondStyles.css';
import { toast } from 'react-toastify';

// Register the plugins
registerPlugin(
    FilePondPluginImageExifOrientation,
    FilePondPluginFileValidateType,
    FilePondPluginFileEncode
);

const FileUpload = ({ display, setDisplay }) => {
    const [files, setFiles] = useState([]);
    const [coverImage, setCoverImage] = useState(null);
    const [name, setFileName] = useState("");

    const handleFileUpload = (fileItems) => {
        if (fileItems.length > 0) {
            const uploadedFile = fileItems[0].file;
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result; // Get base64-encoded string
                setCoverImage(base64String); // Store base64 string in state
            };
            console.log(coverImage);
            // Read the uploadedFile (Blob) as data URL
            reader.readAsDataURL(uploadedFile);
        }
    };

    const handleFileValidateTypeError = (error, file) => {
        toast.error(`File type not allowed: ${file.filename}`, {
            autoClose: 5000,
        });
    };

    return (
        <dialog
            className={`w-[80vw] md:w-[50vw] absolute top-[50%] left-[50%] -translate-x-2/4 -translate-y-2/4 z-40 shadow-xl shadow-yedu-dark-gray py-4 px-8 rounded-lg transition-all ${display ? 'block' : 'hidden'}`}
        >
            <button
                className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125"
                onClick={() => {
                    setDisplay(false);
                    setFiles([]);
                }}
            >
                <i className="fas fa-times"></i>
            </button>
            <h1 className="text-3xl text-center my-12">Upload Your Files</h1>
            <input
                type="text"
                className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                placeholder="Enter the description of the files"
                onChange={(e)=>setFileName(e.target.value)}
            />
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
                onprocessfile={(error, file) => {
                    if (!error) {
                        handleFileUpload(files); // Pass file items to handleFileUpload function
                    }
                }}
            />
            <button className="bg-yedu-green h-10 py-2 px-4 text-white rounded-md border-none outline-none text-yedu-white w-full text-lg hover:opacity-80">
                Submit
            </button>
        </dialog>
    );
};

export default FileUpload;
