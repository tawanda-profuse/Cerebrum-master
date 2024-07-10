import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./loader.css";
import axios from "axios";
const baseURL = process.env.VITE_NODE_ENV === 'production' 
  ? process.env.VITE_PROD_API_URL 
  : process.env.VITE_DEV_API_URL;

const OAuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const loginURL = `${baseURL}/users/login`;
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
                            window.innerWidth > 768
                        );
                        localStorage.setItem(
                            'theme',
                            window.innerWidth <= 768 ? 'dark' : 'light'
                        );
                        localStorage.setItem('projectProcessing', false);
                        setTimeout(() => {
                            window.location.replace('/chat');
                        }, 4000);
                    })
                    .catch((error) => {
                        if (error.response && error.response.status === 401) {
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
            <div className={`loader ${isError ? 'error' : ''}`}>
                <div className="pulse"></div>
            </div>
        </div>
    );
};

export default OAuthCallback;
