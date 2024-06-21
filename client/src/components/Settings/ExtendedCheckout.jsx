import visa from '../../assets/visa.svg';
import mastercard from '../../assets/mastercard.svg';
import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const ExtendedCheckout = ({
    display,
    setDisplay,
    openCheckOut,
    purchaseAmount,
}) => {
    const [accountHolder, setAccountHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cvc, setCVC] = useState('');
    const [mmYY, setMMYY] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [address3, setAddress3] = useState('');
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
        if (!mmYY) {
            toast.warn('Month and year are required!', { autoClose: 5000 });
            setIsPending(false);
            return false;
        }
        if (!/^\d{2}\/\d{2}$/.test(mmYY)) {
            toast.warn('Invalid expiry date!', { autoClose: 5000 });
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
                expiry: mmYY,
                cvc: cvc,
            };
            const sampleResponses = [
                'invalid_card',
                'success',
                'declined',
                'network_error',
            ];
            const mockScenario =
                sampleResponses[
                    Math.floor(Math.random() * sampleResponses.length)
                ];

            await axios
                .post(
                    'http://localhost:8000/users/api/user/subscribe',
                    {
                        cardDetails,
                        amount: Number(purchaseAmount),
                        mockScenario: mockScenario,
                    },
                    { headers: { Authorization: `Bearer ${jwt}` } }
                )
                .then((response) => {
                    if (response.status === 200) {
                        setDisplay(false);
                        openCheckOut(true);
                        setIsPending(false);
                        toast.success(`${response.message}`, {
                            autoClose: 5000,
                        });
                    }
                    if (response.status === 400) {
                        toast.info(`${response.message}`, {
                            autoClose: 5000,
                        });
                        setIsPending(false);
                    }
                })
                .catch((error) => {
                    setIsPending(false);
                    toast.error(`${error.message}`, { autoClose: 5000 });
                });
        }
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
                                Number(purchaseAmount)
                            )}
                        </span>
                        USD
                    </div>
                    <input
                        type="text"
                        className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                        placeholder="Account Holders Name"
                        onChange={(e) => setAccountHolder(e.target.value)}
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
                            placeholder="Enter CVC"
                            onChange={(e) => setCVC(e.target.value)}
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
                        {isPending ? (
                            <i className="fas fa-spinner animate-spin"></i>
                        ) : (
                            'Checkout'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExtendedCheckout;
