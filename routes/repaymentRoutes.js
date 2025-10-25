const express = require("express");
const router = express.Router();
const repaymentController = require("../controllers/repaymentController");
const authMiddleware = require("../middlewares/authMiddleware");

// Make a repayment (EMI or full)
router.post("/", authMiddleware, repaymentController.makeRepayment);

// View repayment schedule (EMI preview) for a loan
router.get("/schedule/:loan_id", authMiddleware, repaymentController.viewSchedule);

// View repayment history for a specific loan
router.get("/history/:loan_id", authMiddleware, repaymentController.getRepaymentHistory);

// Borrower repayment history (all loans)
router.get("/borrower", authMiddleware, repaymentController.getBorrowerRepayments);

// Lender repayment history (all loans)
router.get("/lender", authMiddleware, repaymentController.getLenderRepayments);

module.exports = router;