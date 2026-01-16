const db = require("../config/db");

// Calculate EMI dynamically
const calculateEMI = (principal, annualRate, months) => {
  const R = annualRate / (12 * 100); // monthly interest rate
  const EMI = (principal * R * Math.pow(1 + R, months)) / (Math.pow(1 + R, months) - 1);
  return parseFloat(EMI.toFixed(2));
};

// Create repayment record when Razorpay order is created
const createRepayment = async ({
  loanId,
  borrowerId,
  lenderId,
  amount,
  paymentType,
  razorpayOrderId,
}) => {
  const [result] = await db.execute(
    `INSERT INTO loan_repayments 
      (loan_id, borrower_id, lender_id, amount, payment_type, payment_status, razorpay_order_id)
     VALUES (?, ?, ?, ?, ?, 'created', ?)`,
    [loanId, borrowerId, lenderId, amount, paymentType, razorpayOrderId]
  );
  return result;
};

// Mark repayment as successful after Razorpay verification
const markRepaymentSuccess = async ({ orderId, paymentId, signature }) => {
  await db.execute(
    `UPDATE loan_repayments
     SET payment_status = 'success',
         razorpay_payment_id = ?,
         razorpay_signature = ?,
         payment_date = NOW(),
         updated_at = NOW()
     WHERE razorpay_order_id = ?`,
    [paymentId, signature, orderId]
  );
};

// Get repayment row by Razorpay order ID
const getRepaymentByOrderId = async (orderId) => {
  const [rows] = await db.execute(
    `SELECT * FROM loan_repayments WHERE razorpay_order_id = ?`,
    [orderId]
  );
  return rows[0];
};

// Fetch repayment history for a loan
const getRepaymentHistoryByLoan = async (loan_id) => {
  const [rows] = await db.execute(
    `SELECT 
        r.id AS repayment_id,
        r.amount AS repayment_amount,
        r.payment_type,
        r.payment_date,
        r.borrower_id,
        r.lender_id
     FROM loan_repayments r
     WHERE r.loan_id = ?
     ORDER BY r.payment_date ASC`,
    [loan_id]
  );
  return rows;
};

// Fetch repayment history for borrower
const getBorrowerRepayments = async (borrower_id) => {
  const [rows] = await db.execute(
    `SELECT 
        r.id AS repayment_id,
        r.amount AS repayment_amount,
        r.payment_type,
        r.payment_status,
        r.payment_date,
        lr.amount AS loan_amount,
        lr.status AS loan_status,
        u.name AS lender_name,
        u.email AS lender_email
     FROM loan_repayments r
     JOIN loan_requests lr ON r.loan_id = lr.id
     JOIN users u ON r.lender_id = u.id
     WHERE r.borrower_id = ?
     ORDER BY r.payment_date DESC`,
    [borrower_id]
  );
  return rows;
};

// Fetch repayment history for lender
const getLenderRepayments = async (lender_id) => {
  const [rows] = await db.execute(
    `SELECT 
        r.id AS repayment_id,
        r.amount AS repayment_amount,
        r.payment_type,
        r.payment_status,
        r.payment_date,
        lr.amount AS loan_amount,
        lr.status AS loan_status,
        u.name AS borrower_name,
        u.email AS borrower_email
     FROM loan_repayments r
     JOIN loan_requests lr ON r.loan_id = lr.id
     JOIN users u ON r.borrower_id = u.id
     WHERE r.lender_id = ?
     ORDER BY r.payment_date DESC`,
    [lender_id]
  );
  return rows;
};

module.exports = {
  calculateEMI,
  createRepayment,
  markRepaymentSuccess,
  getRepaymentByOrderId,
  getRepaymentHistoryByLoan,
  getBorrowerRepayments,
  getLenderRepayments
};
