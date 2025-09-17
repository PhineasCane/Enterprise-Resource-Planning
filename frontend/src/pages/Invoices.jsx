import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { 
  Plus, 
  Search, 
  MoreVertical,
  FileText,
  Download,
  Eye,
  Edit,
  CreditCard,
  Trash2
} from "lucide-react";
import { 
  fetchInvoiceList,
  deleteInvoice,
} from "../store/slices/invoicesSlice";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import api from "../services/api";

export default function Invoices() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, total, page, pageSize, loading } = useSelector(
    (s) => s.invoices
  );

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [search, setSearch] = useState("");
  const buttonRefs = useRef({});

  useEffect(() => {
    dispatch(fetchInvoiceList({ page, pageSize, search }));
  }, [dispatch, page, pageSize, search]);



  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown-container') && !event.target.closest('[data-dropdown]')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown when pressing Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handlePageChange = (newPage) =>
    dispatch(fetchInvoiceList({ page: newPage + 1, pageSize, search }));

  const handleCreateInvoice = () => {
    navigate('/invoices/new');
  };

  const handleEditInvoice = (invoice) => {
    navigate(`/invoices/edit/${invoice.id}`);
    setDropdownOpen(null);
  };

  const handleViewInvoice = (invoice) => {
    navigate(`/invoices/view/${invoice.id}`);
    setDropdownOpen(null);
  };

  const handleDownloadInvoice = async (invoice) => {
    try {

      
      // Transform invoice data to match PDF generation expectations
      const invoiceDataForPDF = {
        ...invoice,
        // Ensure items are properly formatted for PDF generation
        items: (invoice.items || []).map(item => ({
          item: item.item || item.name || item.itemName || 'Unknown Item',
          description: item.description || '',
          quantity: item.quantity || 0,
          pricePer: item.pricePer || item.price || 0,
          total: item.total || 0,
          productId: item.productId || null
        })),
        customerName: invoice.Customer?.name || '',
        customerEmail: invoice.Customer?.email || '',
        customerAddress: invoice.Customer?.address || ''
      };



      const response = await api.post('/pdf/generate-invoice', invoiceDataForPDF, {
        responseType: 'blob'
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to generate PDF:', response.data);
        alert(`Failed to generate PDF: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error downloading invoice. Please try again.');
    }
    setDropdownOpen(null);
  };

  const handleRecordPayment = (invoice) => {
    navigate('/invoices/pay', { state: { invoice } });
    setDropdownOpen(null);
  };

  const handleDeleteInvoice = (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      dispatch(deleteInvoice(invoiceId));
    }
    setDropdownOpen(null);
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/excel/invoices', {
        responseType: 'blob'
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoices-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Error downloading Excel file. Please try again.');
    }
  };

  const toggleDropdown = (invoiceId) => {
    if (dropdownOpen === invoiceId) {
      setDropdownOpen(null);
    } else {
      setDropdownOpen(invoiceId);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'unpaid':
        return <Badge variant="warning">Unpaid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'sent':
        return <Badge variant="info">Sent</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    // Ensure amount is a valid number
    const numAmount = parseFloat(amount) || 0;
    if (isNaN(numAmount)) return 'KSh 0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to calculate overdue invoices
  const calculateOverdueInvoices = () => {
    if (!list) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return list.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      return dueDate < today && (inv.status === 'pending' || inv.status === 'unpaid');
    }).length;
  };

  // Helper function to calculate unpaid invoices
  const calculateUnpaidInvoices = () => {
    if (!list) return 0;
    return list.filter(inv => inv.status === 'pending' || inv.status === 'unpaid').length;
  };

  // Helper function to calculate total revenue from all invoices
  const calculateTotalRevenue = () => {
    if (!list || list.length === 0) return 0;
    
    try {
      const total = list.reduce((sum, inv) => {
        const invoiceTotal = parseFloat(inv.total) || 0;
        if (isNaN(invoiceTotal)) {
          return sum;
        }
        return sum + invoiceTotal;
      }, 0);
      
      return total;
    } catch (error) {
      return 0;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage your customer invoices and payments</p>
        </div>
        <Button onClick={handleCreateInvoice} className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
          <Plus className="h-5 w-5 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">💰</div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatCurrency(calculateTotalRevenue())}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">⚠️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateUnpaidInvoices()}
            </div>
            <p className="text-xs text-muted-foreground">Pending payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">🚨</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateOverdueInvoices()}
            </div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Excel Export Button */}
            <Button 
              onClick={handleExportExcel}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            
            <Button variant="outline" className="border-gray-300">
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${list?.length || 0} invoices found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto relative" style={{ minHeight: 'fit-content' }}>
            <table className="w-full table-fixed" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Invoice #</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Due Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list?.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">#{invoice.id}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(invoice.date)}</td>
                    <td className="py-3 px-4 text-gray-600">{invoice.Customer?.name || `Customer ${invoice.customerId}`}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{formatCurrency(invoice.total || 0)}</td>
                    <td className="py-3 px-4">{getStatusBadge(invoice.status)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(invoice.dueDate)}</td>
                    <td className="py-3 px-4 w-20 overflow-visible relative" style={{ minWidth: '80px', maxWidth: '80px', width: '80px' }}>
                      <div className="relative dropdown-container">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleDropdown(invoice.id)}
                          className="h-8 w-8 p-0 cursor-pointer"
                          ref={(el) => buttonRefs.current[invoice.id] = el}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        
                        {/* Dropdown Menu - Portal-based for left positioning */}
                        {dropdownOpen === invoice.id && createPortal(
                          <div 
                            className="fixed z-[9999] bg-white rounded-md shadow-lg border border-gray-200 w-48 py-1 cursor-pointer"
                            data-dropdown="true"
                            style={{
                              minWidth: '192px',
                              top: buttonRefs.current[invoice.id]?.getBoundingClientRect().top + (buttonRefs.current[invoice.id]?.getBoundingClientRect().height / 2) - 100,
                              left: (buttonRefs.current[invoice.id]?.getBoundingClientRect().left || 0) - 200,
                            }}
                          >
                            {/* Show Button */}
                            <button
                              onClick={() => handleViewInvoice(invoice)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-3 text-blue-600" />
                              Show
                            </button>
                            
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditInvoice(invoice)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-3 text-green-600" />
                              Edit
                            </button>
                            
                            {/* Download Button */}
                            <button
                              onClick={() => handleDownloadInvoice(invoice)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                            >
                              <Download className="h-4 w-4 mr-3 text-purple-600" />
                              Download
                            </button>
                            
                            {/* Record Payment Button */}
                            <button
                              onClick={() => handleRecordPayment(invoice)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                            >
                              <CreditCard className="h-4 w-4 mr-3 text-orange-600" />
                              Record Payment
                            </button>
                            
                            {/* Divider */}
                            <div className="border-t border-gray-200 my-1"></div>
                            
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-3" />
                              Delete
                            </button>
                          </div>,
                          document.body
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && list?.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
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
                <span className="px-3 py-2 text-sm text-gray-600">
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
          )}
        </CardContent>
      </Card>


    </div>
  );
}