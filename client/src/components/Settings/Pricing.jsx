import React, { useState } from 'react';
import CheckoutForm from './CheckoutForm';

const Pricing = ({ display, setOpenProjects, setOpenPricing }) => {
    const [checkoutForm, setCheckoutForm] = useState(false);
    const [extendedCheckout, setExtendedCheckout] = useState(false);

    const handleBuyTokens = () => {
        setCheckoutForm(true);
    };

    const handleMoveToProduction = () => {
        setOpenProjects(true);
        setOpenPricing(false);
    };

    return (
        <div
            className={`flex-auto flex flex-col gap-4 form-entry ${display ? 'block' : 'hidden'}`}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center w-full m-auto form-entry">
                <PricingCard
                    title="Pay-as-you-go"
                    price="$0.08"
                    unit="/ 1000 tokens"
                    description="Create on-demand with no commitments"
                    features={[
                        'Web creation through prompting',
                        'Sketch-to-site creation',
                        'Upload images to your site',
                        'Free test URL',
                        'Create unlimited projects',
                        'Free hosting (not for production)',
                    ]}
                    buttonText="Buy Tokens"
                    onButtonClick={handleBuyTokens}
                />
                <PricingCard
                    title="Hosting Plans"
                    price="Starting at $5"
                    unit="/ month"
                    description="Scale your web apps with ease"
                    features={[
                        'Custom domain support',
                        'Flexible hosting tiers:',
                        '$5/m Hobby (up to 50 daily users)',
                        '$25/m Business (up to 100 daily users)',
                        '$100/m Enterprise (up to 500 daily users)',
                        'DB management: $2 per 5GB',
                        'Payment integrations: $2/m + fees',
                    ]}
                    buttonText="Move to production"
                    onButtonClick={() => handleMoveToProduction()}
                />
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

const PricingCard = ({
    title,
    price,
    unit,
    description,
    features,
    buttonText,
    onButtonClick,
}) => (
    <div className="w-full shadow-md rounded-lg bg-white p-5 dark:bg-[#333] flex flex-col">
        <h3 className="font-bold text-xl mb-1">{title}</h3>
        <h3 className="font-bold text-xl mb-2">
            {price} <span className="text-sm text-gray-500">{unit}</span>
        </h3>
        <p className="text-gray-500 text-sm mb-3">{description}</p>
        <hr className="my-3 border-gray-200" />
        <div className="flex flex-col mb-4 gap-1 flex-grow">
            {features.map((feature, index) => (
                <span key={index} className="flex items-center gap-2 text-sm">
                    <i className="fas fa-check rounded-full text-green-500 dark:text-green-100 bg-green-100 dark:bg-green-500 p-1 text-xs"></i>
                    {feature}
                </span>
            ))}
        </div>
        <button
            onClick={onButtonClick}
            className="mt-auto outline-none text-center border border-green-500 text-green-500 bg-white dark:bg-[#333] rounded-md w-full py-2 px-4 hover:bg-green-500 dark:hover:bg-green-100 hover:text-white dark:hover:text-green-500 transition-colors"
        >
            {buttonText}
        </button>
    </div>
);

export default Pricing;
