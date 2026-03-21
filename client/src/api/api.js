/**
 * API service layer for Fino X Change
 * All backend API calls go through this module
 */

// const API_BASE = '/api';
const API_BASE = import.meta.env.VITE_API_URL + '/api';

function getToken() {
  return localStorage.getItem('fino_token');
}

function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// console.log(import.meta.env);

// Auth API
export const authApi = {
  register: (name, email, password, role = 'user') =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    }).then(handleResponse),

  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handleResponse),

  me: () =>
    fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),
};

// Loans API
export const loansApi = {
  create: (amount, interestRate, durationMonths) =>
    fetch(`${API_BASE}/loans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, interestRate, durationMonths }),
    }).then(handleResponse),

  getAll: () =>
    fetch(`${API_BASE}/loans`, { headers: getAuthHeaders() }).then(handleResponse),

  getMy: () =>
    fetch(`${API_BASE}/loans/my`, { headers: getAuthHeaders() }).then(handleResponse),

  edit: (loanId, amount, interestRate, durationMonths) =>
    fetch(`${API_BASE}/loans/${loanId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, interestRate, durationMonths }),
    }).then(handleResponse),

  cancel: (loanId) =>
    fetch(`${API_BASE}/loans/${loanId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  fund: (loanId) =>
    fetch(`${API_BASE}/loans/${loanId}/fund`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  verifyFund: (razorpay_order_id, razorpay_payment_id, razorpay_signature) =>
    fetch(`${API_BASE}/loans/fund/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      }),
    }).then(handleResponse),

  getFundedBorrower: () =>
    fetch(`${API_BASE}/loans/funded`, { headers: getAuthHeaders() }).then(handleResponse),

  getFundedLender: () =>
    fetch(`${API_BASE}/loans/funded/lender`, { headers: getAuthHeaders() }).then(handleResponse),

  getCompletedBorrower: () =>
    fetch(`${API_BASE}/loans/completed/borrower`, { headers: getAuthHeaders() }).then(handleResponse),

  getCompletedLender: () =>
    fetch(`${API_BASE}/loans/completed/lender`, { headers: getAuthHeaders() }).then(handleResponse),
};

// Repayments API
export const repaymentsApi = {
  create: (loan_id, amount) =>
    fetch(`${API_BASE}/repayments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ loan_id, amount }),
    }).then(handleResponse),

  verify: (razorpay_order_id, razorpay_payment_id, razorpay_signature) =>
    fetch(`${API_BASE}/repayments/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      }),
    }).then(handleResponse),

  getSchedule: (loan_id) =>
    fetch(`${API_BASE}/repayments/schedule/${loan_id}`, { headers: getAuthHeaders() }).then(handleResponse),

  getHistory: (loan_id) =>
    fetch(`${API_BASE}/repayments/history/${loan_id}`, { headers: getAuthHeaders() }).then(handleResponse),

  getBorrowerHistory: () =>
    fetch(`${API_BASE}/repayments/borrower`, { headers: getAuthHeaders() }).then(handleResponse),

  getLenderHistory: () =>
    fetch(`${API_BASE}/repayments/lender`, { headers: getAuthHeaders() }).then(handleResponse),
};

// Ratings API
export const ratingsApi = {
  add: (loanId, role, rating, comment) =>
    fetch(`${API_BASE}/ratings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ loanId, role, rating, comment }),
    }).then(handleResponse),

  getRatedLoanIds: () =>
    fetch(`${API_BASE}/ratings/rated-loans`, { headers: getAuthHeaders() }).then(handleResponse),

  getUser: (userId) =>
    fetch(`${API_BASE}/ratings/${userId}`).then(handleResponse),
};

// Payments (Razorpay key)
export const paymentsApi = {
  getRazorpayKey: () =>
    fetch(`${API_BASE}/payments/razorpay-key`).then(handleResponse),
};
