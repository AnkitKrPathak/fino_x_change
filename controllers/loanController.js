const razorpay = require("../config/razorpay");
const db = require("../config/db");
const repaymentModel = require("../models/repaymentModel");
const { createLoanRequest, getAllLoanRequests, getLoanRequestsByUser, updateLoanRequest, cancelLoanRequest, getBorrowerFundedLoans, getLenderFundedLoans, getCompletedLoansForBorrower, getCompletedLoansForLender, getLoanById } = require("../models/loanModel");
const { createLoanLend, markLendSuccess, getLendByOrderId } = require("../models/loanLendModel");
const { createRazorpayOrder } = require("../services/razorpayService");
const { verifyRazorpaySignature } = require("../utils/razorpayUtils");


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

// const fundLoan = async (req, res) => {
//   try {
//     const lenderId = req.user.id; // from JWT
//     const { id } = req.params; // loan ID

//     const fundedLoan = await fundLoanRequest(id, lenderId);

//     res.status(200).json({
//       message: "Loan funded successfully",
//       fundedLoan,
//     });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

const fundLoan = async (req, res) => {
  try {
    const lenderId = req.user.id;
    const { id: loanId } = req.params;

    const loan = await getLoanById(loanId);

    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if (loan.status !== "pending")
      return res.status(400).json({ message: "Loan already funded or cancelled" });

    const order = await createRazorpayOrder({
      amount: loan.amount,
      receipt: `lend_${loanId}_${lenderId}`,
      notes: {
        loanId,
        lenderId,
        borrowerId: loan.borrower_id
      }
    });

    await createLoanLend({
      loanId,
      lenderId,
      borrowerId: loan.borrower_id,
      amount: loan.amount,
      razorpayOrderId: order.id
    });

    res.status(200).json({
      message: "Razorpay order created",
      order
    });

  } catch (error) {
    console.error("Fund Loan Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const verifyLendPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const isValid = verifyRazorpaySignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValid) {
      return res.status(400).json({ message: "Invalid Razorpay signature" });
    }

    const lend = await getLendByOrderId(razorpay_order_id);
    if (!lend) return res.status(404).json({ message: "Lend record not found" });

    await markLendSuccess({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    const loan = await getLoanById(lend.loan_id);

    const EMI = repaymentModel.calculateEMI(
      loan.amount,
      loan.interest_rate,
      loan.duration_months
    );

    const totalPayable = EMI * loan.duration_months;

    await db.execute(
      `UPDATE loan_requests 
       SET lender_id = ?, status = 'funded', remaining_balance = ?, total_payable = ?, updated_at = NOW()
       WHERE id = ?`,
      [lend.lender_id, loan.amount, totalPayable, lend.loan_id]
    );

    res.json({ message: "Loan funded successfully after payment verification" });

  } catch (error) {
    console.error("Verify Lend Payment Error:", error);
    res.status(500).json({ message: error.message });
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

const borrowerCompletedLoans = async (req, res) => {
  try {
    const borrowerId = req.user.id;
    const completedLoans = await getCompletedLoansForBorrower(borrowerId);

    res.status(200).json({
      success: true,
      count: completedLoans.length,
      completed_loans: completedLoans
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const lenderCompletedLoans = async (req, res) => {
  try {
    const lenderId = req.user.id;
    const completedLoans = await getCompletedLoansForLender(lenderId);

    res.status(200).json({
      success: true,
      count: completedLoans.length,
      completed_loans: completedLoans
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createLoan, fetchAllLoans, fetchUserLoans, editLoan, cancelLoan, fundLoan, verifyLendPayment, borrowerFundedLoans, lenderFundedLoans, borrowerCompletedLoans, lenderCompletedLoans };
