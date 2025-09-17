import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { stockIn, stockOut } from "../../store/slices/inventorySlice";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Package, TrendingUp, TrendingDown } from "lucide-react";

export default function InventoryForm({ isOpen, onClose, inventory, onSuccess }) {
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.products);
  const { status, error } = useSelector((state) => state.inventory);
  const [formData, setFormData] = useState({
    productId: "",
    type: "in", // 'in' for stock in, 'out' for stock out
    amount: "",
    reason: "",
    reference: "",
    notes: ""
  });

  useEffect(() => {
    if (inventory) {
      setFormData({
        productId: inventory.productId?.toString() || "",
        type: "in",
        amount: "",
        reason: "",
        reference: "",
        notes: ""
      });
    } else {
      setFormData({
        productId: "",
        type: "in",
        amount: "",
        reason: "",
        reference: "",
        notes: ""
      });
    }
  }, [inventory]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const selectedProduct = products.find(p => p.id.toString() === formData.productId);
      
      if (!selectedProduct) {
        alert("Please select a valid product");
        return;
      }

      const operationData = {
        productId: parseInt(formData.productId),
        productName: selectedProduct.name,
        amount: parseInt(formData.amount),
        reason: formData.reason,
        reference: formData.reference,
        notes: formData.notes
      };

      // Call the appropriate inventory operation
      if (formData.type === 'in') {
        // Stock In operation
        await dispatch(stockIn(operationData)).unwrap();
      } else {
        // Stock Out operation
        await dispatch(stockOut(operationData)).unwrap();
      }

      onSuccess();
    } catch (error) {
      console.error('Error performing inventory operation:', error);
      alert('Error performing inventory operation: ' + error.message);
    }
  };

  const getReasons = (type) => {
    if (type === 'in') {
      return [
        { value: 'Stock In', label: 'Stock In' },
        { value: 'Purchase', label: 'Purchase' },
        { value: 'Return', label: 'Customer Return' },
        { value: 'Adjustment', label: 'Stock Adjustment' },
        { value: 'Transfer', label: 'Transfer In' }
      ];
    } else {
      return [
        { value: 'Invoice Sale', label: 'Invoice Sale' },
        { value: 'Stock Out', label: 'Stock Out' },
        { value: 'Damage', label: 'Damaged/Lost' },
        { value: 'Adjustment', label: 'Stock Adjustment' },
        { value: 'Transfer', label: 'Transfer Out' }
      ];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {inventory ? "Edit Inventory" : "New Inventory Operation"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="productId">Product *</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => handleInputChange('productId', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>{product.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {product.inventory?.quantity || 0} in stock
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operation Type */}
          <div className="space-y-2">
            <Label>Operation Type *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.type === 'in' ? 'default' : 'outline'}
                onClick={() => handleInputChange('type', 'in')}
                className="flex-1"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Stock In
              </Button>
              <Button
                type="button"
                variant={formData.type === 'out' ? 'default' : 'outline'}
                onClick={() => handleInputChange('type', 'out')}
                className="flex-1"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Stock Out
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Quantity *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter quantity"
              required
              className="mt-1"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => handleInputChange('reason', value)}
              required
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {getReasons(formData.type).map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => handleInputChange('reference', e.target.value)}
              placeholder="e.g., Invoice #123, PO #456"
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this operation"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-8 border-t border-gray-200 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex items-center gap-2 min-w-[120px] bg-blue-600 hover:bg-blue-700"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                'Processing...'
              ) : (
                <>
                  {formData.type === 'in' ? (
                    <>
                      <TrendingUp className="h-4 w-4" />
                      Stock In
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4" />
                      Stock Out
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
