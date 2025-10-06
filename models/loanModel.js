const db = require("../config/db");

// Create loan request
const createLoanRequest = async (borrowerId, amount, interestRate, durationMonths) => {
  const [result] = await db.execute(
    "INSERT INTO loan_requests (borrower_id, amount, interest_rate, duration_months) VALUES (?, ?, ?, ?)",
    [borrowerId, amount, interestRate, durationMonths]
  );
  return result.insertId;
};


// Get all loan requests (for lenders to view)
// const getAllLoanRequests = async () => {
//   const [rows] = await db.execute(`
//     SELECT lr.*, u.name AS borrower_name, u.email AS borrower_email
//     FROM loan_requests lr
//     JOIN users u ON lr.borrower_id = u.id
//     ORDER BY lr.created_at DESC
//   `);
//   return rows;
// };


// Get only active (pending) loan requests
const getAllLoanRequests = async () => {
  const [rows] = await db.execute(`
    SELECT lr.*, u.name AS borrower_name, u.email AS borrower_email
    FROM loan_requests lr
    JOIN users u ON lr.borrower_id = u.id
    WHERE lr.status = 'pending'
    ORDER BY lr.created_at DESC
  `);
  return rows;
};

// Get loan requests by borrower
const getLoanRequestsByUser = async (borrowerId) => {
  const [rows] = await db.execute(
    "SELECT * FROM loan_requests WHERE borrower_id = ? ORDER BY created_at DESC",
    [borrowerId]
  );
  return rows;
};

// Update loan request (only if pending)
const updateLoanRequest = async (loanId, borrowerId, amount, interestRate, durationMonths) => {
  const [result] = await db.execute(
    `UPDATE loan_requests 
     SET amount = ?, interest_rate = ?, duration_months = ? 
     WHERE id = ? AND borrower_id = ? AND status = 'pending'`,
    [amount, interestRate, durationMonths, loanId, borrowerId]
  );
  return result.affectedRows; // returns 1 if updated
};

// Cancel loan request (only if pending)
const cancelLoanRequest = async (loanId, borrowerId) => {
  const [result] = await db.execute(
    `UPDATE loan_requests 
     SET status = 'cancelled' 
     WHERE id = ? AND borrower_id = ? AND status = 'pending'`,
    [loanId, borrowerId]
  );
  return result.affectedRows; // returns 1 if updated
};

// Fund a loan request
const fundLoanRequest = async (loanId, lenderId) => {
  
  const [loanRows] = await db.execute("SELECT * FROM loan_requests WHERE id = ?", [loanId]);
  const loan = loanRows[0];

  if (!loan) {
    throw new Error("Loan not found");
  }

  if (loan.status !== "pending") {
    throw new Error("Loan already funded or cancelled");
  }

  
  await db.execute(
    "UPDATE loan_requests SET lender_id = ?, status = 'funded', updated_at = NOW() WHERE id = ?",
    [lenderId, loanId]
  );

  
  const [updated] = await db.execute("SELECT * FROM loan_requests WHERE id = ?", [loanId]);
  return updated[0];
};


module.exports = { createLoanRequest, getAllLoanRequests, getLoanRequestsByUser, updateLoanRequest, cancelLoanRequest, fundLoanRequest };
