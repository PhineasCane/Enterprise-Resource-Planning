import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function Chart({ data }) {
  // Check if we have valid data
  if (!data || !data.revenue || !data.expenses) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Chart Data Available</div>
          <div className="text-sm">Chart will appear when revenue and expense data is available</div>
        </div>
      </div>
    );
  }

  // Transform data for the chart
  const chartData = [
    { name: 'Revenue', value: data.revenue || 0, type: 'revenue' },
    { name: 'Expenses', value: data.expenses || 0, type: 'expenses' },
  ];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
          labelStyle={{ fontWeight: 'bold' }}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#10b981" 
          strokeWidth={3}
          dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
          activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
