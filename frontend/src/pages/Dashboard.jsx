import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

import {
  fetchCurrencies,
  setSelectedSymbol,
} from "../store/slices/currencySlice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select } from "../components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Bar,
  ComposedChart,
  BarChart,
} from "recharts";
import {
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
  DollarSign,
  Clock,
  Calendar,
  Package,
  Globe,
} from "lucide-react";

/**
 * Dashboard Component - Phase 1-3 Performance Optimizations
 * 
 * Phase 1 (Backend):
 * - Database query parallelization with Promise.all
 * - Simplified chart data generation
 * - Database indexes for faster queries
 * - Basic caching (2-minute in-memory)
 * 
 * Phase 2 (Data Volume):
 * - Reduced data for "total" time filter
 * - Optimized chart data aggregation
 * 
 * Phase 3 (Frontend):
 * - Staggered loading (basic → detailed)
 * - Progressive data display
 * - Auto-refresh every 2 minutes (background)
 * - Manual refresh button for immediate updates
 * - Data freshness indicators
 * - Charts independent of currency changes
 * - Loading timeout protection (8 seconds)
 * - Smart data memoization
 */
export default function Dashboard() {
  const dispatch = useDispatch();
  const {
    currencyList,
    rates,
    selectedSymbol,
  } = useSelector((s) => s.currency);
  const [timeFilter, setTimeFilter] = useState(() => {
    // Load time filter from localStorage for persistence
    const saved = localStorage.getItem('dashboard_timeFilter');
    return saved || "month";
  });
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  


  useEffect(() => {
    dispatch(fetchCurrencies());
    
    // Load saved currency from localStorage
    const savedCurrency = localStorage.getItem('dashboard_currency');
    if (savedCurrency && savedCurrency !== selectedSymbol) {
      dispatch(setSelectedSymbol(savedCurrency));
    }
  }, [dispatch, selectedSymbol]);

  // Debug logging (commented out to reduce console noise)
  // useEffect(() => {
  //   console.log("Currency State:", {
  //     currencyList: currencyList?.length || 0,
  //     rates: Object.keys(rates || {}).length,
  //     selectedSymbol,
  //     currencyStatus,
  //   });
  // }, [currencyList, rates, selectedSymbol, currencyStatus]);

  // Phase 3: Staggered Loading Implementation
  // Load basic stats first (FAST - 1-2 seconds)
  const { 
    data: basicStats = {}, 
    isLoading: basicLoading, 
    isError: isBasicError, 
    error: basicError,
    refetch: refetchBasic
  } = useQuery({
    queryKey: ["dashboard-basic", timeFilter],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/basic?timeFilter=${timeFilter}`);
      return data;
    },
    staleTime: 2 * 60 * 1000, // Data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    refetchIntervalInBackground: true, // Continue refreshing in background
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: true, // Always fetch fresh data on mount
    refetchOnReconnect: true, // Refresh when connection restored
    retry: 2, // Retry twice for reliability
    retryDelay: 1000, // Wait 1 second before retry
  });

  // Load detailed data after basic stats are ready
  const { 
    data: detailedStats = {}, 
    isLoading: detailedLoading, 
    isError: isDetailedError, 
    error: detailedError,
    refetch: refetchDetailed
  } = useQuery({
    queryKey: ["dashboard-detailed", timeFilter],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/detailed?timeFilter=${timeFilter}`);
      return data;
    },
    staleTime: 2 * 60 * 1000, // Data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    refetchIntervalInBackground: true, // Continue refreshing in background
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: true, // Always fetch fresh data on mount
    refetchOnReconnect: true, // Refresh when connection restored
    retry: 2, // Retry twice for reliability
    retryDelay: 1000, // Wait 1 second before retry
    // Only fetch after basic stats are loaded
    enabled: !!basicStats && Object.keys(basicStats).length > 0,
  });

  // Combine stats for backward compatibility
  const stats = { ...basicStats, ...detailedStats };
  const loading = basicLoading || detailedLoading;
  const isStatsError = isBasicError || isDetailedError;
  const statsError = basicError || detailedError;
  
  // Combined refetch function (for backward compatibility)
  // const refetch = async () => {
  //   await Promise.all([refetchBasic(), refetchDetailed()]);
  // };

  // Debug logging for dashboard stats (commented out to reduce console noise)
  // useEffect(() => {
  //   console.log("Dashboard Stats:", stats);
  //   console.log("Invoice Stats:", stats?.invoiceStats);
  //   console.log("Current Time Filter:", timeFilter);
  // }, [stats, timeFilter]);

  // Click outside handler for currency dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCurrencyOpen && !event.target.closest(".currency-dropdown")) {
        setIsCurrencyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCurrencyOpen]);

  const handleTimeFilterChange = (newTimeFilter) => {
    setTimeFilter(newTimeFilter);
    // Save to localStorage for persistence
    localStorage.setItem('dashboard_timeFilter', newTimeFilter);
  };

  const handleCurrencyChange = (symbol) => {
    if (symbol !== selectedSymbol) {
    dispatch(setSelectedSymbol(symbol));
    // Save to localStorage for persistence
    localStorage.setItem('dashboard_currency', symbol);
      // Close dropdown immediately
      setIsCurrencyOpen(false);
    }
  };

  // Manual refresh handler
  const handleManualRefresh = async () => {
    try {
      // Refresh both basic and detailed stats
      await Promise.all([
        refetchBasic(),
        refetchDetailed()
      ]);
      
      // Force update the timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Manual refresh failed:", error);
    }
  };

  // Helper function to format currency - only for Total Revenue card
  const formatRevenueCurrency = (amount, fromCurrency = "KES") => {
    if (!rates || !selectedSymbol || amount === 0) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "KES",
      }).format(amount || 0);
    }

    const targetCurrency = currencyList.find(
      (c) => c.symbol === selectedSymbol
    )?.code;
    if (!targetCurrency || targetCurrency === fromCurrency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "KES",
      }).format(amount || 0);
    }

    const rate = rates[targetCurrency];
    const convertedAmount = rate ? amount * rate : amount;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: targetCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedAmount || 0);
  };

  // Helper function to get time period text - memoized for performance
  const getTimePeriodText = useCallback((filter) => {
    switch (filter) {
      case "day":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      case "total":
        return "Total";
      default:
        return "This Month";
    }
  }, []);

  // Helper function to format time difference for last updated
  const getTimeDifference = (lastUpdate) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastUpdate) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Prepare chart data - memoized for performance and independent of currency
  // Chart data sources:
  // - Revenue chart: Gets data from payments/invoices (KES format, unaffected by currency)
  // - Top products: Gets data from product sales (unaffected by currency)
  // - Other data: From respective backend endpoints (unaffected by currency)
  const chartData = useMemo(() => {
    if (!stats?.chartData) return [];
          // Ensure chart data is not affected by currency changes
      const processedData = stats.chartData.map(item => ({
        ...item,
        revenue: item.revenue || 0, // Keep original revenue data in KES
        date: item.date
      }));
      return processedData;
  }, [stats?.chartData]);
  
  const topProducts = useMemo(() => stats?.topProducts || [], [stats?.topProducts]);
  const overdueInvoices = useMemo(() => stats?.overdueInvoices || [], [stats?.overdueInvoices]);
  const recentActivity = useMemo(() => stats?.recentActivity || [], [stats?.recentActivity]);

  // Colors for charts - memoized for performance
  const COLORS = useMemo(() => ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"], []);
  
  // Time filter periods - memoized for performance
  const timeFilterPeriods = useMemo(() => ["day", "week", "month", "year", "total"], []);
  
  

  // Data freshness tracking and loading timeout
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Update last updated timestamp when data changes
  useEffect(() => {
    if (stats && Object.keys(stats).length > 0) {
      setLastUpdated(new Date());
    }
  }, [stats?.timeFilter]); // Only update when timeFilter changes, not the entire stats object
  
  // Loading timeout protection
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 8000); // 8 seconds timeout
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
          {loadingTimeout && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Taking longer than expected?</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const error = isStatsError ? (statsError?.message || "Failed to load dashboard") : null;
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium">
          {typeof error === "string"
            ? error
            : error?.error || "An error occurred"}
        </div>
        <p className="text-gray-500 mt-2">Please try refreshing the page</p>
      </div>
    );
  }

  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-lg font-medium">
          No dashboard data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome to your control center
          </p>
          {stats.dateRange && (
            <p className="text-sm text-gray-500 mt-1">
              Showing data from{" "}
              {new Date(stats.dateRange.start).toLocaleDateString()} to{" "}
              {new Date(stats.dateRange.end).toLocaleDateString()}
            </p>
          )}
          {/* Auto-refresh indicator */}
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Auto-refreshing every 2 minutes</span>
            </div>
          </div>
          
          {/* Phase 3: Progressive Loading Indicator */}
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {basicLoading ? (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>Loading basic stats...</span>
                </>
              ) : detailedLoading ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Loading charts & details...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All data loaded</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Time filter, Currency selector, and Refresh controls */}
        <div className="flex items-center space-x-4">
          {/* Refresh Button and Last Updated Indicator */}
          <div className="flex flex-col items-center space-y-1">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm font-medium">Refresh</span>
            </button>
            
            {/* Last Updated Indicator - Now under the button */}
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Last updated: {getTimeDifference(lastUpdated)}</span>
            </div>
          </div>

          {/* Currency Dropdown */}
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <div className="relative currency-dropdown">
              <button
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="flex items-center justify-between w-[120px] bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer shadow-sm"
              >
                <span>{selectedSymbol || "KSh"}</span>
                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                    isCurrencyOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isCurrencyOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-auto">
                  {currencyList && currencyList.length > 0 ? (
                    currencyList.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => {
                          handleCurrencyChange(currency.symbol);
                          setIsCurrencyOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-150 ${
                          selectedSymbol === currency.symbol
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {currency.symbol}
                      </button>
                    ))
                  ) : (
                    // Fallback currencies if API hasn't loaded yet
                    [
                      { symbol: 'KSh', code: 'KES' },
                      { symbol: '$', code: 'USD' },
                      { symbol: '€', code: 'EUR' }
                    ].map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => {
                          handleCurrencyChange(currency.symbol);
                          setIsCurrencyOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-150 ${
                          selectedSymbol === currency.symbol
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {currency.symbol}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Time filter */}
          <div className="flex space-x-2">
            {timeFilterPeriods.map((period) => (
              <button
                key={period}
                onClick={() => handleTimeFilterChange(period)}
                className={`px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-colors ${
                  timeFilter === period
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center justify-between">
              <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Revenue
              </div>
              {/* Background refresh indicator */}
              {loading && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Updating...</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-900">
              {formatRevenueCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              {timeFilter === "total" ? "All Time" : getTimePeriodText(timeFilter)}
            </p>
          </CardContent>
        </Card>

        {/* Total Invoices */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {stats.invoiceStats?.totalInvoices || 0}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {timeFilter === "total" ? "All Time" : getTimePeriodText(timeFilter)}
            </p>
          </CardContent>
        </Card>

        {/* New Customers */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              New Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {stats.newCustomers || 0}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {timeFilter === "total" ? "All Time" : getTimePeriodText(timeFilter)}
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {stats.lowStock || 0}
            </div>
            <p className="text-xs text-red-600 mt-1">Items need reordering</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <p className="text-sm text-gray-500">
              {timeFilter === "total" ? "All Time" : getTimePeriodText(timeFilter)} - Revenue (
              {selectedSymbol || "KSh"})
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {chartData && chartData.length > 0 ? (
              <div className="w-full h-[400px] overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    data={chartData}
                    margin={{ top: 20, right: 20, left: 20, bottom: timeFilter === "year" || timeFilter === "total" ? 140 : timeFilter === "month" ? 120 : 80 }}
                    style={{ zIndex: 1 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      angle={timeFilter === "day" ? 0 : timeFilter === "year" || timeFilter === "total" ? -45 : -45}
                      textAnchor={timeFilter === "day" ? "middle" : "end"}
                      height={timeFilter === "year" || timeFilter === "total" ? 120 : timeFilter === "month" ? 120 : 80}
                      interval={timeFilter === "month" ? "preserveStartEnd" : timeFilter === "year" || timeFilter === "total" ? 0 : 0}
                      tickLine={false}
                      axisLine={false}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      width={80}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [new Intl.NumberFormat("en-US", { style: "currency", currency: "KES" }).format(value), "Revenue"]}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />

                    {/* Bars */}
                    <Bar
                      dataKey="revenue"
                      barSize={timeFilter === "day" ? 40 : timeFilter === "month" ? 25 : timeFilter === "year" ? 20 : timeFilter === "total" ? 25 : 30}
                      fill="#10B981"
                      fillOpacity={0.8}
                      radius={[4, 4, 0, 0]}
                      name="Revenue"
                    />

                    {/* Line - Render after bars so it's visible on top */}
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#DC2626"
                      strokeWidth={4}
                      dot={{ fill: "#DC2626", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, stroke: "#DC2626", strokeWidth: 3, fill: "#fff" }}
                      name="Revenue"
                      connectNulls={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No revenue data available</p>
                  <p className="text-sm">Try selecting a different time period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <p className="text-sm text-gray-500">
              {timeFilter === "total" ? "All Time" : getTimePeriodText(timeFilter)} - By Quantity Sold
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts && topProducts.length > 0 ? (
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    layout="horizontal"
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis 
                      type="category" 
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      type="number"
                      tick={{ fontSize: 12 }}
                      width={60}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value) => [value, "Units Sold"]}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="sold" 
                      fill="#10B981" 
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No product sales data available</p>
                  <p className="text-sm">Try selecting a different time period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-sm text-gray-500">
              Latest invoices, payments, and customer activities
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "invoice"
                          ? "bg-blue-500"
                          : activity.type === "payment"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">
                        {activity.text}
                      </span>
                      {activity.customer && (
                        <div className="text-xs text-gray-500">
                          Customer: {activity.customer}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-red-500" />
              Overdue Invoices
            </CardTitle>
            <p className="text-sm text-gray-500">Invoices past due date</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueInvoices.length > 0 ? (
                overdueInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div>
                      <div className="font-medium text-red-900">
                        Invoice #{invoice.id}
                      </div>
                      {invoice.Customer && (
                        <div className="text-sm text-red-600">
                          Customer: {invoice.Customer.name}
                        </div>
                      )}
                      <div className="text-sm text-red-600">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="destructive">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "KES" }).format(invoice.total)}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No overdue invoices</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
