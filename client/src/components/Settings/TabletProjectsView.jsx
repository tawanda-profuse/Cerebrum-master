import React from 'react';

const TabletProjectsView = ({ projects, handleDownloadClick, handleHostSite, serverURL }) => {
  return (
    <div className="tablet-projects-view">
      {projects.map((project) => (
        <div key={project.id} className="project-card">
          <h3>{project.name}</h3>
          <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
          {project.isCompleted && (
            <>
              <a href={`${serverURL}/${project.id}`} target="_blank" rel="noopener noreferrer" className="view-site-btn">
                View Site
              </a>
              <button onClick={() => handleDownloadClick(project)} className="download-btn">
                Download Source Files
              </button>
              <button onClick={() => handleHostSite(project)} className="host-site-btn">
                Host Site
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default TabletProjectsView;