import logo from '../assets/logo.svg';
import plane from '../assets/plane-fly.svg';
import lightbulb from '../assets/lightbulb.svg';
import pen from '../assets/penline.svg';
import cap from '../assets/cap-outline.svg';
import Navigation from '../components/Navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import CreateProject from '../components/Modals/CreateProject';
import FileUpload from '../components/Modals/FileManagement/FileUpload';
import ConfirmDeleteProject from '../components/Modals/ConfirmDeleteProject';
import { getSocket } from '../socket';
import ChatMessage from '../components/ChatMessage';

const Chat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const jwt = localStorage.getItem('jwt');
    const currentProject = localStorage.getItem('selectedProjectId');
    const [openCreateProject, setOpenCreateProject] = useState(false);
    const isNavigationCollapsed =
        localStorage.getItem('isNavigationCollapsed') === 'true';
    const [sideMenu, setSideMenu] = useState(isNavigationCollapsed);
    const [openFileUpload, setOpenFileUpload] = useState(false);
    const userMessageRef = useRef(null);
    const chatPanelRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [openConfirmDelete, setConfirmDelete] = useState(false);
    const deleteProjectRef = useRef(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Flag for initial data load completion
    const [projectStatus, setProjectStatus] = useState(false);
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
        document.title = 'Yedu Studio';

        const isLoggedIn = () => {
            const token = jwt;
            return token != null && !isTokenExpired(token);
        };

        const checkProjects = () => {
            if (!currentProject) {
                navigate('/chat');
            } else {
                navigate(`/chat/${currentProject}`);
            }
        };

        if (!isLoggedIn()) {
            localStorage.clear();
            navigate('/');
            toast.info('You are not logged in', { autoClose: 5000 });
        } else {
            checkProjects();
        }

        if (currentProject) {
            // Join the room for the current project ID
            socket.emit('join', currentProject);
        }

        // Listen for the 'initial-data' event
        socket.on('initial-data', (data) => {
            if (currentProject) {
                setMessages(
                    data.messages.map((msg) => ({ ...msg, isNew: false }))
                ); // Set isNew to false for initial messages
                setInitialLoadComplete(true); // Mark initial data load as complete
            }
        });

        // Listen for new messages
        socket.on('new-message', (newMessage) => {
            setProjectStatus(newMessage.projectProcessing); // Update project status

            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    role: newMessage.role,
                    content: newMessage.content,
                    timestamp: new Date().toISOString(),
                    imageUrl: newMessage.imageUrl || null,
                    isNew: true, // Mark new messages
                },
            ]); // Correctly append new messages

            if (newMessage.role === 'assistant') {
                // Clears the user input and stops the pending animation
                setIsPending(false);
            }

            if (newMessage.imageUrl) {
                setIsPending(true);
            }

            if (newMessage.projectProcessing) {
                setIsPending(true);
            }
        });

        return () => {
            // Cleaning up socket listeners
            socket.off('initial-data');
            socket.off('new-message');
        };
    }, [jwt, navigate, currentProject, socket, isNavigationCollapsed]);

    useEffect(() => {
        if (chatPanelRef.current) {
            // Scroll to the bottom of the chat panel when messages change
            scrollToBottom();
        }
    }, [messages]);

    const handleMessageSend = async (message) => {
        if (!currentProject) {
            toast.info(
                'There is no project selected! Create a project or select one of your previous projects.'
            );
            return;
        }

        if (!message.trim()) {
            toast.error('Cannot send an empty message');
            return; // Don't send empty messages
        }

        if (userMessageRef.current.value) {
            userMessageRef.current.value = '';
        }

        try {
            setIsPending(true); // Set pending status
            // If message sent successfully, emit event to server
            socket.emit('send-message', {
                message: message,
                projectId: currentProject,
            });
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again later.');
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleMessageSend(userMessage);
        }
    };

    const scrollToBottom = () => {
        chatPanelRef.current.scrollTop = chatPanelRef.current.scrollHeight;
    };

    // Select all anchor tags
    const links = document.querySelectorAll('a');

    links.forEach((link) => {
        link.setAttribute('target', '_blank');
    });

    return (
        <>
            <CreateProject
                display={openCreateProject}
                setDisplay={setOpenCreateProject}
            />
            <FileUpload
                display={openFileUpload}
                setDisplay={setOpenFileUpload}
            />
            <ConfirmDeleteProject
                display={openConfirmDelete}
                setDisplay={setConfirmDelete}
                deleteProjectRef={deleteProjectRef}
            />
            <Navigation
                sideMenu={isNavigationCollapsed}
                setSideMenu={setSideMenu}
                currentProject={id}
                confirmDeleteDisplay={openConfirmDelete}
                setConfirmDeleteDisplay={setConfirmDelete}
                socket={socket}
            />
            <section
                className={`
            h-screen 
            ${messages.length > 0 ? 'pt-[4em]' : 'pt-[1em]'} 
            overflow-hidden 
            bg-gradient-to-br 
            from-gray-100 via-gray-200 to-green-50
            dark:bg-[#28282B] dark:bg-opacity-95
            dark:from-transparent dark:via-transparent dark:to-transparent
            flex flex-col
        `}
            >
                <div
                    className={`flex-grow overflow-y-auto transition-all ${sideMenu ? 'md:translate-x-[12%]' : ''}`}
                >
                    {messages.length <= 0 && (
                        <img
                            src={logo}
                            alt=""
                            className="w-20 m-auto mt-8 hover:animate-pulse"
                        />
                    )}
                    <div
                        className={`w-[95%] md:w-full m-auto scroll-smooth scrollbar-thin scrollbar-thumb-yedu-green scrollbar-track-yedu-dull relative pt-12 pb-24 ${messages.length > 0 ? 'h-full overflow-y-scroll' : ''}`}
                        ref={chatPanelRef}
                    >
                        <div
                            className={`flex w-full md:w-3/5 transition-all m-auto relative ${messages.length > 0 ? 'flex-col gap-8' : 'justify-center gap-4'}`}
                        >
                            {messages.length <= 0 && (
                                <>
                                    <button
                                        className={`hidden md:block flex-1 border-2 border-gray-400 rounded-3xl mt-16 py-2 px-4 relative min-h-28 hover:bg-yedu-light-green dark:hover:bg-green-500 self-start`}
                                        onClick={() => {
                                            handleMessageSend(
                                                'What can you do?'
                                            );
                                        }}
                                    >
                                        <img
                                            src={plane}
                                            alt=""
                                            className="absolute top-2 left-2"
                                        />
                                        <p className="text-yedu-gray-text dark:text-yedu-white text-sm mt-8">
                                            What can you do?
                                        </p>
                                    </button>
                                    <button
                                        className={`hidden md:block flex-1 border-2 border-gray-400 rounded-3xl mt-16 py-2 px-4 relative min-h-28 hover:bg-yedu-light-green dark:hover:bg-green-500 self-start`}
                                        onClick={() => {
                                            handleMessageSend(
                                                'Give me some ideas'
                                            );
                                        }}
                                    >
                                        <img
                                            src={lightbulb}
                                            alt=""
                                            className="absolute top-2 left-2"
                                        />
                                        <p className="text-yedu-gray-text dark:text-yedu-white text-sm mt-8">
                                            Give me some ideas
                                        </p>
                                    </button>
                                    <button
                                        className={`hidden md:block flex-1 border-2 border-gray-400 rounded-3xl mt-16 py-2 px-4 relative min-h-28 hover:bg-yedu-light-green dark:hover:bg-green-500 self-start`}
                                        onClick={() => {
                                            handleMessageSend(
                                                'Generate some data'
                                            );
                                        }}
                                    >
                                        <img
                                            src={pen}
                                            alt=""
                                            className="absolute top-2 left-2"
                                        />
                                        <p className="text-yedu-gray-text dark:text-yedu-white text-sm mt-8">
                                            Generate some data
                                        </p>
                                    </button>
                                    <button
                                        className={`hidden md:block flex-1 border-2 border-gray-400 rounded-3xl mt-16 py-2 px-4 relative min-h-28 hover:bg-yedu-light-green dark:hover:bg-green-500 self-start`}
                                        onClick={() => {
                                            handleMessageSend(
                                                'What programming languages do you know?'
                                            );
                                        }}
                                    >
                                        <img
                                            src={cap}
                                            alt=""
                                            className="absolute top-2 left-2"
                                        />
                                        <p className="text-yedu-gray-text dark:text-yedu-white text-sm mt-8">
                                            What programming languages do you
                                            know?
                                        </p>
                                    </button>
                                </>
                            )}
                            {messages &&
                                messages.map((message, index) => (
                                    <ChatMessage
                                        key={index}
                                        message={message}
                                        logo={logo}
                                        initialLoadComplete={
                                            initialLoadComplete
                                        }
                                    />
                                ))}
                            {/* Ellipsis animation */}
                            <div
                                className={`self-start w-[10%] text-center text-4xl text-yedu-dark bg-yedu-light-green transition-all rounded-md ${isPending ? 'block' : 'hidden'}`}
                            >
                                <i className="fas fa-ellipsis animate-bounce">
                                    {' '}
                                </i>
                            </div>
                            {/* Scroll down button */}
                            {messages.length > 0 && (
                                <button
                                    className={`sticky left-2/4 bottom-0 rounded-full bg-green-500 text-yedu-dull w-10 py-1 text-xl transition-all hover:opacity-80 z-50`}
                                    onClick={scrollToBottom}
                                >
                                    <i className="fas fa-arrow-down"></i>
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Chat input area */}
                    <div
    className="fixed bottom-0 left-2/4 -translate-x-2/4 flex flex-col gap-2 w-4/5 md:w-3/5 m-auto mt-8 pb-4 pt-2 "
>
    <div className="flex items-center justify-center w-full md:w-[90%] relative m-auto">
        <button
            className="transition-all hover:scale-125 absolute left-4 z-10"
            onClick={() => {
                if (currentProject) {
                    setOpenFileUpload(true);
                } else {
                    toast.info(
                        'You need to create or select a project first'
                    );
                }
            }}
        >
            <i className="fas fa-paperclip text-2xl text-[black] dark:text-yedu-white"></i>
        </button>
        <textarea
            tabIndex={0}
            type="text"
            className="bg-gray-100/70 dark:bg-[#28282B]/70 dark:text-white w-[100%] min-h-10 pt-4 border-0 rounded-3xl px-12 outline-none text-[1rem] resize-none max-h-56 placeholder:text-yedu-gray-text dark:placeholder:text-yedu-dark-gray shadow-inner"
            spellCheck={false}
            placeholder="Message Yedu"
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={userMessageRef}
            disabled={isPending}
        />
        <button
            className="absolute right-4 hover:opacity-80 text-2xl transition-all duration-300"
            onClick={() => handleMessageSend(userMessage)}
            disabled={isPending}
            title="Send message"
        >
            <i
                className={`fas ${isPending ? 'fa-spinner animate-spin p-2' : 'fa-chevron-right px-3 py-2'} bg-green-500 opacity-[0.7] rounded-full text-yedu-white`}
            ></i>
        </button>
    </div>
    <p className="text-center text-xs text-yedu-gray-text dark:text-yedu-white">
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
