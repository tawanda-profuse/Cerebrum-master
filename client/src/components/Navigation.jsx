import newtab from '../assets/new-tab.svg';
import leftpanel from '../assets/panel-left.svg';
import logo from '../assets/logo.svg';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navigation = () => {
    const [userAccount, setUserAccount] = useState(false);
    const [sideMenu, setSideMenu] = useState(false);
    const navigate = useNavigate();

    const handleLogOut = () => {
        localStorage.clear();
        localStorage.setItem('jwt', null);
        localStorage.setItem('selectedProjectId', null);
        navigate('/');
    };

    return (
        <>
            <div className="flex gap-4 absolute top-2 left-2">
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
                    className={`z-20 transition-all ${sideMenu ? 'translate-x-32' : 'translate-x-0'}`}
                >
                    <img src={newtab} alt="" />
                </button>
            </div>
            <div
                className={`w-1/5 absolute z-10 bg-yedu-dull min-h-screen transition-all ${sideMenu ? 'top-0 left-0' : 'top-0 -left-full'}`}
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
                <button className="py-3 m-auto my-4 block rounded-lg text-sm pl-4 text-left bg-yedu-white w-4/5">
                    Project XYZ
                </button>
                <button className="py-3 m-auto my-4 block rounded-lg text-sm pl-4 text-left bg-yedu-white w-4/5">
                    Project 123
                </button>
                <button className="py-3 m-auto my-4 block rounded-lg text-sm pl-4 text-left bg-yedu-white w-4/5">
                    Project AWS
                </button>
                <button className="py-3 m-auto my-4 block rounded-lg text-sm pl-4 text-left bg-yedu-white w-4/5">
                    Project XYZ
                </button>
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
