import { useState } from 'react';
import { toast } from 'react-toastify';
import SketchUpload from './SketchUpload';
import AssetUpload from './AssetUpload';

const FileUpload = ({ display, setDisplay }) => {
    const [sketchUpload, setSketchUpload] = useState(false);
    const [assetUpload, setAssetUpload] = useState(false);

    return (
        <>
            <SketchUpload display={sketchUpload} setDisplay={setSketchUpload} />
            <AssetUpload
                display={assetUpload}
                setAssetUpload={setAssetUpload}
            />
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
                        className="flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 min-h-28 hover:bg-yedu-light-green dark:hover:bg-yedu-dull self-start"
                        onClick={() => {
                            setSketchUpload(true);
                            setDisplay(false);
                        }}
                    >
                        <i className="fas fa-palette"></i>
                        Upload Sketches
                    </button>
                    <button
                        className="flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 min-h-28 hover:bg-yedu-light-green dark:hover:bg-yedu-dull self-start"
                        onClick={() => {
                            setAssetUpload(true);
                            setDisplay(false);
                        }}
                    >
                        <i className="fas fa-image"></i>
                        Upload Website Image/Asset
                    </button>
                </div>
            </dialog>
        </>
    );
};

export default FileUpload;
