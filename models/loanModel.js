const db = require("../config/db");
const repaymentModel = require("./repaymentModel");

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


// Get only active (pending) loan requests, optionally excluding current user's requests
const getAllLoanRequests = async (excludeUserId = null) => {
  let query = `
    SELECT 
      lr.id,
      lr.borrower_id,
      lr.amount,
      lr.interest_rate,
      lr.duration_months,
      lr.status,
      lr.created_at,
      lr.updated_at,
      u.name AS borrower_name,
      u.email AS borrower_email,
      (
        SELECT ROUND(AVG(ur.rating), 2)
        FROM user_ratings ur
        WHERE ur.rated_user_id = lr.borrower_id
          AND ur.role = 'borrower'
      ) AS borrower_avg_rating
    FROM loan_requests lr
    INNER JOIN users u ON lr.borrower_id = u.id
    WHERE lr.status = 'pending'
  `;
  const params = [];
  if (excludeUserId != null) {
    query += ` AND lr.borrower_id != ?`;
    params.push(excludeUserId);
  }
  query += ` ORDER BY lr.created_at DESC`;

  const [rows] = params.length
    ? await db.execute(query, params)
    : await db.execute(query);
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
  return result.affectedRows;
};

// Cancel loan request (only if pending)
const cancelLoanRequest = async (loanId, borrowerId) => {
  const [result] = await db.execute(
    `UPDATE loan_requests 
     SET status = 'cancelled' 
     WHERE id = ? AND borrower_id = ? AND status = 'pending'`,
    [loanId, borrowerId]
  );
  return result.affectedRows;
};

// // Fund a loan request
// const fundLoanRequest = async (loanId, lenderId) => {
  
//   const [loanRows] = await db.execute("SELECT * FROM loan_requests WHERE id = ?", [loanId]);
//   const loan = loanRows[0];

//   if (!loan) {
//     throw new Error("Loan not found");
//   }

//   if (loan.status !== "pending") {
//     throw new Error("Loan already funded or cancelled");
//   }

//   const remaining_balance = loan.amount;
//   const EMI = repaymentModel.calculateEMI(
//     loan.amount,
//     loan.interest_rate,
//     loan.duration_months
//   );
//   const total_payable = EMI * loan.duration_months;

//   await db.execute(
//     "UPDATE loan_requests SET lender_id = ?, status = 'funded', remaining_balance = ?, total_payable = ?, updated_at = NOW() WHERE id = ?",
//     [lenderId, remaining_balance, total_payable, loanId]
//   );

  
//   const [updated] = await db.execute("SELECT * FROM loan_requests WHERE id = ?", [loanId]);
//   return updated[0];
// };

// Get all funded loans for a borrower
const getBorrowerFundedLoans = async (borrowerId) => {
  const [rows] = await db.execute(
    `SELECT lr.*, u.name AS lender_name, u.email AS lender_email
     FROM loan_requests lr
     JOIN users u ON lr.lender_id = u.id
     WHERE lr.borrower_id = ? AND lr.status = 'funded'
     ORDER BY lr.updated_at DESC`,
    [borrowerId]
  );
  return rows;
};

// Get all funded loans for a lender
const getLenderFundedLoans = async (lenderId) => {
  const [rows] = await db.execute(
    `SELECT lr.*, u.name AS borrower_name, u.email AS borrower_email
     FROM loan_requests lr
     JOIN users u ON lr.borrower_id = u.id
     WHERE lr.lender_id = ? AND lr.status = 'funded'
     ORDER BY lr.updated_at DESC`,
    [lenderId]
  );
  return rows;
};

// Get single loan by ID
const getLoanById = async (loanId) => {
  const [rows] = await db.execute(
    "SELECT * FROM loan_requests WHERE id = ?",
    [loanId]
  );
  return rows[0];
};

// Update loan status
const updateLoanStatus = async (loanId, status) => {
  await db.execute(
    "UPDATE loan_requests SET status = ?, updated_at = NOW() WHERE id = ?",
    [status, loanId]
  );
};

// Get all completed loans for a borrower
const getCompletedLoansForBorrower = async (borrowerId) => {
  const [rows] = await db.execute(
    `
    SELECT 
      l.id AS loan_id,
      l.amount,
      l.status,
      l.created_at,
      l.updated_at AS completed_at,
      u.name AS lender_name,
      u.email AS lender_email
    FROM loan_requests l
    JOIN users u ON l.lender_id = u.id
    WHERE l.borrower_id = ? AND l.status = 'completed'
    ORDER BY l.updated_at DESC
    `,
    [borrowerId]
  );
  return rows;
};

// Get all completed loans for a lender
const getCompletedLoansForLender = async (lenderId) => {
  const [rows] = await db.execute(
    `
    SELECT 
      l.id AS loan_id,
      l.amount,
      l.status,
      l.created_at,
      l.updated_at AS completed_at,
      u.name AS borrower_name,
      u.email AS borrower_email
    FROM loan_requests l
    JOIN users u ON l.borrower_id = u.id
    WHERE l.lender_id = ? AND l.status = 'completed'
    ORDER BY l.updated_at DESC
    `,
    [lenderId]
  );
  return rows;
};

module.exports = { createLoanRequest, getAllLoanRequests, getLoanRequestsByUser, updateLoanRequest, cancelLoanRequest, getBorrowerFundedLoans, getLenderFundedLoans, getLoanById, updateLoanStatus, getCompletedLoansForBorrower, getCompletedLoansForLender };
