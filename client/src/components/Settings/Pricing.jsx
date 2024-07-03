import React, { useState } from 'react';
import CheckoutForm from './CheckoutForm';

const Pricing = ({ display }) => {
    const [checkoutForm, setCheckoutForm] = useState(false);
    const [extendedCheckout, setExtendedCheckout] = useState(false);

    const handleBuyTokens = () => {
        setCheckoutForm(true);
    };

    return (
        <div
            className={`flex-auto flex flex-col gap-4 form-entry ${display ? 'block' : 'hidden'}`}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center w-full m-auto form-entry">
                <div className="w-full shadow-md rounded-lg bg-white p-6 dark:bg-[#333] flex flex-col">
                    <div>
                        <h3 className="font-bold text-xl mb-2">Free</h3>
                        <h3 className="font-bold text-xl mb-2">
                            $0{' '}
                            <span className="text-sm text-gray-500">
                                / month
                            </span>
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Description of the tier list will go here, copy
                            should be concise and impactful
                        </p>
                        <hr className="my-4 border-gray-200" />
                        <p className="text-gray-500 mb-2">
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit.
                        </p>
                        <div className="flex flex-col mb-4 gap-2">
                            {[
                                'Amazing feature one',
                                'Wonderful feature two',
                                'Priceless feature three',
                                'Splended feature four',
                                'Delightful Feature five',
                            ].map((feature, index) => (
                                <span
                                    key={index}
                                    className="flex items-center gap-2"
                                >
                                    <i className="fas fa-check rounded-full text-green-500 bg-green-100 p-1"></i>
                                    {feature}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleBuyTokens}
                        className="mt-auto outline-none text-center border border-green-500 text-green-500 bg-white rounded-md w-full py-2 px-4 hover:bg-green-500 hover:text-white transition-colors"
                    >
                        Buy Tokens
                    </button>
                </div>
                <div className="w-full rounded-lg bg-white p-6 dark:bg-[#333] flex flex-col shadow-md">
                    <div>
                        <h3 className="font-bold text-xl mb-2">Pro</h3>
                        <h3 className="font-bold text-xl mb-2">
                            $12{' '}
                            <span className="text-sm text-gray-500">
                                / month
                            </span>
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Description of the tier list will go here, copy
                            should be concise and impactful
                        </p>
                        <hr className="my-4 border-gray-200" />
                        <p className="text-gray-500 mb-2">
                            Everything in the Free plan, plus
                        </p>
                        <div className="flex flex-col mb-4 gap-2">
                            {[
                                'Amazing feature one',
                                'Wonderful feature two',
                                'Priceless feature three',
                                'Splended feature four',
                                'Delightful Feature five',
                            ].map((feature, index) => (
                                <span
                                    key={index}
                                    className="flex items-center gap-2"
                                >
                                    <i className="fas fa-check rounded-full text-green-500 bg-green-100 p-1"></i>
                                    {feature}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button className="mt-auto outline-none text-center border border-green-500 text-green-500 bg-white rounded-md w-full py-2 px-4 hover:bg-green-500 hover:text-white transition-colors">
                        Subscribe Now
                    </button>
                </div>
            </div>
            <CheckoutForm
                display={checkoutForm}
                setDisplay={setCheckoutForm}
                openForm={extendedCheckout}
                setOpenForm={setExtendedCheckout}
            />
        </div>
    );
};

export default Pricing;
