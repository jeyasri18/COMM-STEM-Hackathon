import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, CreditCard, Lock, CheckCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export function ConfirmedRentalModal({ rental, user, onClose, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: user?.email || ''
  });

  const handleInputChange = (field, value) => {
    if (field === 'cardNumber') {
      // Format card number with spaces
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formatted.length <= 19) { // 16 digits + 3 spaces
        setPaymentData(prev => ({ ...prev, [field]: formatted }));
      }
    } else if (field === 'expiryDate') {
      // Format expiry date as MM/YY
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
      if (formatted.length <= 5) {
        setPaymentData(prev => ({ ...prev, [field]: formatted }));
      }
    } else if (field === 'cvv') {
      // Limit CVV to 3 digits
      if (value.length <= 3) {
        setPaymentData(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setPaymentData(prev => ({ ...prev, [field]: value }));
    }
  };

  const calculateTotal = () => {
    if (!rental.start_date || !rental.end_date) return 0;
    const start = new Date(rental.start_date);
    const end = new Date(rental.end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days * (rental.price_per_day || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update rental with payment confirmation
      const response = await fetch(`${API_BASE}/rentals/${rental.rental_id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_status: 'completed',
          payment_amount: calculateTotal(),
          payment_method: 'credit_card'
        })
      });

      if (response.ok) {
        onPaymentSuccess(rental);
        onClose();
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Rental Confirmed - Complete Payment
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Rental Summary */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-medium text-lg text-green-800">{rental.item_title}</h3>
            <p className="text-green-700 text-sm mb-2">{rental.item_description}</p>
            <div className="text-sm text-green-700">
              <p><strong>Rental Period:</strong> {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</p>
              <p><strong>Daily Rate:</strong> ${rental.price_per_day}/day</p>
              <p><strong>Total Amount:</strong> <span className="font-semibold text-lg">${total}</span></p>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="font-medium">Payment Information</h4>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Cardholder Name</label>
              <input
                value={paymentData.cardholderName}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                placeholder="John Doe"
                required
                className="w-full mt-1 p-3 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Card Number</label>
              <input
                value={paymentData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                placeholder="1234 5678 9012 3456"
                required
                className="w-full mt-1 p-3 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                <input
                  value={paymentData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  placeholder="MM/YY"
                  required
                  className="w-full mt-1 p-3 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">CVV</label>
                <input
                  value={paymentData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  placeholder="123"
                  required
                  className="w-full mt-1 p-3 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={paymentData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="w-full mt-1 p-3 border border-gray-300 rounded-md"
              />
            </div>

            {/* Security Notice */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <Lock className="h-4 w-4" />
              <span>Your payment information is secure and encrypted</span>
            </div>

            {/* Submit Button */}
            <div className="border-t pt-4">
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Pay ${total}</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
