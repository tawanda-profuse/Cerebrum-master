import visa from '../../assets/visa.svg';
import mastercard from '../../assets/mastercard.svg';
import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
const env = process.env.NODE_ENV || 'development';
const baseURL = env === 'production' ? process.env.REACT_APP_PROD_API_URL : process.env.REACT_APP_DEV_API_URL;

const ExtendedCheckout = ({ display, setDisplay, openCheckOut, purchaseAmount }) => {
    const [accountHolder, setAccountHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cvc, setCVC] = useState('');
    const [mm, setMM] = useState('');
    const [yy, setYY] = useState('');
    const jwt = localStorage.getItem('jwt');
    const [isPending, setIsPending] = useState(false);

    const validateData = () => {
        if (!accountHolder) {
            toast.warn('Account Holder is required!', { autoClose: 5000 });
            setIsPending(false);
            return false;
        }
        if (!cardNumber) {
            toast.warn('Card number is required!', { autoClose: 5000 });
            setIsPending(false);
            return false;
        }
        if (cardNumber.length !== 16) {
            toast.warn('Invalid card number', { autoClose: 5000 });
            setIsPending(false);
            return false;
        }
        if (!cvc) {
            toast.warn('CVC is required!', { autoClose: 5000 });
            setIsPending(false);
            return false;
        }
        if (cvc.length !== 3) {
            toast.warn('Invalid CVC number!', { autoClose: 5000 });
            setIsPending(false);
            return false;
        }
        if (!mm || !yy) {
            toast.warn('Month and year are required!', { autoClose: 5000 });
            setIsPending(false);
            return false;
        }
        if (!/^\d{2}\/\d{2}$/.test(`${mm}/${yy}`)) {
            toast.warn('Expiry date should be in the format MM/YY!', {
                autoClose: 5000,
            });
            setIsPending(false);
            return false;
        }
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsPending(true);
        if (validateData()) {
            const cardDetails = {
                number: cardNumber,
                expiry: `${mm}/${yy}`,
                cvc: cvc,
            };
            const mockScenario = 'success';

            try {
                const response = await axios.post(
                    `${baseURL}/users/api/user/subscribe`,
                    {
                        cardDetails,
                        amount: Number(purchaseAmount),
                        mockScenario: mockScenario,
                    },
                    { headers: { Authorization: `Bearer ${jwt}` } }
                );

                console.log('response', response);
                if (response.status === 200) {
                    setDisplay(false);
                    openCheckOut(true);
                    setIsPending(false);
                    toast.success(`${response.data.message}`, {
                        autoClose: 5000,
                    });
                }
                if (response.status === 400) {
                    toast.info(`${response.data.message}`, { autoClose: 5000 });
                    setIsPending(false);
                }
            } catch (error) {
                setIsPending(false);
                toast.error(`${error.message}`, { autoClose: 5000 });
            }
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
                <h1 className="text-2xl font-bold text-center mb-4">Enter Payment Details</h1>
                <div className="bg-yellow-300 dark:bg-red-500 rounded-md p-3 mb-4 flex items-center justify-between">
                    <span className="text-sm">Purchase Amount:</span>
                    <span className="text-2xl font-bold">
                        ${new Intl.NumberFormat('en-US').format(Number(purchaseAmount))} USD
                    </span>
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Account Holder's Name"
                        onChange={(e) => setAccountHolder(e.target.value)}
                    />
                    <div className="flex justify-end mb-2">
                        <img src={visa} alt="Visa" className="w-8 h-8 mr-2" />
                        <img src={mastercard} alt="Mastercard" className="w-8 h-8" />
                    </div>
                    <input
                        type="text"
                        className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter card number"
                        onChange={(e) => setCardNumber(e.target.value)}
                    />
                    <div className="flex mb-3 gap-2">
                        <input
                            type="text"
                            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter CVC"
                            onChange={(e) => setCVC(e.target.value)}
                        />
                        <div className="w-1/2 flex items-center">
                            <input
                                type="tel"
                                className="w-1/2 px-3 py-2 text-center border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="MM"
                                onChange={(e) => setMM(e.target.value)}
                            />
                            <span className="px-1">/</span>
                            <input
                                type="tel"
                                className="w-1/2 px-3 py-2 text-center border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="YY"
                                onChange={(e) => setYY(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full mt-6 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-lg font-semibold"
                    >
                        {isPending ? <i className="fas fa-spinner animate-spin"></i> : 'Checkout'}
                    </button>
                </form>
            </dialog>
        </>
    );
};

export default ExtendedCheckout;