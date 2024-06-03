import newtab from '../assets/new-tab.svg';
import leftpanel from '../assets/panel-left.svg';
import logo from '../assets/logo.svg';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Navigation = () => {
    const [userAccount, setUserAccount] = useState(false);
    const [sideMenu, setSideMenu] = useState(false);
    const navigate = useNavigate();
    const projects = [
        {
            projectId: '123456789',
            name: 'Test Project 1',
        },
        {
            projectId: '1234135468',
            name: 'Test Project 2',
        },
        {
            projectId: '1237432121',
            name: 'Test Project 3',
        },
    ];

    const [deleteButtonActive, setDeleteButtonActive] = useState(false);

    // Closes the delete project button when the sidebar closes
    useEffect(() => {
        if (!sideMenu) {
            setDeleteButtonActive(false);
        }
    }, [sideMenu, setDeleteButtonActive]);

    const handleLogOut = () => {
        localStorage.clear();
        localStorage.setItem('jwt', null);
        localStorage.setItem('selectedProjectId', null);
        navigate('/');
        toast.success('Successfully logged out.', {
            autoClose: 4000,
        });
    };

    return (
        <>
            <div className="sm: w-[95%] md:w-1/5 flex gap-4 absolute top-2 left-2">
                <button
                    className="z-20"
                    onClick={() => {
                        setSideMenu(!sideMenu);
                        setUserAccount(false);
                    }}
                >
                    <img src={leftpanel} alt="" />
                </button>
                <button
                    className={`z-20 transition-all ${sideMenu ? 'absolute right-4' : ''}`}
                >
                    <img src={newtab} alt="" />
                </button>
            </div>
            <div
                className={`sm: w-full md:w-1/5 absolute z-10 shadow-xl shadow-yedu-dark-gray bg-yedu-dull min-h-screen transition-all ${sideMenu ? 'top-0 left-0' : 'top-0 -left-full'}`}
            >
                <span className="flex items-center justify-start gap-4 mt-16 pl-4">
                    <img src={logo} alt="" className="w-10" />
                    <Link
                        to="/chat"
                        className="text-sm text-md font-semibold"
                        onClick={() => setSideMenu(!sideMenu)}
                    >
                        New Project
                    </Link>
                </span>
                <p className="py-3 font-medium pl-4 my-4">Recents</p>
                {projects &&
                    projects.map((project) => (
                        <button
                            className="my-6 m-auto rounded-lg text-sm w-full bg-inherit flex items-center justify-between"
                            key={project.projectId}
                        >
                            <p className="flex-auto">{project.name}</p>
                            <i
                                className={`fas flex-1 ${deleteButtonActive ? 'fa-times' : 'fa-ellipsis'} text-2xl`}
                                onClick={() =>
                                    setDeleteButtonActive(!deleteButtonActive)
                                }
                            ></i>
                            <span
                                className={`absolute -right-[50%] bg-yedu-danger text-yedu-white p-2 rounded-lg ${deleteButtonActive ? 'block' : 'hidden'}`}
                            >
                                Delete Project
                            </span>
                        </button>
                    ))}
            </div>
            <button
                className="absolute top-2 right-4 bg-yedu-dark border-2 border-yedu-green w-10 h-10 rounded-full"
                onClick={() => {
                    setUserAccount(!userAccount);
                    setSideMenu(false);
                }}
            ></button>
            <div
                className={`absolute w-64 rounded-lg bg-yedu-white p-4 shadow-sm shadow-yedu-dark-gray transition-all z-10 ${userAccount ? 'top-14 right-4' : '-top-full -right-4'}`}
            >
                <Link
                    to="/user/settings"
                    className="py-4 text-yedu-gray-text flex gap-6 items-center"
                    onClick={() => setUserAccount(false)}
                >
                    <i className="fas fa-gear"></i> Settings
                </Link>
                <hr />
                <button
                    className="py-4 text-yedu-gray-text flex gap-6 items-center"
                    onClick={() => {
                        setUserAccount(false);
                        handleLogOut();
                    }}
                >
                    <i className="fas fa-right-from-bracket"></i> Log Out
                </button>
            </div>
        </>
    );
};

export default Navigation;
