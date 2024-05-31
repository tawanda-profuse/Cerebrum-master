import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import sendbutton from '../assets/send-button.svg';
import useNavigate from 'react-router-dom';

const Settings = () => {
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
                        <div className="flex flex-col gap-4 w-1/5">
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
                        <div className="flex flex-col gap-4 text-sm w-3/5">
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
                <div className="flex flex-col gap-10 w-3/5 py-4 justify-self-end">
                    <div className="w-full m-auto relative py-8">
                        <input
                            type="text"
                            className="border w-full absolute left-2/4 -translate-x-2/4 h-14 border-yedu-green rounded-3xl px-12 outline-none text-sm"
                            placeholder="Message Yedu"
                        />
                        <button className="absolute right-4 z-10 my-2 hover:opacity-80">
                            <img src={sendbutton} alt="" />
                        </button>
                    </div>
                    <p className="text-center text-sm">
                        YeduAI can make mistakes. Make sure to check important
                        information.
                    </p>
                </div>
            </section>
        </>
    );
};

export default Settings;
