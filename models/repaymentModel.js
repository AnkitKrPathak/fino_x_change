const db = require("../config/db");

// Record a repayment
const createRepayment = async (loanId, borrowerId, lenderId, amount) => {
  const [result] = await db.execute(
    "INSERT INTO loan_repayments (loan_id, borrower_id, lender_id, amount) VALUES (?, ?, ?, ?)",
    [loanId, borrowerId, lenderId, amount]
  );
  return result;
};

// Get repayment history for borrower
const getBorrowerRepayments = async (borrowerId) => {
  const [rows] = await db.execute(
    `SELECT r.*, lr.amount AS loan_amount, u.name AS lender_name, u.email AS lender_email
     FROM loan_repayments r
     JOIN loan_requests lr ON r.loan_id = lr.id
     JOIN users u ON r.lender_id = u.id
     WHERE r.borrower_id = ?
     ORDER BY r.payment_date DESC`,
    [borrowerId]
  );
  return rows;
};

// Get repayment history for lender
const getLenderRepayments = async (lenderId) => {
  const [rows] = await db.execute(
    `SELECT r.*, lr.amount AS loan_amount, u.name AS borrower_name, u.email AS borrower_email
     FROM loan_repayments r
     JOIN loan_requests lr ON r.loan_id = lr.id
     JOIN users u ON r.borrower_id = u.id
     WHERE r.lender_id = ?
     ORDER BY r.payment_date DESC`,
    [lenderId]
  );
  return rows;
};

module.exports = { createRepayment, getBorrowerRepayments, getLenderRepayments };
