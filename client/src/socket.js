import io from 'socket.io-client';

const baseURL = process.env.VITE_NODE_ENV === 'production' 
  ? 'https://yeduai.io' 
  : process.env.VITE_DEV_API_URL;

let socket;

export const getSocket = () => {
    if (!socket) {
        const jwt = localStorage.getItem('jwt');
        socket = io(baseURL, {
            path: '/api_v2/socket.io',
            auth: {
                token: jwt,
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('Socket connected successfully');
        });
        
        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    return socket;
};