import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import DropdownSelect from '../ui/dropdown-select';
import { Badge } from '../ui/badge';
import api from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  User, 
  Mail, 
  Phone, 
  Receipt,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function PaymentsForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const invoice = location.state?.invoice;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentAmount: invoice?.total || 0,
    paymentMethod: '',
    reference: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Cheque' },
    { value: 'cash', label: 'Cash' },
    { value: 'mobile_money', label: 'M-Pesa' }
  ];

  useEffect(() => {
    if (!invoice) {
      navigate('/invoices');
    }
  }, [invoice, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentData = {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        amount: parseFloat(formData.paymentAmount),
        method: formData.paymentMethod,
        date: formData.paymentDate,
        reference: formData.reference,
        notes: formData.notes
      };

      console.log('Sending payment data:', paymentData);
      console.log('Invoice object:', invoice);

      const response = await api.post('/payments', paymentData);

      if (response.status === 200 || response.status === 201) {
        // Update invoice status to paid
        const updateInvoiceResponse = await api.patch(`/invoices/${invoice.id}`, { status: 'paid' });

        if (updateInvoiceResponse.status === 200) {
          // Invalidate related caches so Dashboard updates immediately
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          alert('Payment recorded successfully!');
          navigate('/invoices');
        } else {
          alert('Payment recorded but failed to update invoice status');
        }
      } else {
        alert(`Failed to record payment: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!invoice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/invoices')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Invoices</span>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
                <p className="text-sm text-gray-600">Invoice #{invoice.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side (50%) - Payment Form */}
          <div className="space-y-6">
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Payment Details</CardTitle>
                <CardDescription>Enter the payment information below</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Payment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate" className="text-sm font-medium text-gray-700 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      Payment Date
                    </Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>

                  {/* Payment Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentAmount" className="text-sm font-medium text-gray-700 flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                      Payment Amount
                    </Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      step="0.01"
                      value={formData.paymentAmount}
                      onChange={(e) => handleInputChange('paymentAmount', e.target.value)}
                      className="w-full text-lg font-medium"
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                      Payment Method
                    </Label>
                    <DropdownSelect
                      options={paymentMethods}
                      value={formData.paymentMethod}
                      onChange={(value) => handleInputChange('paymentMethod', value)}
                      placeholder="Select payment method"
                      className="w-full"
                    />
                  </div>

                  {/* Reference */}
                  <div className="space-y-2">
                    <Label htmlFor="reference" className="text-sm font-medium text-gray-700 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-500" />
                      Reference
                    </Label>
                    <Input
                      id="reference"
                      type="text"
                      value={formData.reference}
                      onChange={(e) => handleInputChange('reference', e.target.value)}
                      placeholder="Payment reference number"
                      className="w-full"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Additional payment notes"
                      rows="4"
                      className="w-full"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading || !formData.paymentMethod}
                    className="w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Recording Payment...</span>
                      </div>
                    ) : (
                      'Record Payment'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Side (50%) - Invoice & Customer Details */}
          <div className="space-y-6">
            {/* Customer Details */}
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Customer Name</Label>
                    <p className="text-gray-900 font-medium text-lg mt-1">
                      {invoice?.Customer?.name || `Customer ${invoice?.customerId}`}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      Email Address
                    </Label>
                    <p className="text-gray-900 mt-1">
                      {invoice?.Customer?.email || 'No email provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      Phone Number
                    </Label>
                    <p className="text-gray-900 mt-1">
                      {invoice?.Customer?.phone || 'No phone provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-green-600" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Invoice Number</Label>
                    <p className="text-gray-900 font-medium text-lg mt-1">#{invoice?.id}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Invoice Date</Label>
                      <p className="text-gray-900 mt-1">{formatDate(invoice?.date)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Due Date</Label>
                      <p className="text-gray-900 mt-1">{formatDate(invoice?.dueDate)}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Payment Status</Label>
                    <div className="mt-1">
                      {invoice?.status === 'Paid' ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unpaid
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Sub Total</span>
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(invoice?.subtotal || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Tax</span>
                      <span className="text-gray-900 font-medium">
                        {formatCurrency((invoice?.total || 0) - (invoice?.subtotal || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-t border-gray-200">
                      <span className="text-lg font-bold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(invoice?.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
