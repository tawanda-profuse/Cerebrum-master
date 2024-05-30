import logoGray from '../assets/logo-gray.svg';
import { Link, useNavigate } from 'react-router-dom';

const GetStarted = () => {
    const navigate = useNavigate();
    return (
        <section className="flex w-screen h-screen font-montserrat">
            <div className="hidden md:block bg-yedu-light-gray w-2/4"></div>
            <div className="w-full md:w-2/4 flex flex-col justify-center items-center relative">
                <h1 className="text-yedu-dark text-3xl">Get Started</h1>
                <div className="flex justify-center gap-4 mt-3 flex-wrap">
                    <button
                        className="bg-yedu-green py-2 px-4 text-white rounded-md border-none outline-none text-yedu-white w-32 hover:opacity-80"
                        onClick={() => navigate('/users/login')}
                    >
                        Login
                    </button>
                    <button
                        className="bg-yedu-green py-2 px-4 text-white rounded-md border-none outline-none text-yedu-white w-32 hover:opacity-80"
                        onClick={() => navigate('/users/signup')}
                    >
                        Sign up
                    </button>
                </div>
                <div className="absolute bottom-4">
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <img
                            src={logoGray}
                            alt=""
                            className="w-8 fill-yedu-light-gray"
                        />
                        <h3 className="text-yedu-dark-gray font-medium">
                            YeduAI
                        </h3>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <Link
                            to=""
                            className="text-yedu-dark-gray underline hover:no-underline"
                        >
                            Terms of Use
                        </Link>
                        <p className="text-yedu-dark-gray">|</p>
                        <Link
                            to=""
                            className="text-yedu-dark-gray underline hover:no-underline"
                        >
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GetStarted;
