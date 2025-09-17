import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Button } from "../ui/button";
import { createCustomer, updateCustomer } from "../../store/slices/customersSlice";

const CustomerForm = ({ isOpen, onClose, editCustomer, onSuccess }) => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when editCustomer changes
  useEffect(() => {
    if (editCustomer) {
      // Form will be populated with editCustomer data via defaultValue
    }
  }, [editCustomer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const form = e.target;
      const data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        address: form.address.value.trim(),
        country: form.country.value.trim(),
        city: form.city.value.trim(),
        postalCode: form.postalCode.value.trim(),
        isActive: form.isActive.checked,
      };

      // Validate required fields
      if (!data.name || !data.email || !data.phone || !data.city || !data.country) {
        alert('Please fill in all required fields (Name, Email, Phone, City, Country)');
        setIsSubmitting(false);
        return;
      }

      if (editCustomer) {
        await dispatch(updateCustomer({ id: editCustomer.id, data })).unwrap();
      } else {
        await dispatch(createCustomer(data)).unwrap();
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {editCustomer ? "Edit Customer" : "New Customer"}
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
        <form id="customer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              name="name"
              type="text"
              defaultValue={editCustomer?.name || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              name="email"
              type="email"
              defaultValue={editCustomer?.email || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              name="phone"
              type="tel"
              defaultValue={editCustomer?.phone || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              rows="3"
              defaultValue={editCustomer?.address || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                name="city"
                type="text"
                defaultValue={editCustomer?.city || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                name="postalCode"
                type="text"
                defaultValue={editCustomer?.postalCode || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
            <input
              name="country"
              type="text"
              defaultValue={editCustomer?.country || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={editCustomer?.isActive !== false}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="text-sm font-medium text-gray-700">Active Status</label>
          </div>
          <p className="text-xs text-gray-500">
            Active customers can be selected for invoices and other operations. Inactive customers are hidden from most lists.
          </p>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="customer-form"
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (editCustomer ? 'Update' : 'Create')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
