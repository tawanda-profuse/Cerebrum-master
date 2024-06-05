import { useEffect, useState } from 'react';
import logoGray from '../assets/logo-gray.svg';
import { useNavigate } from 'react-router-dom';
import TermsOfUse from '../components/TermsOfUse';
import Policy from '../components/Policy';
import { toast } from 'react-toastify';

const GetStarted = () => {
    const jwt = localStorage.getItem("jwt");
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Get Started with Yedu';

        if(jwt){
            navigate("/chat");
            toast.success("Welcome back!", {
                autoClose: 5000
            });
        }
    }, [jwt, navigate]);
    const [termsOfUse, setTermsOfUse] = useState(false);
    const [privacyPolicy, setPrivacyPolicy] = useState(false);
    return (
        <>
            <TermsOfUse show={termsOfUse} setShow={setTermsOfUse} />
            <Policy display={privacyPolicy} setDisplay={setPrivacyPolicy} />
            <section className="flex w-screen h-screen font-montserrat">
                <div className="hidden md:block bg-yedu-light-gray w-2/4"></div>
                <div className="w-full md:w-2/4 flex flex-col justify-center items-center relative">
                    <h1 className="text-yedu-dark text-3xl">Get Started</h1>
                    <div className="flex justify-center gap-4 mt-3 flex-wrap">
                        <button
                            className="bg-yedu-green py-2 px-4 text-white rounded-md border-none outline-none text-yedu-white w-32 hover:opacity-80"
                            onClick={() => navigate('/user/login')}
                        >
                            Login
                        </button>
                        <button
                            className="bg-yedu-green py-2 px-4 text-white rounded-md border-none outline-none text-yedu-white w-32 hover:opacity-80"
                            onClick={() => navigate('/user/signup')}
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
                            <button
                                className="text-yedu-dark-gray underline hover:no-underline"
                                onClick={() => {
                                    setTermsOfUse(true);
                                    setPrivacyPolicy(false);
                                }}
                            >
                                Terms of Use
                            </button>
                            <p className="text-yedu-dark-gray">|</p>
                            <button
                                className="text-yedu-dark-gray underline hover:no-underline"
                                onClick={() => {
                                    setPrivacyPolicy(true);
                                    setTermsOfUse(false);
                                }}
                            >
                                Privacy Policy
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default GetStarted;
