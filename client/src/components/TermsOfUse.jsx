const TermsOfUse = ({ show, setShow }) => {
    return (
        <dialog
            className={`w-[80vw] md:w-[50vw] scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-scroll max-h-[80vh] absolute top-[10%] left-[50%] -translate-x-2/4 z-50 shadow-xl shadow-yedu-dark-gray py-4 px-8 rounded-lg ${show ? 'block' : 'hidden'}`}
        >
            <button className="absolute right-4 rounded-full bg-yedu-light-green py-1 px-3 text-2xl transition-all hover:scale-125">
                <i
                    className="fas fa-times"
                    onClick={() => {
                        setShow(false);
                    }}
                ></i>
            </button>
            <h1 className="text-3xl text-center font-bold underline my-12">
                Terms of Use
            </h1>
            <p className="text-left text-yedu-gray-text my-4">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam,
                est! Perferendis quaerat sit possimus dignissimos nobis aliquid
                explicabo rerum in pariatur dolorem? Consectetur, odit quidem
                voluptatem maxime ab natus eaque culpa sint sed aut sit
                molestias. Assumenda recusandae, odio asperiores facere soluta
                doloribus nostrum quae omnis officia nobis minima quas!
            </p>
            <p className="text-left text-yedu-gray-text my-4">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam,
                est! Perferendis quaerat sit possimus dignissimos nobis aliquid
                explicabo rerum in pariatur dolorem? Consectetur, odit quidem
                voluptatem maxime ab natus eaque culpa sint sed aut sit
                molestias. Assumenda recusandae, odio asperiores facere soluta
                doloribus nostrum quae omnis officia nobis minima quas!
            </p>
            <p className="text-left text-yedu-gray-text my-4">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam,
                est! Perferendis quaerat sit possimus dignissimos nobis aliquid
                explicabo rerum in pariatur dolorem? Consectetur, odit quidem
                voluptatem maxime ab natus eaque culpa sint sed aut sit
                molestias. Assumenda recusandae, odio asperiores facere soluta
                doloribus nostrum quae omnis officia nobis minima quas!
            </p>
        </dialog>
    );
};

export default TermsOfUse;
