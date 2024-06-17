import React from 'react';

const CheckoutForm = ({ display, setDisplay }) => {
    const handleSubmit = () => {
        alert('Test Details Submitted');
    };
    return (
        <div className={`${display ? 'block' : 'hidden'}`}>
            <form onSubmit={handleSubmit}>
                <input type="text" />
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default CheckoutForm;
