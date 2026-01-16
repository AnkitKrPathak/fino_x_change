const razorpay = require('../config/razorpay');

async function createRazorpayOrder({ amount, receipt, notes = {} }) {
  // Razorpay expects amount in paise (100.00 INR => 10000)
  const options = {
    amount: Math.round(amount * 100),
    currency: process.env.RAZORPAY_CURRENCY || 'INR',
    receipt: receipt,
    notes,
  };

  const order = await razorpay.orders.create(options);
  return order;
}

module.exports = {
  createRazorpayOrder,
};
