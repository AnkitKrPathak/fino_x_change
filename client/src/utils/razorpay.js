/**
 * Razorpay Checkout integration helper
 */

export function loadRazorpayScript() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Razorpay requires a browser environment'));
  }
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
}

export function openRazorpayCheckout({ key, order, onSuccess, onDismiss }) {
  if (!key) {
    return Promise.reject(new Error('Razorpay key is not configured. Add RAZORPAY_KEY_ID to your backend .env file.'));
  }
  if (!order || !order.id || order.amount == null) {
    return Promise.reject(new Error('Invalid Razorpay order'));
  }
  return loadRazorpayScript().then(() => {
    if (!window.Razorpay) {
      throw new Error('Razorpay SDK failed to load');
    }
    const options = {
      key,
      amount: order.amount,
      currency: order.currency || 'INR',
      order_id: order.id,
      name: 'Fino X Change',
      description: 'P2P Lending Payment',
      handler: (response) => {
        onSuccess({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => onDismiss && onDismiss(),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    return rzp;
  });
}
