const fs = require('fs');

class User {
    constructor(id, name, profile) {
        this.id = id;
        this.name = name;
        this.profile = profile || { subscription: null, totalPaid: 0 };
    }
}

const saveUserProfile = (user) => {
    const data = {
        id: user.id,
        name: user.name,
        profile: user.profile,
    };

    fs.writeFileSync('userProfile.json', JSON.stringify(data, null, 2));
};

const loadUserProfile = () => {
    if (fs.existsSync('userProfile.json')) {
        const data = fs.readFileSync('userProfile.json');
        const userData = JSON.parse(data);
        return new User(userData.id, userData.name, userData.profile);
    } else {
        return null;
    }
};

const updateUserProfileWithPayment = (user, amount, transactionId) => {
    user.profile.subscription = {
        active: true,
        amountPaid: amount,
        transactionId: transactionId,
        subscribedAt: new Date().toISOString(),
    };
    user.profile.totalPaid += amount;
};

module.exports = { User, saveUserProfile, loadUserProfile, updateUserProfileWithPayment };
