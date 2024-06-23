import { useRef, useState } from 'react';
import ExtendedCheckout from './ExtendedCheckout';
import { toast } from 'react-toastify';

const CheckoutForm = ({ display, setDisplay, openForm, setOpenForm }) => {
    const [amount, setAmount] = useState(0);
    const amountRef = useRef(null);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (amount) {
            setDisplay(false);
            setOpenForm(true);
            amountRef.current.value = '';
        } else {
            toast.warn('The amount is required.', {
                autoClose: 5000,
            });
        }
    };

    return (
        <>
            <div
                className={`w-full max-w-md mx-auto ${display ? 'block' : 'hidden'}`}
            >
                <form onSubmit={handleSubmit} className="bg-gray-100 rounded-lg shadow-sm p-6 min-h-[400px]">
                    <h1 className="text-2xl text-center mb-6 mt-[20%]">
                        Buy More Tokens
                    </h1>
                    <div className="mb-4">
                        <input
                            type="number"
                            step={0.01}
                            className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yedu-green ml-[30%]"
                            placeholder="Amount $"
                            onChange={(e) => setAmount(e.target.value)}
                            ref={amountRef}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-yedu-green text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition duration-300"
                    >
                        Buy Now
                    </button>
                </form>
            </div>
            <ExtendedCheckout
                display={openForm}
                setDisplay={setOpenForm}
                openCheckOut={setDisplay}
                purchaseAmount={amount}
            />
        </>
    );
};

export default CheckoutForm;
