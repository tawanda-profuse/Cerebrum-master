class User {
    constructor(id, name, profile) {
        this.id = id;
        this.name = name;
        this.profile = profile || { subscription: null, totalPaid: 0 };
    }
}

const mockPaymentGateway = (cardDetails, amount) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulating payment success
            resolve({ success: true, transactionId: '123456789' });
        }, 1000);
    });
};

const subscribeUser = async (user, cardDetails, amount) => {
    // Validate card details (basic validation for demo purposes)
    if (!cardDetails.number || cardDetails.number.length !== 16) {
        throw new Error('Invalid card number');
    }
    if (!cardDetails.expiry || !/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
        throw new Error('Invalid expiry date');
    }
    if (!cardDetails.cvc || cardDetails.cvc.length !== 3) {
        throw new Error('Invalid CVC');
    }

    // Process the payment
    try {
        const paymentResult = await mockPaymentGateway(cardDetails, amount);

        if (paymentResult.success) {
            // Update user's profile with the payment amount
            user.profile.subscription = {
                active: true,
                amountPaid: amount,
                transactionId: paymentResult.transactionId,
                subscribedAt: new Date().toISOString(),
            };
            user.profile.totalPaid += amount;

            return {
                success: true,
                message: 'Subscription successful',
                userProfile: user.profile,
            };
        } else {
            throw new Error('Payment failed');
        }
    } catch (error) {
        return {
            success: false,
            message: error.message,
        };
    }
};

// Usage example:
const user = new User(1, 'John Doe');
const cardDetails = {
    number: '4111111111111111',
    expiry: '12/24',
    cvc: '123',
};

subscribeUser(user, cardDetails, 50.0).then(result => {
    console.log(result);
}).catch(error => {
    console.error('Subscription error:', error.message);
});
