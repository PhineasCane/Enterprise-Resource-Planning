/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Download, Edit, ArrowLeft, Eye, X } from "lucide-react";
import api from "../../services/api";

const InvoicePreview = ({ invoiceData, onEdit, onClose, isFullPage = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // If no invoiceData is provided and we're in full page mode, fetch the data
  const [localInvoiceData, setLocalInvoiceData] = useState(invoiceData);

  // Fetch invoice data when component mounts in full page mode
  useEffect(() => {
    if (isFullPage && !invoiceData && id) {
      fetchInvoiceData();
    }
  }, [isFullPage, invoiceData, id]);

  const fetchInvoiceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/invoices/${id}`);
      
      if (response.status === 200) {
        const data = response.data;
        setLocalInvoiceData(data.data || data);
      } else {
        setError('Failed to fetch invoice data');
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Error fetching invoice data');
    } finally {
      setLoading(false);
    }
  };

  // Use local data if available, otherwise use prop data
  const currentInvoiceData = localInvoiceData || invoiceData;

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
          <Button onClick={fetchInvoiceData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const calculateSubtotal = () => {
    if (!currentInvoiceData.items || !Array.isArray(currentInvoiceData.items)) return 0;
    return currentInvoiceData.items.reduce((sum, item) => {
      return sum + (Number(item.quantity || 0) * Number(item.pricePer || 0));
    }, 0);
  };

  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (Number(currentInvoiceData.taxRate || 0) / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount();
  };

  const handleDownloadPDF = async () => {
    if (!currentInvoiceData || !currentInvoiceData.customerId || !currentInvoiceData.number) {
      alert('Please fill in customer and invoice number before downloading PDF');
      return;
    }

    setIsDownloading(true);
    try {
      // Transform invoice data to match PDF generation expectations
      const invoiceDataForPDF = {
        ...currentInvoiceData,
        items: currentInvoiceData.InvoiceItems || currentInvoiceData.items || [],
        customerName: currentInvoiceData.Customer?.name || currentInvoiceData.customerName || '',
        customerEmail: currentInvoiceData.Customer?.email || currentInvoiceData.customerEmail || '',
        customerAddress: currentInvoiceData.Customer?.address || currentInvoiceData.customerAddress || ''
      };

      // Call the backend PDF route to generate and download the PDF
      const response = await api.post('/pdf/generate-invoice', invoiceDataForPDF, {
        responseType: 'blob'
      });

      if (response.status === 200) {
        // Create a blob from the PDF data
        const blob = new Blob([response.data], { type: 'application/pdf' });
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${currentInvoiceData.number || 'INV-001'}.pdf`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to generate PDF:', response.data);
        alert(`Failed to generate PDF: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/invoices');
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      navigate(`/invoices/edit/${currentInvoiceData.id}`);
    }
  };

  if (!currentInvoiceData) return null;

  // Full page version
  if (isFullPage) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-2xl font-semibold flex items-center">
                  <Eye className="h-6 w-6 mr-2 text-blue-600" />
                  Invoice #{currentInvoiceData.number}
                </CardTitle>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? "Generating..." : "Download PDF"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Invoice Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Invoice #:</span> {currentInvoiceData.number}</p>
                    <p><span className="font-medium">Date:</span> {new Date(currentInvoiceData.date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Due Date:</span> {new Date(currentInvoiceData.dueDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        currentInvoiceData.status === 'paid' ? 'bg-green-100 text-green-800' :
                        currentInvoiceData.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {currentInvoiceData.status?.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {currentInvoiceData.Customer?.name || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {currentInvoiceData.Customer?.email || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {currentInvoiceData.Customer?.phone || 'N/A'}</p>
                    <p><span className="font-medium">Address:</span> {currentInvoiceData.Customer?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Invoice Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Price</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(currentInvoiceData.items || []).map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.item || item.Product?.name || item.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.Product?.description || item.description || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(item.pricePer || 0)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                            {formatCurrency((item.quantity || 0) * (item.pricePer || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-lg">Subtotal:</span>
                  <span className="font-semibold text-lg">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-lg">Tax ({currentInvoiceData.taxRate || 0}%):</span>
                  <span className="font-semibold text-lg">{formatCurrency(calculateTaxAmount())}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-xl font-bold">Total:</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Notes */}
              {currentInvoiceData.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{currentInvoiceData.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Modal version (existing functionality)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Invoice Preview</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Invoice content for modal */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900">Invoice #{currentInvoiceData.number}</h3>
              <p className="text-sm text-gray-500">Date: {new Date(currentInvoiceData.date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500">Status: {currentInvoiceData.status}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Customer</h3>
              <p className="text-sm text-gray-500">{currentInvoiceData.Customer?.name}</p>
              <p className="text-sm text-gray-500">{currentInvoiceData.Customer?.email}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Items</h3>
            <div className="space-y-2">
              {(currentInvoiceData.items || []).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.item || item.Product?.name || item.name} x {item.quantity}</span>
                  <span>{formatCurrency((item.quantity || 0) * (item.pricePer || 0))}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
