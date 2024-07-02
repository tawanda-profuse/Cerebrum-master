import io from 'socket.io-client';
const env = process.env.NODE_ENV || 'development';
const baseURL = env === 'production' ? process.env.REACT_APP_PROD_API_URL : process.env.REACT_APP_DEV_API_URL;

let socket;

export const getSocket = () => {
    if (!socket) {
        const jwt = localStorage.getItem('jwt'); // Retrieve the JWT from localStorage
        socket = io(baseURL, {
            auth: {
                token: jwt, // Pass the token in the auth option
            },
        });
    }
    return socket;
};
