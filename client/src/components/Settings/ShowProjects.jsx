import React from 'react';

const ShowProjects = ({ display, setDisplay }) => {
    return (
        <div
            className={`flex-auto md:flex-[0.4] flex flex-col gap-4 ${display ? 'block' : 'hidden'}`}
        >
            <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all cursor-pointer flex items-center justify-between">
                Email:
                <p>{'test@email.com'}</p>
            </span>
        </div>
    );
};

export default ShowProjects;
