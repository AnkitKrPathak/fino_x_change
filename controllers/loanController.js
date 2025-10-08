const { createLoanRequest, getAllLoanRequests, getLoanRequestsByUser, updateLoanRequest, cancelLoanRequest, fundLoanRequest, getBorrowerFundedLoans, getLenderFundedLoans } = require("../models/loanModel");

// Borrower creates loan request
const createLoan = async (req, res) => {
  try {
    const { amount, interestRate, durationMonths } = req.body;
    const borrowerId = req.user.id; // from JWT

    if (!amount || !interestRate || !durationMonths) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const loanId = await createLoanRequest(borrowerId, amount, interestRate, durationMonths);

    res.status(201).json({ message: "Loan request created successfully", loanId });
  } catch (error) {
    console.error("Create Loan Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all loan requests (for lenders to browse)
const fetchAllLoans = async (req, res) => {
  try {
    const loans = await getAllLoanRequests();
    res.json(loans);
  } catch (error) {
    console.error("Fetch Loans Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get logged-in user’s own loan requests
const fetchUserLoans = async (req, res) => {
  try {
    const borrowerId = req.user.id;
    const loans = await getLoanRequestsByUser(borrowerId);
    res.json(loans);
  } catch (error) {
    console.error("Fetch User Loans Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update loan request
const editLoan = async (req, res) => {
  try {
    const borrowerId = req.user.id;
    const { loanId } = req.params;
    const { amount, interestRate, durationMonths } = req.body;

    if (!amount || !interestRate || !durationMonths) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updated = await updateLoanRequest(loanId, borrowerId, amount, interestRate, durationMonths);
    if (!updated) {
      return res.status(400).json({ message: "Cannot edit loan — either not found or already funded/cancelled" });
    }

    res.json({ message: "Loan request updated successfully" });
  } catch (error) {
    console.error("Edit Loan Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel loan request
const cancelLoan = async (req, res) => {
  try {
    const borrowerId = req.user.id;
    const { loanId } = req.params;

    const cancelled = await cancelLoanRequest(loanId, borrowerId);
    if (!cancelled) {
      return res.status(400).json({ message: "Cannot cancel loan — either not found or already funded/cancelled" });
    }

    res.json({ message: "Loan request cancelled successfully" });
  } catch (error) {
    console.error("Cancel Loan Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const fundLoan = async (req, res) => {
  try {
    const lenderId = req.user.id; // from JWT
    const { id } = req.params; // loan ID

    const fundedLoan = await fundLoanRequest(id, lenderId);

    res.status(200).json({
      message: "Loan funded successfully",
      fundedLoan,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const borrowerFundedLoans = async (req, res) => {
  try {
    const borrowerId = req.user.id;
    const fundedLoans = await getBorrowerFundedLoans(borrowerId);

    res.status(200).json({
      message: "Funded loans fetched successfully",
      fundedLoans,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const lenderFundedLoans = async (req, res) => {
  try {
    const lenderId = req.user.id;
    const fundedLoans = await getLenderFundedLoans(lenderId);

    res.status(200).json({
      message: "Funded loans fetched successfully for lender",
      fundedLoans,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createLoan, fetchAllLoans, fetchUserLoans, editLoan, cancelLoan, fundLoan, borrowerFundedLoans, lenderFundedLoans };
