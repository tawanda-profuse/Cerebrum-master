import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';

const ImageDropzone = ({ index, upload, updateImageUpload, className }) => {
    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'],
        },
        maxSize: 2 * 1024 * 1024, // 2 MB
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                updateImageUpload(index, 'file', acceptedFiles[0]);
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
        <div
            {...getRootProps({ className: 'dropzone' })}
            className={className}
        >
            <input {...getInputProps()} />
            {upload.file ? (
                <div className="text-center">
                    <p className="text-sm">{upload.file.name}</p>
                </div>
            ) : (
                <p className="text-sm text-gray-500">Upload</p>
            )}
        </div>
    );
};

export default ImageDropzone;
