import logo from '../assets/logo.svg';
import plane from '../assets/plane-fly.svg';
import lightbulb from '../assets/lightbulb.svg';
import pen from '../assets/penline.svg';
import cap from '../assets/cap-outline.svg';
import paperclip from '../assets/paper-clip.svg';
import Navigation from '../components/Navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectPrompt from '../components/ProjectPrompt';
import CreateProject from '../components/CreateProject';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileUpload from '../components/FileUpload';
import { getSocket } from '../socket';

const Chat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const jwt = localStorage.getItem('jwt');
    const currentUser = localStorage.getItem('userId');
    const currentProject = localStorage.getItem('selectedProjectId');
    const [openProjectPrompt, setOpenProjectPrompt] = useState(false);
    const [openCreateProject, setOpenCreateProject] = useState(false);
    const [sideMenu, setSideMenu] = useState(false);
    const [openFileUpload, setOpenFileUpload] = useState(false);
    const userMessageRef = useRef(null);
    const chatPanelRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [isPending, setIsPending] = useState(false);
    const socket = getSocket();

    function isTokenExpired(token) {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64); // Decodes a string of Base64-encoded data into bytes
        const decoded = JSON.parse(decodedJson);
        const exp = decoded.exp;
        const now = Date.now().valueOf() / 1000;
        return now > exp;
    }

    useEffect(() => {
        document.title = 'Yedu Chat';

        const isLoggedIn = () => {
            const token = jwt;
            return token != null && !isTokenExpired(token);
        };

        const checkProjects = () => {
            if (!currentProject) {
                navigate('/chat');
                setOpenProjectPrompt(true);
            } else {
                navigate(`/chat/${currentProject}`);
                setOpenProjectPrompt(false);
            }
        };

        if (!isLoggedIn()) {
            localStorage.clear();
            navigate('/user/login');
            toast.warn('You are not logged in', {
                autoClose: 3000,
            });
        } else {
            checkProjects();
        }

        if (currentUser && currentProject) {
            // Join the room for the current user and project ID
            socket.emit('join', currentUser, currentProject);
        }

        // Listen for the 'initial-data' event
        socket.on('initial-data', (data) => {
            if (currentProject) {
                console.log('Received initial data:', data);
                setMessages(data.messages); // Directly set messages
            }
        });

        // Listen for new messages
        socket.on('new-message', (newMessage) => {
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    role: 'assistant',
                    content: newMessage.content,
                    timestamp: new Date().toISOString(),
                },
            ]); // Correctly append new messages
            setIsPending(false);
        });

        return () => {
            console.log('Cleaning up socket listeners');
            socket.off('initial-data');
            socket.off('new-message');
        };
    }, [jwt, navigate, currentProject, currentUser, socket]);

    // Scroll to the bottom of the chat panel when messages change
    useEffect(() => {
        if (chatPanelRef.current) {
            chatPanelRef.current.scrollTop = chatPanelRef.current.scrollHeight;
        }
    }, [messages]);


    const handleMessageSend = async () => {
        if (!userMessage.trim()) {
            toast.error('Cannot send an empty message');
            return; // Don't send empty messages
        }

        try {
            setIsPending(true); // Set pending status
            userMessageRef.current.value = '';
            // If message sent successfully, emit event to server
            socket.emit('send-message', {
                userId: currentUser,
                message: userMessage,
                projectId: currentProject,
            });
            setMessages([
                ...messages,
                {
                    role: 'user',
                    content: userMessage,
                    timestamp: new Date().toISOString(),
                },
            ]);
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again later.');
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleMessageSend(userMessage);
        }
    };

    return (
        <>
            <ProjectPrompt
                display={openProjectPrompt}
                setDisplay={setOpenProjectPrompt}
                setSideMenu={setSideMenu}
                setOpenCreateProject={setOpenCreateProject}
            />
            <CreateProject
                display={openCreateProject}
                setDisplay={setOpenCreateProject}
            />
            <FileUpload
                display={openFileUpload}
                setDisplay={setOpenFileUpload}
            />
            <section className="p-4 font-montserrat max-h-screen scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-scroll">
                <Navigation
                    sideMenu={sideMenu}
                    setSideMenu={setSideMenu}
                    currentProject={id}
                />
                <img
                    src={logo}
                    alt=""
                    className={`w-12 m-auto mt-20 hover:animate-spin ${messages.length > 0 ? 'hidden' : 'block'}`}
                />
                <div
                    className={`flex flex-col relative min-h-96 transition-all ${messages.length > 0 ? 'sm: mt-16 md:mt-0' : ''}`}
                >
                    <div
                        className={`w-full md:w-3/5 flex items-center transition-all m-auto ${sideMenu ? 'translate-x-[15%]' : 'translate-x-0'} transition-all ${messages.length > 0 ? 'flex-col -mb-4 h-96 overflow-y-scroll gap-8 p-4 border border-yedu-green rounded-lg scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-yedu-green scrollbar-track-yedu-dull' : 'mt-10 flex-row flex-wrap justify-center gap-4'}`}
                        ref={chatPanelRef}
                    >
                        <button
                            className={`flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative min-h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                            onClick={() =>
                                handleMessageSend('What can you do?')
                            }
                        >
                            <img
                                src={plane}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                                What can you do?
                            </p>
                        </button>
                        <button
                            className={`flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative min-h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                            onClick={() =>
                                handleMessageSend('Give me some ideas')
                            }
                        >
                            <img
                                src={lightbulb}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                                Give me some ideas
                            </p>
                        </button>
                        <button
                            className={`flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative min-h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                            onClick={() =>
                                handleMessageSend('Generate some data')
                            }
                        >
                            <img
                                src={pen}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                                Generate some data
                            </p>
                        </button>
                        <button
                            className={`flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative min-h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                            onClick={() =>
                                handleMessageSend(
                                    'What programming languages do you know?'
                                )
                            }
                        >
                            <img
                                src={cap}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                                What programming languages do you know?
                            </p>
                        </button>
                        {messages &&
                            messages.map((message, index) => (
                                <>
                                    <div
                                        className={`chat-message ${message.role === 'user' ? 'self-end max-w-2/4 bg-yedu-light-gray' : 'self-start w-[90%] bg-yedu-light-green'} transition-all p-2 rounded-md flex flex-col gap-3 text-sm`}
                                        key={index}
                                    >
                                        <div className="flex gap-4 justify-self-start self-start">
                                            <img
                                                src={logo}
                                                alt=""
                                                className={`w-8 ${message.role === 'assistant' ? 'block' : 'hidden'}`}
                                            />
                                            <div className="flex flex-col">
                                                <ReactMarkdown
                                                    children={message.content}
                                                    remarkPlugins={[remarkGfm]}
                                                    className="markdown-content flex flex-col gap-8"
                                                />
                                            </div>
                                        </div>
                                        <span className="self-end font-medium">
                                            {new Date(
                                                message.timestamp
                                            ).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                </>
                            ))}
                        <div
                            className={`self-start w-[10%] text-center text-4xl text-yedu-dark bg-yedu-light-green transition-all rounded-md ${isPending ? 'block' : 'hidden'}`}
                        >
                            <i className="fas fa-ellipsis animate-bounce"> </i>
                        </div>
                    </div>
                    <div
                        className={`flex flex-col gap-10 relative bottom-0 sm:w-full md:w-3/5 py-4 transition-all ${sideMenu ? 'left-[72%] -translate-x-[72%]' : 'left-2/4 -translate-x-2/4'}`}
                    >
                        <div className="w-full m-auto relative py-8">
                            <button
                                className="absolute my-4 left-4 z-10 transition-all hover:scale-150"
                                onClick={() => setOpenFileUpload(true)}
                            >
                                <img src={paperclip} alt="" />
                            </button>
                            <input
                                type="text"
                                className="border w-full absolute left-2/4 -translate-x-2/4 h-14 border-yedu-green rounded-3xl px-12 outline-none text-sm"
                                placeholder="Message Yedu"
                                onChange={(e) => setUserMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                ref={userMessageRef}
                            />
                            <button
                                className="absolute right-4 z-10 my-2 hover:opacity-80 text-2xl"
                                onClick={() =>
                                    handleMessageSend(
                                        userMessageRef.current.value
                                    )
                                }
                                disabled={isPending}
                            >
                                <i
                                    className={`fas ${isPending ? 'fa-spinner animate-spin p-2' : 'fa-arrow-up px-3 py-2'} bg-yedu-green rounded-full text-yedu-white`}
                                ></i>
                            </button>
                        </div>
                        <p className="text-center text-sm">
                            YeduAI can make mistakes. Make sure to check
                            important information.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Chat;
