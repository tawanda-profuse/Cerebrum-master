const mockPaymentGateway = (mockScenario) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            switch (mockScenario) {
                case 'invalid_card':
                    reject(new Error('Invalid card details'));
                    break;
                case 'declined':
                    resolve({ success: false, reason: 'Transaction declined by the bank' });
                    break;
                case 'network_error':
                    reject(new Error('Network error, please try again later'));
                    break;
                case 'success':
                    resolve({ success: true, transactionId: '123456789' });
                    break;
                default:
                    reject(new Error('Unknown error occurred'));
            }
        }, 1000);
    });
};

const subscribeUser = async (cardDetails, mockScenario) => {
    // Validate card details (basic validation for demo purposes)
    if (!cardDetails.number || cardDetails.number.length !== 16) {
        return { success: false, message: 'Invalid card number' };
    }
    if (!cardDetails.expiry || !/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
        return { success: false, message: 'Invalid expiry date' };
    }
    if (!cardDetails.cvc || cardDetails.cvc.length !== 3) {
        return { success: false, message: 'Invalid CVC' };
    }

    // Process the payment
    try {
        const paymentResult = await mockPaymentGateway(mockScenario);
        return paymentResult;
    } catch (error) {
        console.log('error:', error.message)
        return { success: false, message: error.message };
    }
};

module.exports = { mockPaymentGateway, subscribeUser };
