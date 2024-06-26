import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
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
                        toast.success('Welcome! Authentication successful', {
                            autoClose: 4000,
                        });
                        setTimeout(() => {
                            window.location.replace('/chat');
                        }, 4000);
                    })
                    .catch((error) => {
                        if (error.response && error.response.status === 401) {
                            toast.error(
                                'Incorrect credentials, please try again.',
                                { autoClose: 5000 }
                            );
                            setTimeout(() => {
                                window.location.replace('/');
                            }, 4000);
                        }
                    });
            } else {
                navigate('/');
                toast.error('Failed to log in with OAuth provider', {
                    autoClose: 5000,
                });
            }
        };

        authenticateUser();
    }, [location, loginURL, navigate]);

    return (
        <div className="relative h-screen">
            <i className="fas fa-spinner animate-spin text-6xl text-yedu-green absolute top-2/4 left-2/4"></i>
        </div>
    );
};

export default OAuthCallback;
