const repaymentModel = require("../models/repaymentModel");
const loanModel = require("../models/loanModel");
const db = require("../config/db");

// Borrower makes repayment
const makeRepayment = async (req, res) => {
  const borrowerId = req.user.id;
  const { loanId } = req.body;

  try {
    // 1. Check if loan exists and is funded
    const loan = await loanModel.getLoanById(loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if (loan.status !== "funded")
      return res.status(400).json({ message: "Loan is not funded" });
    if (loan.borrower_id !== borrowerId)
      return res.status(403).json({ message: "Not authorized" });

    // 2. Record repayment
    await repaymentModel.createRepayment(
      loanId,
      borrowerId,
      loan.lender_id,
      loan.amount
    );

    // 3. Update loan status to completed
    await loanModel.updateLoanStatus(loanId, "completed");

    res.status(201).json({
      message: "Repayment successful. Loan marked as completed.",
      loanId,
      amount: loan.amount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Borrower repayment history
const getBorrowerRepayments = async (req, res) => {
  try {
    const borrowerId = req.user.id;
    const history = await repaymentModel.getBorrowerRepayments(borrowerId);
    res.status(200).json({ message: "Repayments fetched", history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lender repayment history
const getLenderRepayments = async (req, res) => {
  try {
    const lenderId = req.user.id;
    const history = await repaymentModel.getLenderRepayments(lenderId);
    res.status(200).json({ message: "Repayments fetched", history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { makeRepayment, getBorrowerRepayments, getLenderRepayments };
