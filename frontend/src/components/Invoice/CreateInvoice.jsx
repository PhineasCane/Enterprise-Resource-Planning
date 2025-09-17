import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { createInvoice } from "../../store/slices/invoicesSlice";

const CreateInvoice = ({ formData, onSuccess }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateInvoice = async () => {
    if (!formData) {
      alert("No form data available");
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate final totals
      const finalData = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          total: Number(item.quantity || 0) * Number(item.pricePer || 0)
        }))
      };

      await dispatch(createInvoice(finalData)).unwrap();
      
      alert("Invoice created successfully!");
      
      if (onSuccess) {
        onSuccess(finalData);
      } else {
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(error.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-end space-x-4 mt-6">
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate('/invoices')}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      
      <Button
        type="button"
        onClick={handleCreateInvoice}
        disabled={isSubmitting}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isSubmitting ? "Creating..." : "Create Invoice"}
      </Button>
    </div>
  );
};

export default CreateInvoice;
