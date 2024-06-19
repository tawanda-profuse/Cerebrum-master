import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import GetStarted from '../pages/GetStarted';

const OAuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
            localStorage.setItem('jwt', token);
            localStorage.setItem('isNavigationCollapsed', window.innerWidth > 640 ? true : false);
            localStorage.setItem('theme', 'light');
            navigate('/chat');
            toast.success('Successfully logged in', {
                autoClose: 4000,
            });
        } else {
            navigate('/');
            toast.error('Failed to log in with OAuth provider', {
                autoClose: 5000,
            });
        }
    }, [location, navigate]);

    return <GetStarted />;
};

export default OAuthCallback;
