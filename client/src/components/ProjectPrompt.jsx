const ProjectPrompt = ({
    display,
    setDisplay,
    setSideMenu,
    setOpenCreateProject,
}) => {
    return (
        <dialog
            className={`w-[80vw] md:w-[50vw] sm:h-96 md:h-72 absolute top-[50%] left-[50%] -translate-x-2/4 -translate-y-2/4 z-40 shadow-xl shadow-yedu-dark-gray py-4 px-8 rounded-lg transition-all ${display ? 'block' : 'hidden'}`}
        >
            <button
                className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125"
                onClick={() => setDisplay(false)}
            >
                <i className="fas fa-times"></i>
            </button>
            <h1 className="text-3xl text-center my-12">
                Select An Option Below
            </h1>
            <div className="flex w-full my-12 m-auto flex-wrap justify-center">
                <button
                    className="w-full md:w-2/5 bg-yedu-green h-10 px-4 text-white rounded-md border-none outline-none text-yedu-white my-8 text-lg m-auto block hover:opacity-80"
                    onClick={() => {
                        setDisplay(false);
                        setOpenCreateProject(true);
                    }}
                >
                    Create Project
                </button>
                <button
                    className="w-full md:w-2/5 bg-yedu-green h-10 px-4 text-white rounded-md border-none outline-none text-yedu-white my-8 text-lg m-auto block hover:opacity-80"
                    onClick={() => {
                        setSideMenu(true);
                        setDisplay(false);
                    }}
                >
                    Select Project
                </button>
            </div>
        </dialog>
    );
};

export default ProjectPrompt;
