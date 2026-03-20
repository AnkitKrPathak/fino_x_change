-- Add loan_id to user_ratings for one-time rating per loan
ALTER TABLE user_ratings ADD COLUMN loan_id INT NULL;

-- Prevent duplicate ratings: one rating per user per loan
ALTER TABLE user_ratings ADD UNIQUE KEY unique_rating_per_loan (loan_id, rater_user_id);
