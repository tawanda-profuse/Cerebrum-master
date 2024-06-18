import visa from '../../assets/visa.svg';
import mastercard from '../../assets/mastercard.svg';

const CheckoutForm = ({ display }) => {
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
                        className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                        placeholder="Account Holders Name"
                    />
                    <input
                        type="number"
                        className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                        placeholder="Enter purchase amount"
                    />
                    <div className="flex w-full justify-end gap-4">
                        <img src={visa} alt="" className="w-10 bg-white" />
                        <img src={mastercard} alt="" className="w-10" />
                    </div>
                    <input
                        type="text"
                        className="px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                        placeholder="Enter card number"
                    />
                    <div className="flex w-full gap-2 flex-wrap">
                        <input
                            type="text"
                            className="sm: flex-auto md:flex-1 px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
                            placeholder="Enter CVV"
                        />
                        <input
                            type="tel"
                            className="sm: flex-auto md:flex-1 px-2 border-2  outline-none rounded-md h-10 w-full focus:border-yedu-green"
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
