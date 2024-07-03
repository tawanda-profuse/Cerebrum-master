import { useRef, useState } from 'react';
import ExtendedCheckout from './ExtendedCheckout';
import { toast } from 'react-toastify';

const CheckoutForm = ({ display, setDisplay, openForm, setOpenForm }) => {
    const [amount, setAmount] = useState('');
    const amountRef = useRef(null);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (amount) {
            setDisplay(false);
            setOpenForm(true);
            amountRef.current.value = '';
        } else {
            toast.warn('Please enter an amount.', {
                autoClose: 5000,
            });
        }
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${display ? 'block' : 'hidden'}`}></div>
            <dialog className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-md z-50 dark-applied ${display ? 'block' : 'hidden'}`} open={display}>
                <button
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 bg-green-100 rounded-full w-8 h-8 flex items-center justify-center"
                    onClick={() => setDisplay(false)}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h1 className="text-2xl font-bold text-center mb-6">Buy More Tokens</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Amount $"
                        onChange={(e) => setAmount(e.target.value)}
                        ref={amountRef}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full mt-6 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-lg font-semibold"
                    >
                        Buy Now
                    </button>
                </form>
            </dialog>
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