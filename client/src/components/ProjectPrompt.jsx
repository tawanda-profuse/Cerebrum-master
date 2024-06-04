const ProjectPrompt = ({
    display,
    setDisplay,
    setSideMenu,
    setOpenCreateProject,
}) => {
    return (
        <dialog
            className={`w-[80vw] scrollbar scrollbar-thumb-rounded-lg scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-scroll max-h-[80vh] absolute top-[10%] left-[50%] -translate-x-2/4 z-40 shadow-xl shadow-yedu-dark-gray py-4 px-8 rounded-lg ${display ? 'block' : 'hidden'}`}
        >
            <h1 className="text-3xl text-center font-bold my-12">
                You Have No Project Open
            </h1>
            <p className="text-center text-yedu-danger font-bold my-4">
                Select an option below
            </p>
            <button
                className="m-auto my-10 block bg-yedu-light-green hover:bg-yedu-green py-4 px-8 rounded-xl text-xl hover:text-yedu-white"
                onClick={() => {
                    setDisplay(false);
                    setOpenCreateProject(true);
                }}
            >
                Create Project
            </button>
            <button
                className="m-auto my-10 block bg-yedu-light-green hover:bg-yedu-green py-4 px-8 rounded-xl text-xl hover:text-yedu-white"
                onClick={() => {
                    setSideMenu(true);
                    setDisplay(false);
                }}
            >
                Select Project
            </button>
        </dialog>
    );
};

export default ProjectPrompt;
