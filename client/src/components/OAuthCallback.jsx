import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';

const OAuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
            localStorage.setItem('jwt', token);
            localStorage.setItem('isNavigationCollapsed', true);
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

    return <Loading />;
};

export default OAuthCallback;
