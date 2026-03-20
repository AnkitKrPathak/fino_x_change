const ratingModel = require("../models/ratingModel");
const loanModel = require("../models/loanModel");

// Add a rating after repayment is done
const addRating = async (req, res) => {
  try {
    const raterUserId = req.user.id;
    const { loanId, role, rating, comment } = req.body; // role = 'borrower' | 'lender'

    // Check loan validity
    const loan = await loanModel.getLoanById(loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if (loan.status !== "completed")
      return res.status(400).json({ message: "Loan not completed yet" });

    // Validate role and find rated user
    let ratedUserId;
    if (role === "borrower") {
      if (loan.lender_id !== raterUserId)
        return res.status(403).json({ message: "Only lender can rate borrower" });
      ratedUserId = loan.borrower_id;
    } else if (role === "lender") {
      if (loan.borrower_id !== raterUserId)
        return res.status(403).json({ message: "Only borrower can rate lender" });
      ratedUserId = loan.lender_id;
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    // One-time rating: check if user already rated for this loan
    const alreadyRated = await ratingModel.hasRatedForLoan(loanId, raterUserId);
    if (alreadyRated) {
      return res.status(400).json({ message: "You have already rated for this loan" });
    }

    // Add rating
    await ratingModel.addRating(ratedUserId, raterUserId, role, rating, comment, loanId);

    res.status(201).json({
      message: `Successfully rated ${role}`,
      rating: { ratedUserId, raterUserId, role, rating, comment }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get loan IDs the current user has already rated (for hiding Rate button)
const getRatedLoanIds = async (req, res) => {
  try {
    const raterUserId = req.user.id;
    const loanIds = await ratingModel.getRatedLoanIds(raterUserId);
    res.status(200).json({ loanIds });
  } catch (error) {
    // If loan_id column doesn't exist yet, return empty (run migrations/add_loan_id_to_user_ratings.sql)
    res.status(200).json({ loanIds: [] });
  }
};

// Get overall ratings for a user
const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const summary = await ratingModel.getUserRatings(userId);
    const feedback = await ratingModel.getUserFeedback(userId);
    res.status(200).json({ summary, feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addRating, getUserRatings, getRatedLoanIds };
