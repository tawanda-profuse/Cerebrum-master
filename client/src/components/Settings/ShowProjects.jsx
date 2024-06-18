import React from 'react';

const ShowProjects = ({ display }) => {
    const projects = [
        { name: 'Project 1', url: '/' },
        { name: 'Project 2', url: '/' },
        { name: 'Project 3', url: '/' },
        { name: 'Project 4', url: '/' },
    ];
    return (
        <div
            className={`flex-auto flex flex-col gap-4 form-entry ${display ? 'block' : 'hidden'}`}
        >
            {projects &&
                projects.map((project) => (
                    <a
                        href={project.url}
                        className="p-4 border-b border-b-yedu-dark-gray font-medium transition-all cursor-pointer flex items-center justify-start gap-6 hover:bg-yedu-light-green hover:translate-x-[2%]"
                    >
                        <p>{project.name}</p>
                        <i className="fas fa-external-link"></i>
                    </a>
                ))}
        </div>
    );
};

export default ShowProjects;
