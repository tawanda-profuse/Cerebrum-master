import { useState } from 'react';
import ShowProjects from './ShowProjects';

const ProfileSection = ({
    display,
    setDisplay,
    openProjects,
    setOpenProjects,
}) => {
    const [toggle, setToggle] = useState(false);

    return (
        <>
            <div className={`w-full ${display ? 'block' : 'hidden'}`}>
                <span
                    className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all cursor-pointer flex items-center justify-between"
                    onClick={() => setToggle(!toggle)}
                >
                    Change page theme{' '}
                    <i
                        className={`text-4xl text-yedu-green transition-all fas ${toggle ? 'fa-toggle-on' : 'fa-toggle-off'}`}
                    ></i>
                </span>
                <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all cursor-pointer flex items-center justify-between">
                    Email:
                    <p>{'test@email.com'}</p>
                </span>
                <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all cursor-pointer flex items-center justify-between">
                    Phone Number:
                    <p>{'+1-000-000-000'}</p>
                </span>
            </div>
            <div className="flex flex-wrap my-4 gap-2 items-center justify-center w-3/4 m-auto">
                <button
                    className="flex-auto md:flex-1 bg-yedu-green h-10 px-4 rounded-md w-full border-none outline-none text-yedu-white my-8 text-lg m-auto block hover:opacity-80"
                    onClick={() => {
                        setOpenProjects(true);
                        setDisplay(false);
                    }}
                >
                    Show Projects
                </button>
                <button className="flex-auto md:flex-1 bg-yedu-green h-10 px-4 rounded-md w-full border-none outline-none text-yedu-white my-8 text-lg m-auto block hover:opacity-80">
                    Change Password
                </button>
            </div>
            <ShowProjects display={openProjects} setDisplay={setOpenProjects} />
        </>
    );
};

export default ProfileSection;
