const crypto = require('crypto');

function verifyRazorpaySignature({ order_id, payment_id, signature }) {
  const body = `${order_id}|${payment_id}`;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
}

module.exports = {
  verifyRazorpaySignature,
};
