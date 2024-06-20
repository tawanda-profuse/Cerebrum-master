import visa from '../../assets/visa.svg';
import mastercard from '../../assets/mastercard.svg';
import { useState } from 'react';
import { toast } from 'react-toastify';

const ExtendedCheckout = ({
    display,
    setDisplay,
    openCheckOut,
    purchaseAmount,
}) => {
    const [accountHolder, setAcccountHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cvv, setCVV] = useState('');
    const [mmYY, setMMYY] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [address3, setAddress3] = useState('');
    const handleSubmit = (event) => {
        event.preventDefault();
        if (!accountHolder) {
            toast.warn('Account Holder is required!', { autoClose: 5000 });
            return;
        }
        if (!cardNumber) {
            toast.warn('Card number is required!', { autoClose: 5000 });
            return;
        }
        if (!cvv) {
            toast.warn('CVV is required!', { autoClose: 5000 });
            return;
        }
        if (!mmYY) {
            toast.warn('Month and year are required!', { autoClose: 5000 });
            return;
        }

        setDisplay(false);
        openCheckOut(true);
        alert(
            `Test Details Submitted\n\nAccount Holder: ${accountHolder}\nCard Number: ${cardNumber}\nCVV:${cvv}\nMMYY:${mmYY}`
        );
    };
    return (
        <div
            className={`w-full md:w-[80%] m-auto form-entry ${display ? 'block' : 'hidden'}`}
        >
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col justify-center items-center gap-4 p-4">
                    <h1 className="font-medium text-3xl text-center my-4">
                        Enter Payment Details
                    </h1>
                    <div className="flex items-center justify-start bg-yellow-300 w-full my-6 gap-4 p-2">
                        <span>Purchase Amount: </span>
                        <span className="text-6xl font-bold flex items-center">
                            <i className="fas fa-dollar-sign text-2xl"></i>
                            {new Intl.NumberFormat('en-US').format(
                                purchaseAmount
                            )}
                        </span>
                    </div>
                    <input
                        type="text"
                        className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                        placeholder="Account Holders Name"
                        onChange={(e) => setAcccountHolder(e.target.value)}
                    />
                    <div className="flex w-full justify-end gap-4">
                        <img src={visa} alt="" className="w-10 bg-white" />
                        <img src={mastercard} alt="" className="w-10" />
                    </div>
                    <input
                        type="text"
                        className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                        placeholder="Enter card number"
                        onChange={(e) => setCardNumber(e.target.value)}
                    />
                    <div className="flex w-full gap-2 flex-wrap">
                        <input
                            type="text"
                            className="sm: flex-auto md:flex-1 px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Enter CVV"
                            onChange={(e) => setCVV(e.target.value)}
                        />
                        <input
                            type="tel"
                            className="sm: flex-auto md:flex-1 px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Enter MM/YY"
                            onChange={(e) => setMMYY(e.target.value)}
                        />
                    </div>
                    <input
                        type="text"
                        className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                        placeholder="Address 1"
                        onChange={(e) => setAddress1}
                    />
                    <input
                        type="text"
                        className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                        placeholder="Address 2"
                        onChange={(e) => setAddress2}
                    />
                    <input
                        type="text"
                        className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                        placeholder="Address 3"
                        onChange={(e) => setAddress3}
                    />
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

export default ExtendedCheckout;
