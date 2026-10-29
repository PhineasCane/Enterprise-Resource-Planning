import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createProduct, updateProduct } from "../../store/slices/productsSlice";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export default function ProductsForm({ isOpen, onClose, editProduct, onSuccess }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.products);
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    costPrice: "",
    pricePer: "",
    unit: "pcs",
    status: "active"
  });

  useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name || "",
        sku: editProduct.sku || "",
        description: editProduct.description || "",
        costPrice: editProduct.costPrice || "",
        pricePer: editProduct.pricePer || "",
        unit: editProduct.unit || "pcs",
        status: editProduct.status || "active"
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        description: "",
        costPrice: "",
        pricePer: "",
        unit: "pcs",
        status: "active"
      });
    }
  }, [editProduct]);

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
    
    if (!formData.name || !formData.pricePer) {
      alert("Name and Selling Price per unit are required");
      return;
    }

    try {
      if (editProduct) {
        await dispatch(updateProduct({ id: editProduct.id, ...formData })).unwrap();
      } else {
        await dispatch(createProduct(formData)).unwrap();
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {editProduct ? "Edit Product" : "New Product"}
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
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU / Item Code</Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. PRD-001"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit of Measure</Label>
              <Input
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="pcs, kg, box, carton..."
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter product description"
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="costPrice">Cost Price (KSh)</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={handleChange}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pricePer">Selling Price (KSh) *</Label>
              <Input
                id="pricePer"
                name="pricePer"
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePer}
                onChange={handleChange}
                placeholder="0.00"
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger className="mt-1 cursor-pointer">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              className="flex-1 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Saving..." : (editProduct ? "Update Product" : "Create Product")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
