const repaymentModel = require("../models/repaymentModel");
const loanModel = require("../models/loanModel");
const db = require("../config/db");

// Initiate repayment
const makeRepayment = async (req, res) => {
  try {
    const borrower_id = req.user.id;
    const { loan_id, amount } = req.body;

    const loan = await loanModel.getLoanById(loan_id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    if (loan.borrower_id !== borrower_id)
      return res.status(403).json({ message: "Not authorized to repay this loan" });

    if (loan.status !== "funded")
      return res.status(400).json({ message: "Loan is not funded" });

    if (amount <= 0)
      return res.status(400).json({ message: "Repayment amount must be greater than 0" });

    const current_balance = loan.remaining_balance;
    const payment_type = amount >= current_balance ? "full" : "emi";

    await repaymentModel.createRepayment(
      loan_id,
      borrower_id,
      loan.lender_id,
      amount,
      payment_type
    );

    const new_balance = parseFloat((current_balance - amount).toFixed(2));
    await db.execute(
      "UPDATE loan_requests SET remaining_balance = ? WHERE id = ?",
      [new_balance > 0 ? new_balance : 0, loan_id]
    );

    if (new_balance <= 0) {
      await loanModel.updateLoanStatus(loan_id, "completed");
    }

    res.status(200).json({
      message:
        payment_type === "full"
          ? "Full repayment completed successfully."
          : "Partial repayment (EMI) recorded successfully.",
      loan_id,
      payment_type,
      paid_amount: amount,
      remaining_balance: new_balance > 0 ? new_balance : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// View repayment schedule (EMI preview)
const viewSchedule = async (req, res) => {
  try {
    const { loan_id } = req.params;

    const loan = await loanModel.getLoanById(loan_id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    const EMI = repaymentModel.calculateEMI(
      loan.amount,
      loan.interest_rate,
      loan.duration_months
    );

    res.status(200).json({
      EMI_per_month: EMI,
      total_payable: loan.total_payable,
      duration_months: loan.duration_months,
      interest_rate: loan.interest_rate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// View repayment history
const getRepaymentHistory = async (req, res) => {
  try {
    const { loan_id } = req.params;
    const history = await repaymentModel.getRepaymentHistoryByLoan(loan_id);
    res.status(200).json({ history });
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

module.exports = { makeRepayment, viewSchedule, getRepaymentHistory, getBorrowerRepayments, getLenderRepayments };
