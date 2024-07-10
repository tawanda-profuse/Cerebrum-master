import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const baseURL = process.env.VITE_NODE_ENV === 'production' 
  ? process.env.VITE_PROD_API_URL 
  : process.env.VITE_DEV_API_URL;

const CheckoutForm = ({ display, setDisplay, openForm, setOpenForm }) => {
    const [amount, setAmount] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (amount) {
            setIsPending(true);
            const jwt = localStorage.getItem('jwt');

            try {
                const response = await axios.post(
                    `${baseURL}/payments/user/buy_token`,
                    { amount: parseFloat(amount) },
                    { headers: { Authorization: `Bearer ${jwt}` } }
                );
                if (response.status === 200 && response.data.success && response.data.redirect) {
                    setPaymentUrl(response.data.redirect);
                    openPaymentWindow(response.data.redirect);
                } else {
                    toast.error('Order creation failed: ' + (response.data.message || 'Unknown error'), {
                        autoClose: 5000,
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('Order creation failed: ' + (error.response?.data?.message || error.message), {
                    autoClose: 5000,
                });
            } finally {
                setIsPending(false);
                setDisplay(false);
                setOpenForm(true);
            }
        } else {
            toast.warn('Please enter an amount.', {
                autoClose: 5000,
            });
        }
    };

    const openPaymentWindow = (url) => {
        const width = 800;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(url, 'PaymentWindow', `width=${width},height=${height},left=${left},top=${top}`);
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
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full mt-6 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-lg font-semibold"
                        disabled={isPending}
                    >
                        {isPending ? 'Processing...' : 'Buy Now'}
                    </button>
                </form>
            </dialog>
        </>
    );
};

export default CheckoutForm;
