import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPaymentList,
  deletePayment,
} from "../store/slices/paymentsSlice";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import api from "../services/api";
import { 
  MoreHorizontal, 
  Trash2, 
  Calendar,
  DollarSign,
  CreditCard,
  User,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export default function Payments() {
  const dispatch = useDispatch();
  const { list, total, page, pageSize, loading } = useSelector(
    (s) => s.payments
  );

  const [downloadingPDF, setDownloadingPDF] = useState(null);

  useEffect(() => {
    dispatch(fetchPaymentList({ page, pageSize }));
  }, [dispatch, page, pageSize]);

  const handlePageChange = (newPage) =>
    dispatch(fetchPaymentList({ page: newPage + 1, pageSize }));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getYear = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear();
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'Cash':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'Bank Transfer':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'MPesa':
        return <CreditCard className="h-4 w-4 text-orange-600" />;
      case 'Cheque':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPaymentMethodBadge = (method) => {
    const variants = {
      'Cash': 'bg-green-100 text-green-800 border-green-200',
      'Bank Transfer': 'bg-blue-100 text-blue-800 border-blue-200',
      'MPesa': 'bg-orange-100 text-orange-800 border-orange-200',
      'Cheque': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    return (
      <Badge variant="outline" className={variants[method] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {getPaymentMethodIcon(method)}
        <span className="ml-2">{method}</span>
      </Badge>
    );
  };

  const handleDownloadPDF = async (paymentId) => {
    try {
      setDownloadingPDF(paymentId);
      const response = await api.get(`/payments/${paymentId}/pdf`, {
        responseType: 'blob'
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Track and manage all payment transactions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Payments</p>
                <p className="text-lg font-bold">{total}</p>
              </div>
              <DollarSign className="h-6 w-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">This Month</p>
                <p className="text-lg font-bold">
                  {formatCurrency(list.filter(p => {
                    const paymentDate = new Date(p.date);
                    const now = new Date();
                    return paymentDate.getMonth() === now.getMonth() && 
                           paymentDate.getFullYear() === now.getFullYear();
                  }).reduce((sum, p) => sum + parseFloat(p.amount), 0))}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">This Year</p>
                <p className="text-lg font-bold">
                  {formatCurrency(list.filter(p => {
                    const paymentDate = new Date(p.date);
                    const now = new Date();
                    return paymentDate.getFullYear() === now.getFullYear();
                  }).reduce((sum, p) => sum + parseFloat(p.amount), 0))}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Amount</p>
                <p className="text-lg font-bold">
                  {formatCurrency(list.reduce((sum, p) => sum + parseFloat(p.amount), 0))}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-indigo-200" />
            </div>
          </CardContent>
        </Card>
      </div>
                
      {/* Payments Table */}
      <Card className="shadow-sm border-0">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-xl text-gray-900">Payment Transactions</CardTitle>
          <CardDescription>All recorded payments with detailed information</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading payments...</span>
                      </div>
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No payments found. Record your first payment to get started.
                    </td>
                  </tr>
                ) : (
                  list.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">#{payment.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.Customer?.name || `Customer ${payment.customerId}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.Customer?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{formatDate(payment.date)}</span>
                </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{getYear(payment.date)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(payment.method)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleDownloadPDF(payment.id)}
                              disabled={downloadingPDF === payment.id}
                            >
                              {downloadingPDF === payment.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => dispatch(deletePayment(payment.id))}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Payment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
                </div>
                
          {/* Pagination */}
          {total > pageSize && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 2)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {Math.ceil(total / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    disabled={page >= Math.ceil(total / pageSize)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
            </CardContent>
          </Card>
    </div>
  );
}
