const express = require("express");
const { createLoan, fetchAllLoans, fetchUserLoans, editLoan, cancelLoan, fundLoan } = require("../controllers/loanController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Borrower creates a loan request
router.post("/", authMiddleware, createLoan);

// Get all loan requests (for lenders)
router.get("/", authMiddleware, fetchAllLoans);

// Get borrower’s own loan requests
router.get("/my", authMiddleware, fetchUserLoans);

// Edit loan request (only borrower)
router.put("/:loanId", authMiddleware, editLoan);

// Cancel loan request (only borrower)
router.delete("/:loanId", authMiddleware, cancelLoan);

// Fund a loan (only lender)
router.post("/:id/fund", authMiddleware, fundLoan);

module.exports = router;
