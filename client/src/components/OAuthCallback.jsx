import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
const env = process.env.NODE_ENV || 'development';
const baseURL =
    env === 'production'
        ? process.env.REACT_APP_PROD_API_URL
        : process.env.REACT_APP_DEV_API_URL;

const OAuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const loginURL = `${baseURL}/users/login`;
    const [authResult, setAuthResult] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const authenticateUser = async () => {
            const params = new URLSearchParams(location.search);
            const socialToken = params.get('socialToken');
            const userEmail = params.get('email');
            const providerId = params.get('provider');

            if (socialToken && userEmail && providerId) {
                axios
                    .post(loginURL, { email: userEmail, password: providerId })
                    .then((response) => {
                        localStorage.setItem('jwt', response.data.token);
                        localStorage.setItem(
                            'isNavigationCollapsed',
                            window.innerWidth > 640
                        );
                        localStorage.setItem('theme', 'light');
                        setAuthResult('Welcome! Authentication successful');
                        setTimeout(() => {
                            window.location.replace('/chat');
                        }, 4000);
                    })
                    .catch((error) => {
                        if (error.response && error.response.status === 401) {
                            setAuthResult(
                                'Incorrect credentials, please try again.'
                            );
                            setIsError(true);
                            setTimeout(() => {
                                window.location.replace('/');
                            }, 4000);
                        }
                    });
            }
        };

        authenticateUser();
    }, [location, loginURL, navigate]);

    return (
        <div className="relative h-screen flex flex-col items-center justify-center gap-12">
            <h1
                className={`text-3xl ${isError ? 'text-yedu-danger' : 'text-yedu-green'}`}
            >
                {authResult}
            </h1>
            <i
                className={`fas fa-spinner animate-spin text-6xl ${isError ? 'text-yedu-danger' : 'text-yedu-green'}`}
            ></i>
        </div>
    );
};

export default OAuthCallback;
