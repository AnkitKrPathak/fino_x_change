# Database Migrations

Run these SQL scripts against your MySQL database when upgrading.

## add_loan_id_to_user_ratings.sql

Adds `loan_id` to `user_ratings` table to enforce one-time rating per loan.

```bash
mysql -u your_user -p your_database < migrations/add_loan_id_to_user_ratings.sql
```

Or run the SQL manually in your MySQL client.
