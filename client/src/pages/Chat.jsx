import logo from '../assets/logo.svg';
import plane from '../assets/plane-fly.svg';
import lightbulb from '../assets/lightbulb.svg';
import pen from '../assets/penline.svg';
import cap from '../assets/cap-outline.svg';
import paperclip from '../assets/paper-clip.svg';
import Navigation from '../components/Navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
    const navigate = useNavigate();
    const jwt = localStorage.getItem('jwt');

    function isTokenExpired(token) {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64); // Decodes a string of Base64-encoded data into bytes
        const decoded = JSON.parse(decodedJson);
        const exp = decoded.exp;
        const now = Date.now().valueOf() / 1000;
        return now > exp;
    }

    useEffect(() => {
        const isLoggedIn = () => {
            const token = jwt;
            return token != null && !isTokenExpired(token);
        };

        if (!isLoggedIn()) {
            navigate('user/login');
            toast.warn('You are not logged in', {
                autoClose: 3000,
            });
        }
    }, [jwt, navigate]);
    const userMessageRef = useRef(null);
    const chatPanelRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [isPending, setIsPending] = useState(false);
    const handleMessageSend = (userInput) => {
        if (userMessage || userInput) {
            userMessageRef.current.value = '';
            setUserMessage('');
            setIsPending(true);
            if (chatPanelRef.current) {
                chatPanelRef.current.scrollTop =
                    chatPanelRef.current.scrollHeight;
            }
            setMessages([
                ...messages,
                {
                    content: userInput,
                    role: 'user',
                    timestamp: new Date(),
                },
            ]);
            setTimeout(() => {
                setMessages([
                    ...messages,
                    {
                        content: userInput,
                        role: 'user',
                        timestamp: new Date(),
                    },
                    {
                        content: 'Hello, how can I help you today?',
                        role: 'assistant',
                        timestamp: new Date(),
                    },
                ]);
                setIsPending(false);
            }, 3000);
        } else {
            toast.error('Cannot send an empty message', {
                autoClose: 2000,
            });
        }
        console.log(messages);
    };

    return (
        <section className="p-4 font-montserrat max-h-screen">
            <Navigation />
            <button className="absolute top-2 right-24 py-1 px-2 rounded-full">
                <i className="fas fa-upload text-yedu-gray-text text-2xl"></i>
            </button>
            <img
                src={logo}
                alt=""
                className={`w-12 m-auto mt-20 ${messages.length > 0 ? 'hidden' : 'block'}`}
            />
            <div
                className={`flex flex-col relative min-h-96 transition-all ${messages.length > 0 ? 'mt-16 m-auto' : ''}`}
            >
                <div
                    className={`sm:w-full md:w-3/5 flex items-center m-auto transition-all ${messages.length > 0 ? 'flex-col -mb-4 h-80 overflow-y-scroll gap-8 p-4' : 'flex-row flex-wrap justify-center gap-4'}`}
                    ref={chatPanelRef}
                >
                    <button
                        className={`sm:flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
                        onClick={() => handleMessageSend('Plan a relaxing day')}
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
                        className={`sm:flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
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
                        className={`sm:flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
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
                        className={`sm:flex-auto md:flex-1 border-2 border-yedu-light-gray rounded-3xl py-2 px-4 relative h-28 hover:bg-yedu-dull self-start ${messages.length > 0 ? 'hidden' : 'block'}`}
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
                    {messages.length > 0 &&
                        messages
                            .filter((item) => item.role !== 'system')
                            .map((message, index) => (
                                <div
                                    className={`${message.role === 'user' ? 'self-start' : 'self-end'} max-w-4/5 transition-all count shadow-sm shadow-yedu-dark-gray p-2 rounded-md flex flex-col gap-3 text-sm`}
                                    key={index}
                                >
                                    <div className="flex gap-4">
                                        {message.role === 'assistant' && (
                                            <img
                                                src={logo}
                                                alt=""
                                                className="w-8"
                                            />
                                        )}
                                        {message.content}
                                    </div>
                                    <span className="self-end font-medium">
                                        {message.timestamp.toLocaleDateString(
                                            'en-US',
                                            {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }
                                        )}
                                    </span>
                                </div>
                            ))}
                </div>
                <div className="flex flex-col gap-10 relative bottom-0 left-2/4 -translate-x-2/4 sm:w-full md:w-3/5 py-4">
                    <div className="w-full m-auto relative py-8">
                        <button className="absolute my-4 left-4 z-10">
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
                                handleMessageSend(userMessageRef.current.value)
                            }
                            disabled={isPending}
                        >
                            <i
                                className={`fas ${isPending ? 'fa-spinner animate-spin p-2' : 'fa-arrow-up px-3 py-2'} bg-yedu-green rounded-full text-yedu-white`}
                            ></i>
                        </button>
                    </div>
                    <p className="text-center text-sm">
                        YeduAI can make mistakes. Make sure to check important
                        information.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Chat;
