const db = require("../config/db");

// Create initial lend record before payment
const createLoanLend = async ({ loanId, lenderId, borrowerId, amount, razorpayOrderId }) => {
  const [result] = await db.execute(
    `INSERT INTO loan_lend 
     (loan_id, lender_id, borrower_id, amount, razorpay_order_id, status) 
     VALUES (?, ?, ?, ?, ?, 'created')`,
    [loanId, lenderId, borrowerId, amount, razorpayOrderId]
  );

  return result.insertId;
};

// Mark lend as successful
const markLendSuccess = async ({ orderId, paymentId, signature }) => {
  await db.execute(
    `UPDATE loan_lend 
     SET status = 'success', razorpay_payment_id = ?, razorpay_signature = ?, updated_at = NOW()
     WHERE razorpay_order_id = ?`,
    [paymentId, signature, orderId]
  );
};

// Get lend by Razorpay order ID
const getLendByOrderId = async (orderId) => {
  const [rows] = await db.execute(
    `SELECT * FROM loan_lend WHERE razorpay_order_id = ?`,
    [orderId]
  );
  return rows[0];
};

module.exports = {
  createLoanLend,
  markLendSuccess,
  getLendByOrderId
};
