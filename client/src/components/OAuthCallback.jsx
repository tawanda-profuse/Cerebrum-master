import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const OAuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const loginURL = 'http://localhost:8000/users/login/google';

    useEffect(() => {
        const authenticateUser = async () => {
            const params = new URLSearchParams(location.search);
            const socialToken = params.get('socialToken');
            const userEmail = params.get('email');

            if (socialToken && userEmail) {
                try {
                    const response = await axios.post(
                        loginURL,
                        { email: userEmail, password: socialToken },
                        { headers: { Authorization: `Bearer ${socialToken}` } }
                    );
                    localStorage.setItem('jwt', response.data.token);
                    localStorage.setItem(
                        'isNavigationCollapsed',
                        window.innerWidth > 640
                    );
                    localStorage.setItem('theme', 'light');
                    toast.success('Authentication successful', {
                        autoClose: 4000,
                    });
                    setTimeout(() => {
                        window.location.replace('/chat');
                    }, 4000);
                } catch (error) {
                    if (error.response && error.response.status === 401) {
                        toast.error(
                            'Incorrect credentials, please try again.',
                            { autoClose: 5000 }
                        );
                    } else {
                        toast.error('Failed to authenticate', {
                            autoClose: 5000,
                        });
                    }
                }
            } else {
                navigate('/');
                toast.error('Failed to log in with OAuth provider', {
                    autoClose: 5000,
                });
            }
        };

        authenticateUser();
    }, [location, navigate]);

    return <div>Loading...</div>;
};

export default OAuthCallback;
