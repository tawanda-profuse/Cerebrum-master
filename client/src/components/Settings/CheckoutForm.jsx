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
                className={`w-full m-auto min-h-screen form-entry ${display ? 'block' : 'hidden'}`}
            >
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col justify-center items-center gap-4 p-4">
                        <h1 className="font-medium text-3xl text-center my-4">
                            Buy More Tokens
                        </h1>
                        <input
                            type="number"
                            step={0.01}
                            className="px-2 border-2  outline-none rounded-md min-h-10 my-2 md:w-[40%] focus:border-yedu-green"
                            placeholder="USD purchase amount"
                            onChange={(e) => setAmount(e.target.value)}
                            ref={amountRef}
                        />
                        <button
                            type="submit"
                            className="bg-yedu-green h-10 py-2 px-4 rounded-md border-none outline-none text-yedu-white md:w-[40%] hover:opacity-80"
                        >
                            Buy Now
                        </button>
                    </div>
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
