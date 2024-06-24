import React, { useEffect, useState, useRef } from 'react';
import ChatMessage from './ChatMessage';
import logoGray from '../assets/logo-gray.svg';

const messages = [
    { role: 'user', content: "Can you tell me more about your platform?", timestamp: new Date().toISOString(), delay: 1000 },
    { role: 'assistant', content: "Our platform is an autonomous service that creates web applications based on your instructions. It was developed by the team at YeduAI using advanced algorithms to streamline your development process.", timestamp: new Date().toISOString(), delay: 8000 },
    { role: 'user', content: "Wow that sounds interesting. How does it work?", timestamp: new Date().toISOString(), delay: 5000 },
    { role: 'assistant', content: "Our system simplifies the web development process by guiding you from the initial development stages all the way to hosting your site. You just need to tell us what you need, and our system handles the rest.", timestamp: new Date().toISOString(), delay: 8000 },
    { role: 'user', content: "So after I finish giving you my requirements how will I see the website or application?", timestamp: new Date().toISOString(), delay: 5000 },
    { role: 'assistant', content: "Good question. Once you're done providing your requirements, we will share a link with you to view and interact with your newly created website or application.", timestamp: new Date().toISOString(), delay: 8000 },
    { role: 'user', content: "What about hosting?", timestamp: new Date().toISOString(), delay: 5000 },
    { role: 'assistant', content: "Well for hosting, once you are happy with the site and you don't need any modifications, you just give us your domain name and the site will be pointed to it.", timestamp: new Date().toISOString(), delay: 8000 },
    { role: 'user', content: "What is a domain and how do I get it?", timestamp: new Date().toISOString(), delay: 5000 },
    { role: 'assistant', content: "Your domain will be the name for your website, i.e. (www.company.com). You can buy it from us for a streamlined process.", timestamp: new Date().toISOString(), delay: 8000 }
];

const AnimatedChat = () => {
    const [visibleMessages, setVisibleMessages] = useState([]);
    const chatContainerRef = useRef(null);
    const messageIndexRef = useRef(0);

    useEffect(() => {
        const addMessage = () => {
            if (messageIndexRef.current < messages.length) {
                const currentMessage = messages[messageIndexRef.current];
                setVisibleMessages(prev => [...prev, { ...currentMessage, isNew: true }]);
                messageIndexRef.current++;
                
                if (messageIndexRef.current < messages.length) {
                    const nextMessage = messages[messageIndexRef.current];
                    setTimeout(addMessage, nextMessage.delay);
                }
            }
        };

        // Start with the first message
        if (messages.length > 0) {
            setTimeout(addMessage, messages[0].delay);
        }
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [visibleMessages]);

    return (
        <div ref={chatContainerRef} className="bg-yedu-white bg-opacity-10 rounded-lg p-4 max-w-lg w-full mx-auto h-96 overflow-y-auto scrollbar-hide">
            {visibleMessages.map((message, index) => (
                <ChatMessage
                    key={index}
                    message={message}
                    logo={logoGray}
                />
            ))}
        </div>
    );
};

export default AnimatedChat;
