import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReportData } from "../store/slices/reportsSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Area,
  Bar,
  Line,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Reports() {
  const dispatch = useDispatch();
  const { chartData, loading, error } = useSelector((s) => s.reports);

  useEffect(() => {
    dispatch(fetchReportData());
  }, [dispatch]);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-4">
            {typeof error === "string"
              ? error
              : error?.message || "Failed to load reports"}
          </div>
          <p className="text-gray-500 mb-4">
            There was an error loading the report data. This could be because:
          </p>
          <ul className="text-gray-500 text-sm space-y-1 mb-6">
            <li>• The backend server is not running</li>
            <li>• There's no data in the database yet</li>
            <li>• There's a database connection issue</li>
          </ul>
          <button
            onClick={() => dispatch(fetchReportData())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check if we have data
  if (!chartData || Object.keys(chartData).length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-600 text-lg font-medium mb-4">
            No Report Data Available
          </div>
          <p className="text-gray-500 mb-4">
            Reports will appear here once you have data in your system.
          </p>
          <p className="text-gray-500 text-sm">
            Make sure you have invoices, expenses, and customer data.
          </p>
        </div>
      </div>
    );
  }



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Get the numbers that matter</p>
        </div>
      </div>

      {/* Revenue vs Expenses */}
      {chartData.revenueVsExpenses && (chartData.revenueVsExpenses.revenue || chartData.revenueVsExpenses.expenses) && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>
              Financial performance overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* KPI summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  ${(chartData.revenueVsExpenses.revenue || 0).toLocaleString()}
                </div>
                <div className="text-sm text-green-700">Total Revenue</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  $
                  {(chartData.revenueVsExpenses.expenses || 0).toLocaleString()}
                </div>
                <div className="text-sm text-red-700">Total Expenses</div>
              </div>
            </div>

            {/* Simple bar chart for totals */}
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <ComposedChart
                  data={[
                    {
                      name: "Revenue",
                      revenue: chartData.revenueVsExpenses.revenue || 0,
                      expenses: 0
                    },
                    {
                      name: "Expenses", 
                      revenue: 0,
                      expenses: chartData.revenueVsExpenses.expenses || 0
                    }
                  ]}
                  margin={{ top: 20, right: 30, bottom: 20, left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    tick={{ fontSize: 12 }}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value) => `$${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: "0.5rem" }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                    barSize={60}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                    barSize={60}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Status */}
      {chartData.invoiceStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
            <CardDescription>
              Overview of paid, unpaid, and overdue invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {chartData.invoiceStatus.paid || 0}
                </div>
                <div className="text-sm text-green-600">Paid</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {chartData.invoiceStatus.unpaid || 0}
                </div>
                <div className="text-sm text-yellow-600">Unpaid</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {chartData.outstanding?.length || 0}
                </div>
                <div className="text-sm text-red-600">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Products */}
      {chartData.topProducts && chartData.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Your best performing products by sales volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="font-medium">
                      {product.name || "Unknown Product"}
                    </span>
                  </div>
                  <span className="text-gray-600">
                    {product.sold} units sold
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Revenue */}
      {chartData.customerRevenue && chartData.customerRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Revenue</CardTitle>
            <CardDescription>Your highest value customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.customerRevenue.map((customer, index) => (
                <div
                  key={customer.customerId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="font-medium">
                      {customer.name || "Unknown Customer"}
                    </span>
                  </div>
                  <span className="text-gray-600">
                    ${(customer.totalSpent || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Breakdown */}
      {chartData.expenseBreakdown && chartData.expenseBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown by Category</CardTitle>
            <CardDescription>Where your money is going</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.expenseBreakdown.map((expense) => (
                <div
                  key={expense.category}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">
                    {expense.category || "Uncategorized"}
                  </span>
                  <span className="text-gray-600">
                    ${(expense.total || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
