import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import GetStarted from '../pages/GetStarted';
import axios from 'axios';

const OAuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const loginURL = 'http://localhost:8000/users/login/google';
    const jwt = localStorage.getItem('jwt');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const socialToken = params.get('socialToken');
        const userEmail = params.get('email');
        // const handleLogIn = (email, password) => {
        //     if (email && password) {
        //         axios
        //             .post(loginURL, { email, password })
        //             .then((response) => {
        //                 localStorage.setItem('jwt', response.data.token);
        //                 localStorage.setItem(
        //                     'isNavigationCollapsed',
        //                     window.innerWidth > 640
        //                 );
        //                 localStorage.setItem('theme', 'light');
        //                 toast.success(
        //                     'Authentication successful',
        //                     {
        //                         autoClose: 4000,
        //                     }
        //                 );
        //                 setTimeout(() => {
        //                     window.location.replace('/chat');
        //                 }, 4000);
        //             })
        //             .catch((error) => {
        //                 if (error.response && error.response.status === 401) {
        //                     toast.error(
        //                         'Incorrect credentials, please try again.',
        //                         { autoClose: 5000 }
        //                     );
        //                 }
        //             });
        //     } else {
        //         toast.warn('Email and password are required', {
        //             autoClose: 3000,
        //         });
        //     }
        // };

        if (socialToken && userEmail) {
            // handleLogIn(userEmail, token);
            (async function () {
                if (userEmail && socialToken) {
                    axios
                        .post(
                            loginURL,
                            { email: userEmail, password: socialToken },
                            { headers: { Authorization: `Bearer ${jwt}` } }
                        )
                        // .then((response) => {
                        //     localStorage.setItem('jwt', response.data.token);
                        //     localStorage.setItem(
                        //         'isNavigationCollapsed',
                        //         window.innerWidth > 640
                        //     );
                        //     localStorage.setItem('theme', 'light');
                        //     toast.success('Authentication successful', {
                        //         autoClose: 4000,
                        //     });
                        //     setTimeout(() => {
                        //         window.location.replace('/chat');
                        //     }, 4000);
                        // })
                        // .catch((error) => {
                        //     if (
                        //         error.response &&
                        //         error.response.status === 401
                        //     ) {
                        //         toast.error(
                        //             'Incorrect credentials, please try again.',
                        //             { autoClose: 5000 }
                        //         );
                        //     }
                        // });
                } else {
                    toast.warn('Email and password are required', {
                        autoClose: 3000,
                    });
                }
            })();
            // grabbing data should happen
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
