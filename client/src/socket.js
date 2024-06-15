import io from 'socket.io-client';

let socket;

export const getSocket = () => {
    if (!socket) {
        const jwt = localStorage.getItem('jwt'); // Retrieve the JWT from localStorage
        socket = io('http://localhost:8000', {
            auth: {
                token: jwt, // Pass the token in the auth option
            },
        });
    }
    return socket;
};
