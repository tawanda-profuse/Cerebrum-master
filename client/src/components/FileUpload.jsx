import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginImageResize from 'filepond-plugin-image-resize';
import FilePondPluginFileEncode from 'filepond-plugin-file-encode';
import { useState } from 'react';

// Register the plugins
registerPlugin(
    FilePondPluginImageExifOrientation,
    FilePondPluginImagePreview,
    FilePondPluginImageResize,
    FilePondPluginFileEncode
);

const FileUpload = ({ display, setDisplay }) => {
    const [files, setFiles] = useState([]);
    const [coverImage, setCoverImage] = useState(null);

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

    return (
        <dialog
            className={`w-[80vw] max-h-[80vh] absolute top-[10%] left-[50%] -translate-x-2/4 z-40 shadow-xl shadow-yedu-dark-gray py-4 px-8 rounded-lg transition-all ${display ? 'block' : 'hidden'}`}
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
            <h1 className="text-3xl text-center font-bold my-12">
                Upload Your Files
            </h1>
            <FilePond
                className="w-[300px] h-[300px] rounded-lg m-auto block"
                name="cover"
                files={files}
                onupdatefiles={setFiles}
                allowMultiple={true}
                allowFileTypeValidation={true}
                acceptedFileTypes={['image/*', 'application/pdf']}
                maxFiles={5}
                labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
                imageCropAspectRatio="1:1"
                stylePanelAspectRatio={0}
                imageResizeTargetWidth={300}
                imageResizeTargetHeight={300}
                onprocessfile={(error, file) => {
                    if (!error) {
                        handleFileUpload(files); // Pass file items to handleFileUpload function
                    }
                }}
            />
        </dialog>
    );
};

export default FileUpload;
