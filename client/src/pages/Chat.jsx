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
import CreateProject from '../components/Modals/CreateProject';
import FileUpload from '../components/Modals/FileUpload';
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
    const [scrollButton, setScrollButton] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Flag for initial data load completion
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

        setSideMenu(isNavigationCollapsed);

        const isLoggedIn = () => {
            const token = jwt;
            return token != null && !isTokenExpired(token);
        };

        const checkProjects = () => {
            if (!currentProject) {
                navigate('/chat');
                setMessages([]);
                setUserMessage('');
            } else {
                navigate(`/chat/${currentProject}`);
            }
        };

        if (!isLoggedIn()) {
            localStorage.clear();
            navigate('/');
            toast.warn('You are not logged in', {
                autoClose: 3000,
            });
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
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    role: newMessage.role,
                    content: newMessage.content,
                    timestamp: new Date().toISOString(),
                    isNew: true, // Mark new messages
                },
            ]); // Correctly append new messages

            if (newMessage.role === 'assistant') {
                // Clears the user input and stops the pending animation
                setUserMessage('');
                setIsPending(false);
            }
        });

        return () => {
            // Cleaning up socket listeners
            socket.off('initial-data');
            socket.off('new-message');
        };
    }, [jwt, navigate, currentProject, socket, isNavigationCollapsed]);

    // Scroll to the bottom of the chat panel when messages change
    useEffect(() => {
        if (chatPanelRef.current) {
            chatPanelRef.current.scrollTop = chatPanelRef.current.scrollHeight;
        }

        chatPanelRef.current.addEventListener('scroll', function () {
            if (
                chatPanelRef.current.scrollTop <
                    chatPanelRef.current.scrollHeight * 0.8 &&
                chatPanelRef.current.scrollTop !==
                    chatPanelRef.current.scrollHeight
            ) {
                setScrollButton(true);
            } else {
                setScrollButton(false);
            }
        });
        const lastMessage =
            messages.length > 0 ? messages[messages.length - 1] : '';
        if (
            messages.length > 0 &&
            (lastMessage.content ===
                "Fantastic! I've got all the details I need. Time to start building your amazing project! 😊" ||
                lastMessage.content ===
                    'Got it! I am now modifying the existing application, wait a while....')
        ) {
            setIsPending(true);
        } 
    }, [messages]);

    const handleMessageSend = async () => {
        userMessageRef.current.value = '';
        if (!currentProject) {
            toast.info(
                'There is no project selected! Create a project or select one of your previous projects.'
            );
            return;
        }

        if (!userMessage.trim()) {
            toast.error('Cannot send an empty message');
            return; // Don't send empty messages
        }

        try {
            setIsPending(true); // Set pending status
            // If message sent successfully, emit event to server
            socket.emit('send-message', {
                message: userMessage,
                projectId: currentProject,
            });

            setUserMessage('');
        } catch (error) {
            setUserMessage('');
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again later.');
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
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
            <section className="h-screen overflow-hidden dark-applied-body">
                <Navigation
                    sideMenu={isNavigationCollapsed}
                    setSideMenu={setSideMenu}
                    currentProject={id}
                    confirmDeleteDisplay={openConfirmDelete}
                    setConfirmDeleteDisplay={setConfirmDelete}
                    deleteProjectRef={deleteProjectRef}
                />
                <img
                    src={logo}
                    alt=""
                    className={`w-12 m-auto mt-20 hover:animate-spin ${messages.length > 0 ? 'hidden' : 'block'}`}
                />
                <div
                    className={`w-full p-4 scroll-smooth scrollbar-thin scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-scroll h-[70%]  ${messages.length > 0 ? 'my-14' : ''}`}
                    ref={chatPanelRef}
                >
                    <div
                        className={`flex w-full md:w-3/5 transition-all m-auto relative ${sideMenu ? 'translate-x-[15%]' : 'translate-x-0'} ${messages.length > 0 ? 'flex-col gap-8' : 'flex-row flex-wrap justify-center gap-4 mt-20'}`}
                    >
                        <button
                            className={`hidden md:block flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative min-h-28 hover:bg-yedu-dull self-start yeduDarkHover ${messages.length > 0 ? 'md:hidden' : 'md:block'}`}
                            onClick={() => {
                                setUserMessage('What can you do?');
                                handleMessageSend(userMessage);
                            }}
                        >
                            <img
                                src={plane}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8">
                                What can you do?
                            </p>
                        </button>
                        <button
                            className={`hidden md:block flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative min-h-28 hover:bg-yedu-dull self-start yeduDarkHover ${messages.length > 0 ? 'md:hidden' : 'md:block'}`}
                            onClick={() => {
                                setUserMessage('Give me some ideas');
                                handleMessageSend(userMessage);
                            }}
                        >
                            <img
                                src={lightbulb}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8">
                                Give me some ideas
                            </p>
                        </button>
                        <button
                            className={`hidden md:block flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative min-h-28 hover:bg-yedu-dull self-start yeduDarkHover ${messages.length > 0 ? 'md:hidden' : 'md:block'}`}
                            onClick={() => {
                                setUserMessage('Generate some data');
                                handleMessageSend(userMessage);
                            }}
                        >
                            <img
                                src={pen}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8">
                                Generate some data
                            </p>
                        </button>
                        <button
                            className={`hidden md:block flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative min-h-28 hover:bg-yedu-dull self-start yeduDarkHover ${messages.length > 0 ? 'md:hidden' : 'md:block'}`}
                            onClick={() => {
                                setUserMessage(
                                    'What programming languages do you know?'
                                );
                                handleMessageSend(userMessage);
                            }}
                        >
                            <img
                                src={cap}
                                alt=""
                                className="absolute top-2 left-2"
                            />
                            <p className="text-yedu-gray-text text-sm mt-8">
                                What programming languages do you know?
                            </p>
                        </button>
                        {messages &&
                            messages.map((message, index) => (
                                <ChatMessage
                                    key={index}
                                    message={message}
                                    logo={logo}
                                    initialLoadComplete={initialLoadComplete}
                                />
                            ))}
                        <button
                            className={`sticky left-2/4 bottom-0 rounded-full bg-yedu-green text-yedu-dull w-10 py-1 text-xl animate-bounce transition-all hover:opacity-80 ${scrollButton && messages.length > 0 ? 'block' : 'hidden'}`}
                            onClick={scrollToBottom}
                        >
                            <i className="fas fa-arrow-down"></i>
                        </button>
                        <div
                            className={`self-start w-[10%] text-center text-4xl text-yedu-dark bg-yedu-light-green transition-all rounded-md ${isPending ? 'block' : 'hidden'}`}
                        >
                            <i className="fas fa-ellipsis animate-bounce"> </i>
                        </div>
                    </div>
                </div>
                <div
                    className={`flex flex-col gap-2 fixed mb-4 bottom-0 w-4/5 md:w-3/5 transition-all ${sideMenu ? 'left-[72%] -translate-x-[72%]' : 'left-2/4 -translate-x-2/4'}`}
                >
                    <div className="flex items-center justify-center w-full md:w-[90%] relative m-auto">
                        <button
                            className="transition-all hover:scale-150 absolute left-4 z-10"
                            onClick={() => {
                                if (currentProject) {
                                    setOpenFileUpload(true);
                                } else {
                                    toast.warn('There is no project open.', {
                                        autoClose: 5000,
                                    });
                                }
                            }}
                        >
                            <img src={paperclip} alt="" />
                        </button>
                        <textarea
                            tabIndex={0}
                            type="text"
                            className="bg-[#f0f0f0] textInput w-[100%] min-h-10 pt-4 border-0 rounded-3xl px-12 outline-none text-[1rem] resize-none max-h-56 placeholder:text-yedu-gray-text"
                            spellCheck={false}
                            placeholder="Message Yedu then click send or press 'Enter'"
                            onChange={(e) => setUserMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            ref={userMessageRef}
                            disabled={isPending}
                        />
                        <button
                            className="absolute right-4 hover:opacity-80 text-2xl"
                            onClick={() =>
                                handleMessageSend(userMessageRef.current.value)
                            }
                            disabled={isPending}
                            title="Send message"
                        >
                            <i
                                className={`fas ${isPending ? 'fa-spinner animate-spin p-2' : 'fa-chevron-right px-3 py-2'} bg-yedu-green opacity-[0.7] rounded-full text-yedu-white`}
                            ></i>
                        </button>
                    </div>
                    <p className="text-center text-xs text-yedu-gray-text">
                        YeduAI can make mistakes. Make sure to check important
                        information.
                    </p>
                </div>
            </section>
        </>
    );
};

export default Chat;
