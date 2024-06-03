import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    useEffect(() => {
        document.title = 'Yedu User Settings';
    }, []);
    const [toggle, setToggle] = useState(false);
    const navigate = useNavigate();
    return (
        <>
            <section className="bg-yedu-dull min-h-screen font-montserrat flex flex-col gap-4 items-center justify-center py-16">
                <Navigation />
                <main className="w-4/5 bg-yedu-white rounded-lg py-4 px-4 mt-16">
                    <h1 className="text-left font-semibold text-2xl my-4">
                        Settings
                    </h1>
                    <div className="my-10 m-auto flex gap-10 flex-wrap">
                        <div className="sm:flex-auto md:flex-1 flex flex-col gap-4">
                            <button className="rounded-md flex items-center gap-4 p-4 text-sm  bg-yedu-dull">
                                <i className="fas fa-gear text-xl"></i> General
                            </button>
                            <button className="rounded-md flex items-center gap-4 p-4 text-sm">
                                <i className="fas fa-database text-xl"></i> Data
                                Controls
                            </button>
                            <button className="rounded-md flex items-center gap-4 p-4 text-sm">
                                <i className="fas fa-cloud text-xl"></i>{' '}
                                Security
                            </button>
                            <button
                                className="rounded-md flex items-center gap-4 p-4 text-sm"
                                onClick={() => navigate('/pricing')}
                            >
                                <i className="fas fa-credit-card text-xl"></i>{' '}
                                Plans
                            </button>
                        </div>
                        <div className="flex-auto flex flex-col gap-4 text-sm">
                            <span
                                className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all hover:pl-2 cursor-pointer flex items-center justify-between"
                                onClick={() => setToggle(!toggle)}
                            >
                                Always show code when using data analyst{' '}
                                <i
                                    className={`text-6xl text-yedu-green transition-all fas ${toggle ? 'fa-toggle-on' : 'fa-toggle-off'}`}
                                ></i>
                            </span>
                            <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all hover:pl-2 cursor-pointer">
                                Language
                            </span>
                            <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all hover:pl-2 cursor-pointer">
                                Archived chats
                            </span>
                            <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all hover:pl-2 cursor-pointer">
                                Archive all chats
                            </span>
                            <span className="py-4 border-b border-b-yedu-dark-gray font-medium transition-all hover:pl-2 cursor-pointer">
                                Delete all chats
                            </span>
                        </div>
                    </div>
                </main>
            </section>
        </>
    );
};

export default Settings;
