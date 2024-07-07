const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    projectId: {
        type: String,
        required: true,
    },
    domain: {
        type: String,
        required: true,
    },
    domainCost: {
        type: Number,
        required: true,
    },
    hostingCost: {
        type: Number,
        required: true,
    },
    hostingPlan: {
        type: String,
        enum: ['hobby', 'business', 'enterprise'],
        required: true,
    },
    paymentIntegration: {
        type: Boolean,
        required: true,
    },
    paymentIntegrationCost: {
        type: Number,
        required: function() {
            return this.paymentIntegration;
        }
    },
    storage: {
        type: Number,
        required: true,
    },
    storageCost: {
        type: Number,
        required: true,
    },
    subtotal: {
        type: Number,
        required: true,
    },
    vat: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
