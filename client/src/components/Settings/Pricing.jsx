const Pricing = ({ display }) => {
    return (
        <div
            className={`flex-auto flex flex-col gap-4 form-entry ${display ? 'block' : 'hidden'}`}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center w-full m-auto form-entry">
                <div className="w-full shadow-md shadow-yedu-dark-gray rounded-lg p-6 dark-applied">
                    <h3 className="font-bold text-xl my-2">Free</h3>
                    <h3 className="font-bold text-xl my-2">
                        $0{' '}
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
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
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
                <div className="w-full shadow-md shadow-yedu-dark-gray rounded-lg p-6 dark-applied">
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
            </div>
        </div>
    );
};

export default Pricing;
