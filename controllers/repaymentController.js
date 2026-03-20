const repaymentModel = require("../models/repaymentModel");
const loanModel = require("../models/loanModel");
const db = require("../config/db");
const { createRazorpayOrder } = require("../services/razorpayService");
const { verifyRazorpaySignature } = require("../utils/razorpayUtils");


// Initiate repayment → create Razorpay order
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

    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Repayment amount must be greater than 0" });

    const current_balance = loan.remaining_balance;
    if (amount > current_balance + 0.01) {
      return res
        .status(400)
        .json({ message: "Repayment amount cannot exceed remaining balance" });
    }

    const payment_type = amount >= current_balance ? "full" : "emi";

    const order = await createRazorpayOrder({
      amount,
      receipt: `repay_${loan_id}_${borrower_id}`,
      notes: {
        loanId: loan_id,
        borrowerId: borrower_id,
        lenderId: loan.lender_id,
        paymentType: payment_type,
      },
    });

    await repaymentModel.createRepayment({
      loanId: loan_id,
      borrowerId: borrower_id,
      lenderId: loan.lender_id,
      amount,
      paymentType: payment_type,
      razorpayOrderId: order.id,
    });

    res.status(200).json({
      message: "Repayment order created",
      order,
      meta: {
        loan_id,
        payment_type,
        current_balance,
      },
    });
  } catch (error) {
    console.error("Make Repayment Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Verify Razorpay payment for repayment and update loan
const verifyRepaymentPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const isValid = verifyRazorpaySignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({ message: "Invalid Razorpay signature" });
    }

    const repayment = await repaymentModel.getRepaymentByOrderId(razorpay_order_id);
    if (!repayment) {
      return res.status(404).json({ message: "Repayment record not found" });
    }

    // Optional: prevent double-processing
    if (repayment.payment_status === "success") {
      return res.status(200).json({ message: "Repayment already processed" });
    }

    await repaymentModel.markRepaymentSuccess({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    const loan = await loanModel.getLoanById(repayment.loan_id);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found for this repayment" });
    }

    const current_balance = parseFloat(loan.remaining_balance) || 0;
    const repayAmount = parseFloat(repayment.amount) || 0;
    const new_balance = parseFloat((current_balance - repayAmount).toFixed(2));
    const final_balance = Math.max(0, new_balance);

    await db.execute(
      "UPDATE loan_requests SET remaining_balance = ?, updated_at = NOW() WHERE id = ?",
      [final_balance, repayment.loan_id]
    );

    // Only mark completed when it was a full repayment (amount >= remaining)
    // This prevents EMI/partial repayments from incorrectly completing the loan
    if (repayment.payment_type === "full" && final_balance <= 0.01) {
      await loanModel.updateLoanStatus(repayment.loan_id, "completed");
    }

    res.status(200).json({
      message:
        repayment.payment_type === "full"
          ? "Full repayment completed successfully."
          : "Partial repayment (EMI) recorded successfully.",
      loan_id: repayment.loan_id,
      payment_type: repayment.payment_type,
      paid_amount: repayment.amount,
      remaining_balance: final_balance,
    });
  } catch (error) {
    console.error("Verify Repayment Error:", error);
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

module.exports = {
  makeRepayment,
  verifyRepaymentPayment,
  viewSchedule,
  getRepaymentHistory,
  getBorrowerRepayments,
  getLenderRepayments,
};
