import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
    const navigate = useNavigate();
    const currentProject = localStorage.getItem('selectedProjectId');

    useEffect(() => {
        document.title = 'Yedu Pricing';
    }, []);
    const [toggle, setToggle] = useState(false);
    const handleHomeNavigation = () => {
        if (currentProject) {
            navigate(`/chat/${currentProject}`);
        } else {
            navigate('/chat');
        }
    };

    return (
        <section className="h-screen scroll-smooth scrollbar-thin scrollbar-thumb-yedu-green scrollbar-track-yedu-dull overflow-y-scroll relative dark-applied-body">
            <button
                className="absolute top-2 left-2 rounded-full bg-yedu-light-green py-2 px-3 transition-all hover:scale-110"
                title="Back to home"
                onClick={handleHomeNavigation}
            >
                <i className="fas fa-home"></i>
            </button>
            <button
                className="absolute top-2 right-2 rounded-full bg-yedu-light-green py-2 px-3 transition-all hover:scale-110"
                title="Back to settings page"
                onClick={() => navigate('/user/settings')}
            >
                <i className="fas fa-user-gear"></i>
            </button>
            <h1 className="text-center font-bold text-4xl mt-16 mb-8 form-entry">
                Our Pricing
            </h1>
            <span className="m-auto w-2/4 flex flex-wrap justify-center gap-2 items-center form-entry">
                <p className="text-sm text-yedu-gray-text font-semibold">
                    Billed Monthly
                </p>{' '}
                <i
                    className={`text-yedu-green text-5xl cursor-pointer ${toggle ? 'fas fa-toggle-off' : 'fas fa-toggle-on'}`}
                    onClick={() => setToggle(!toggle)}
                ></i>{' '}
                <p className="text-yedu-green">Billed Yearly (save 15%)</p>
            </span>
            <div className="flex gap-4 flex-wrap justify-center w-4/5 my-16 m-auto form-entry">
                <div className="sm:flex-auto md:flex-1 shadow-sm shadow-yedu-green rounded-lg p-6 dark-applied">
                    <h3 className="font-bold text-xl my-2">Free</h3>
                    <h3 className="font-bold text-xl my-2">$0</h3>
                    <p className="text-yedu-gray-text text-sm">
                        Description of the tier list will go here, copy should
                        be concise and impactful
                    </p>
                    <hr className="my-8 text-yedu-dark-gray" />
                    <div className="flex flex-col gap-3 my-4">
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Amazing feature one
                        </span>
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Wonderful feature two
                        </span>
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Priceless feature three
                        </span>
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Splended feature four
                        </span>
                    </div>
                    <button className="my-4 outline-none text-center border-2 border-yedu-green text-yedu-green font-medium bg-yedu-white rounded-md w-full py-2 px-4 hover:bg-yedu-green hover:text-yedu-white">
                        Try for Free
                    </button>
                </div>
                <div className="sm:flex-auto md:flex-1 shadow-sm shadow-yedu-green rounded-lg p-6 dark-applied">
                    <h3 className="font-bold text-xl my-2">Pro</h3>
                    <h3 className="font-bold text-xl my-2">
                        $12{' '}
                        <span className="text-sm text-yedu-gray-text">
                            / month
                        </span>
                    </h3>
                    <p className="text-yedu-gray-text text-sm">
                        Description of the tier list will go here, copy should
                        be concise and impactful
                    </p>
                    <hr className="my-8 text-yedu-dark-gray" />
                    <p className="text-yedu-gray-text">
                        Everything in the Free plan, plus
                    </p>
                    <div className="flex flex-col my-4 gap-3">
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Amazing feature one
                        </span>
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Wonderful feature two
                        </span>
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Priceless feature three
                        </span>
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Splended feature four
                        </span>
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Delightful Feature five
                        </span>
                    </div>
                    <button className="my-4 outline-none text-center border-2 border-yedu-green text-yedu-green font-medium bg-yedu-white rounded-md w-full py-2 px-4 hover:bg-yedu-green hover:text-yedu-white">
                        Subscribe Now
                    </button>
                </div>
                <div className="sm:flex-auto md:flex-1 shadow-sm shadow-yedu-green rounded-lg p-6 dark-applied">
                    <h3 className="font-bold text-xl my-2">Enterprise</h3>
                    <h3 className="font-bold text-xl my-2">
                        Custom{' '}
                        <span className="text-sm text-yedu-gray-text">
                            yearly billing only
                        </span>
                    </h3>
                    <p className="text-yedu-gray-text text-sm">
                        Description of the tier list will go here, copy should
                        be concise and impactful
                    </p>
                    <hr className="my-8 text-yedu-dark-gray" />
                    <p className="text-yedu-gray-text">
                        Everything in the Pro plan, plus
                    </p>
                    <div className="flex flex-col my-4 gap-3">
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Amazing feature one
                        </span>
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Wonderful feature two
                        </span>
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Priceless feature three
                        </span>
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Splended feature four
                        </span>
                        <span className="flex items-center gap-3 font-medium">
                            <i className="fas fa-check rounded-full text-yedu-green bg-yedu-light-green p-1"></i>{' '}
                            Delightful feature four
                        </span>
                    </div>
                    <button className="my-4 outline-none text-center border-2 border-yedu-green text-yedu-green font-medium bg-yedu-white rounded-md w-full py-2 px-4 hover:bg-yedu-green hover:text-yedu-white">
                        Contact Sales
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
