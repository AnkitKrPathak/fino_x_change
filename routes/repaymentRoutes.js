const express = require("express");
const router = express.Router();
const repaymentController = require("../controllers/repaymentController");
const authMiddleware = require("../middlewares/authMiddleware");

// Make a repayment
router.post("/", authMiddleware, repaymentController.makeRepayment);

// Borrower repayment history
router.get("/borrower", authMiddleware, repaymentController.getBorrowerRepayments);

// Lender repayment history
router.get("/lender", authMiddleware, repaymentController.getLenderRepayments);

module.exports = router;
