import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExpenseList, deleteExpense } from "../store/slices/expensesSlice";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import ExpensesForm from "../components/Expenses/ExpensesForm";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  TrendingDown,
  Calendar,
  DollarSign,
  Receipt,
} from "lucide-react";

export default function Expenses() {
  const dispatch = useDispatch();
  const { list, total, page, pageSize, loading } = useSelector(
    (s) => s.expenses
  );

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);

  useEffect(() => {
    dispatch(fetchExpenseList({ page, pageSize, search }));
  }, [dispatch, page, pageSize, search]);

  const handlePageChange = (newPage) =>
    dispatch(fetchExpenseList({ page: newPage + 1, pageSize, search }));

  const handleOpenForm = () => {
    setEditExpense(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditExpense(null);
  };

  const handleEdit = (expense) => {
    console.log('Edit button clicked for expense:', expense);
    console.log('Expense category:', expense.category);
    console.log('Expense amount:', expense.amount);
    console.log('Expense description:', expense.description);
    console.log('Expense date:', expense.date);
    console.log('Expense vendor:', expense.vendor);
    setEditExpense(expense);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    dispatch(fetchExpenseList({ page, pageSize, search }));
    handleCloseForm();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getCategoryBadge = (category) => {
    const categoryColors = {
      'Office Supplies': 'bg-blue-100 text-blue-800',
      'Travel': 'bg-green-100 text-green-800',
      'Marketing': 'bg-purple-100 text-purple-800',
      'Utilities': 'bg-yellow-100 text-yellow-800',
      'Equipment': 'bg-gray-100 text-gray-800',
      'Other': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={categoryColors[category] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    );
  };

  // Calculate stats
  const totalExpenses = list?.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0) || 0;
  const thisMonthExpenses = list?.filter(expense => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0) || 0;
  const averageExpense = list?.length > 0 ? totalExpenses / list.length : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Track and manage all business expenses</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer" onClick={handleOpenForm}>
          <Plus className="h-5 w-5 mr-2" />
          New Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrency(thisMonthExpenses)}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatCurrency(averageExpense)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{list?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All expenses</p>
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
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
        </div>
            <Button variant="outline" className="border-gray-300">
              Filter
        </Button>
      </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${list?.length || 0} expenses found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Vendor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Loading expenses...
                      </div>
                    </td>
                  </tr>
                ) : list?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  list?.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">#{expense.id}</td>
                      <td className="py-3 px-4">
                        {getCategoryBadge(expense.category)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate">
                        {expense.description}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {expense.vendor || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                            onClick={() => handleEdit(expense)}
                            className="h-8 px-3"
                      >
                            <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                            onClick={() => dispatch(deleteExpense(expense.id))}
                            className="h-8 px-3"
                      >
                            <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
                </div>
                
          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
                </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 2)}
                  disabled={page === 1}
                >
                  Previous
                  </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  disabled={page * pageSize >= total}
                >
                  Next
                  </Button>
                </div>
            </div>
          )}
            </CardContent>
          </Card>

      {/* Right Side Drawer Form */}
      <ExpensesForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editExpense={editExpense}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
