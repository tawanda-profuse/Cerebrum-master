import visa from '../../assets/visa.svg';
import mastercard from '../../assets/mastercard.svg';
import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

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
            toast.warn('Expiry date should be in the format MM/YY!', { autoClose: 5000 });
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
                    'http://localhost:8000/users/api/user/subscribe',
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
                    toast.success(`${response.data.message}`, { autoClose: 5000 });
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
        <div className={`w-full max-w-md mx-auto ${display ? 'block' : 'hidden'}`}>
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl  text-center mb-4">
                    Enter Payment Details
                </h1>
                <div className="bg-yellow-300 rounded-md p-3 mb-4 flex items-center justify-between">
                    <span className="text-sm">Purchase Amount:</span>
                    <span className="text-2xl font-bold flex items-center">
                        ${new Intl.NumberFormat('en-US').format(Number(purchaseAmount))} USD
                    </span>
                </div>
                <input
                    type="text"
                    className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-yedu-green"
                    placeholder="Account Holder's Name"
                    onChange={(e) => setAccountHolder(e.target.value)}
                />
                <div className="flex justify-end mb-2">
                    <img src={visa} alt="Visa" className="w-8 h-8 mr-2" />
                    <img src={mastercard} alt="Mastercard" className="w-8 h-8" />
                </div>
                <input
                    type="text"
                    className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-yedu-green"
                    placeholder="Enter card number"
                    onChange={(e) => setCardNumber(e.target.value)}
                />
                <div className="flex mb-3 gap-2">
                    <input
                        type="text"
                        className="w-1/2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yedu-green"
                        placeholder="Enter CVC"
                        onChange={(e) => setCVC(e.target.value)}
                    />
                    <div className="w-1/2 flex items-center">
                        <input
                            type="tel"
                            className="w-1/2 px-3 py-2 text-center border rounded-l-md focus:outline-none focus:ring-2 focus:ring-yedu-green"
                            placeholder="MM"
                            onChange={(e) => setMM(e.target.value)}
                        />
                        <span className="px-1">/</span>
                        <input
                            type="tel"
                            className="w-1/2 px-3 py-2 text-center border rounded-r-md focus:outline-none focus:ring-2 focus:ring-yedu-green"
                            placeholder="YY"
                            onChange={(e) => setYY(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full bg-yedu-green text-white py-2 px-4 rounded-md hover:opacity-80"
                >
                    {isPending ? (
                        <i className="fas fa-spinner animate-spin"></i>
                    ) : (
                        'Checkout'
                    )}
                </button>
            </form>
        </div>
    );
};

export default ExtendedCheckout;