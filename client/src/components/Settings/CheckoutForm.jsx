import React from 'react';

const CheckoutForm = ({ display, setDisplay }) => {
    const handleSubmit = (event) => {
        event.preventDefault();
        alert('Test Details Submitted');
    };
    return (
        <div className={`w-full form-entry ${display ? 'block' : 'hidden'}`}>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col justify-center items-center gap-4 p-4">
                    <h1 className="font-medium text-3xl text-center">
                        Buy More Tokens
                    </h1>
                    <input
                        type="text"
                        className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                        placeholder="Account Name"
                    />
                    <input
                        type="text"
                        className="px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                        placeholder="Enter card number"
                    />
                    <div className="flex w-full gap-2 flex-wrap">
                        <input
                            type="text"
                            className="sm: flex-auto md:flex-1 px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Enter CVV"
                        />
                        <input
                            type="tel"
                            className="sm: flex-auto md:flex-1 px-2 border-2 border-yedu-dark-gray outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Enter MM/YY"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-yedu-green h-10 py-2 px-4 rounded-md border-none outline-none text-yedu-white w-full hover:opacity-80"
                    >
                        Checkout
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CheckoutForm;
