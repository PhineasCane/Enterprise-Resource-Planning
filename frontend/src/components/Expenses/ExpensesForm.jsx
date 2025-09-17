import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createExpense, updateExpense } from "../../store/slices/expensesSlice";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export default function ExpensesForm({ isOpen, onClose, editExpense, onSuccess }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.expenses);
  
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    description: "",
    date: "",
    vendor: ""
  });

  useEffect(() => {
    if (editExpense) {
      console.log('Loading edit expense data:', editExpense);
      console.log('Category from editExpense:', editExpense.category);
      console.log('Date from editExpense:', editExpense.date);
      
      // Handle date conversion properly
      let formattedDate = "";
      if (editExpense.date) {
        try {
          const dateObj = new Date(editExpense.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split('T')[0];
          }
        } catch (error) {
          console.error('Error parsing date:', error);
          formattedDate = new Date().toISOString().split('T')[0];
        }
      }
      
      setFormData({
        category: editExpense.category || "",
        amount: editExpense.amount || "",
        description: editExpense.description || "",
        date: formattedDate,
        vendor: editExpense.vendor || ""
      });
      
      console.log('Form data set to:', {
        category: editExpense.category || "",
        amount: editExpense.amount || "",
        description: editExpense.description || "",
        date: formattedDate,
        vendor: editExpense.vendor || ""
      });
    } else {
      setFormData({
        category: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        vendor: ""
      });
    }
  }, [editExpense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount || !formData.description || !formData.date) {
      alert("Category, Amount, Description, and Date are required");
      return;
    }

    try {
      console.log('Submitting expense data:', formData);
      if (editExpense) {
        console.log('Updating expense with ID:', editExpense.id);
        await dispatch(updateExpense({ id: editExpense.id, data: formData })).unwrap();
      } else {
        console.log('Creating new expense');
        await dispatch(createExpense(formData)).unwrap();
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Error saving expense. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {editExpense ? "Edit Expense" : "New Expense"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            ✕
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the expense"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="vendor">Vendor</Label>
            <Input
              id="vendor"
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
              placeholder="Vendor name (optional)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                editExpense ? "Update Expense" : "Create Expense"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
