import { useState } from 'react';

const Pricing = ({ display }) => {
    const [toggle, setToggle] = useState(false);

    return (
        <div
            className={`flex-auto flex flex-col gap-4 form-entry ${display ? 'block' : 'hidden'}`}
        >
            <h1 className="text-center font-bold text-4xl form-entry">
                Our Pricing
            </h1>
            <span className="m-auto w-full flex justify-evenly items-center form-entry">
                <p className="text-sm text-yedu-gray-text font-semibold">
                    Billed Monthly
                </p>{' '}
                <p className="text-yedu-green flex items-center gap-2">
                    <i
                        className={`text-yedu-green text-5xl cursor-pointer ${toggle ? 'fas fa-toggle-on' : 'fas fa-toggle-off'}`}
                        onClick={() => setToggle(!toggle)}
                    ></i>
                    Billed Yearly (save 15%)
                </p>
            </span>
            <div className="flex gap-4 flex-wrap justify-center w-full md:w-[80%] my-4 m-auto form-entry">
                <div className="flex-auto shadow-sm shadow-yedu-green rounded-lg p-6 dark-applied">
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
                <div className="flex-auto shadow-sm shadow-yedu-green rounded-lg p-6 dark-applied">
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
                <div className="flex-auto shadow-sm shadow-yedu-green rounded-lg p-6 dark-applied">
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
        </div>
    );
};

export default Pricing;
