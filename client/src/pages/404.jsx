import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { useEffect } from 'react';
const NotFound = () => {
    const navigate = useNavigate();
    useEffect(() => {
        document.title = 'Page Not Found';
    }, []);
    return (
        <section className="h-screen w-screen overflow-hidden dark-applied-body">
            <button
                className="absolute top-2 left-2 rounded-full bg-yedu-light-green py-2 px-3 text-xl transition-all z-50 hover:scale-125"
                title="Back to home"
                onClick={() => navigate('/')}
            >
                <i className="fas fa-home"></i>
            </button>
            <div className="flex-col md:flex-row flex w-full h-full justify-evenly items-center form-entry">
                <img
                    src={logo}
                    alt="Yedu logo"
                    className="w-1/4 animate-pulse hover:animate-none"
                />
                <div>
                    <h1 className="text-center font-bold text-4xl mt-16 mb-8">
                        Coming Soon
                    </h1>
                    <p className="text-lg text-center text-yedu-gray-text font-semibold">
                        The page you have requested does not exist.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default NotFound;
