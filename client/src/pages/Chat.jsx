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
import io from 'socket.io-client';
const socket = io.connect('http://localhost:8000');

const Chat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const jwt = localStorage.getItem('jwt');
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

        // let intervalId;
        const fetchMessages = async () => {
            let url = 'http://localhost:8000/api/messages';

            try {
                if (currentProject) {
                    url += `?projectId=${currentProject}`;

                    const response = await axios.get(url, {
                        headers: { Authorization: `Bearer ${jwt}` },
                    });

                    const data = response.data;
                    setMessages(data.messages);
                }
            } catch (error) {
                console.error(error);
                toast.error(`${error.response.data}`);
            }
        };

        fetchMessages();

        // Join the room for the current user
        socket.emit('join', jwt);

        // Listen for new messages
        socket.on('new-message', (newMessage) => {
            setMessages((prevData) => ({
                ...prevData,
                messages: [...prevData.messages, newMessage],
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, [jwt, navigate, currentProject, messages]);

    const handleMessageSend = async (userInput) => {
        setIsPending(true);
        const url = 'http://localhost:8000/api/messages/cerebrum_v1';
        setUserMessage('');
        userMessageRef.current.value = '';
        if (!currentProject) {
            toast.error('Please create a project first', { autoClose: 5000 });
            setOpenProjectPrompt(true);
            return;
        }
        if (userMessage || userInput) {
            if (chatPanelRef.current) {
                chatPanelRef.current.scrollTop =
                    chatPanelRef.current.scrollHeight;
            }

            try {
                await axios.post(
                    url,
                    { message: userInput, projectId: currentProject },
                    { headers: { Authorization: `Bearer ${jwt}` } }
                );

                socket.emit('send-message', {
                    userId: jwt,
                    message: userInput,
                });
            } catch (error) {
                console.error('Error:', error);
                toast.error(`${error}`, {
                    autoClose: 5000,
                });
            }
        } else {
            toast.error('Cannot send an empty message', {
                autoClose: 2000,
            });
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
                            className={`flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                            onClick={() =>
                                handleMessageSend('Plan a relaxing day')
                            }
                        >
                            <img
                                src={plane}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                                Plan a relaxing day
                            </p>
                        </button>
                        <button
                            className={`flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                            onClick={() =>
                                handleMessageSend(
                                    'Morning routine for productivity'
                                )
                            }
                        >
                            <img
                                src={lightbulb}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                                Morning routine for productivity
                            </p>
                        </button>
                        <button
                            className={`flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                            onClick={() =>
                                handleMessageSend('Content calendar for TikTok')
                            }
                        >
                            <img
                                src={pen}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                                Content calendar for TikTok
                            </p>
                        </button>
                        <button
                            className={`flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                            onClick={() =>
                                handleMessageSend(
                                    'Explain nostalgia to a kindergartener'
                                )
                            }
                        >
                            <img
                                src={cap}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8 font-bold">
                                Explain nostalgia to a kindergartener
                            </p>
                        </button>
                        {messages &&
                            messages.map((message, index) => (
                                <div
                                    className={`chat-message ${message.role === 'user' ? 'self-end max-w-2/4 bg-yedu-light-gray' : 'self-start w-[90%]'} transition-all count p-2 rounded-md flex flex-col gap-3 text-sm`}
                                    key={index}
                                >
                                    <div className="flex gap-4">
                                        <img
                                            src={logo}
                                            alt=""
                                            className={`w-8 ${message.role === 'assistant' ? 'block' : 'hidden'}`}
                                        />
                                        <div className="flex flex-col gap-8">
                                            <ReactMarkdown
                                                children={message.content}
                                                remarkPlugins={[remarkGfm]}
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
                            ))}
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
