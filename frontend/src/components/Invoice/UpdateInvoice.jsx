import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProducts } from "../../store/slices/productsSlice";
import { fetchCustomers } from "../../store/slices/customersSlice";
import { fetchInvoiceById, updateInvoice } from "../../store/slices/invoicesSlice";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

const UpdateInvoice = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { products } = useSelector((state) => state.products);
  const { list: customers } = useSelector((state) => state.customers);
  const { currentInvoice } = useSelector((state) => state.invoices);
  
  const [formData, setFormData] = useState({
    customerId: "",
    number: "",
    year: "",
    date: "",
    dueDate: "",
    status: "draft",
    notes: "",
    taxRate: "0",
    items: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load invoice data on component mount
  useEffect(() => {
    if (id) {
      dispatch(fetchInvoiceById(id));
    }
  }, [dispatch, id]);

  // Load products and customers
  useEffect(() => {
    dispatch(fetchProducts({ page: 1, pageSize: 100, search: "" }));
    dispatch(fetchCustomers({ page: 1, pageSize: 100, search: "" }));
  }, [dispatch]);

  // Update form when invoice data loads
  useEffect(() => {
    if (currentInvoice) {
      setFormData({
        customerId: currentInvoice.customerId?.toString() || "",
        number: currentInvoice.number || "",
        year: currentInvoice.year?.toString() || new Date().getFullYear().toString(),
        date: currentInvoice.date || new Date().toISOString().split('T')[0],
        dueDate: currentInvoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: currentInvoice.status || "draft",
        notes: currentInvoice.notes || "",
        taxRate: currentInvoice.taxRate?.toString() || "0",
        items: currentInvoice.items?.map(item => ({
          productId: item.productId?.toString() || "",
          quantity: item.quantity?.toString() || "1",
          pricePer: item.Product?.pricePer?.toString() || item.pricePer?.toString() || "0"
        })) || []
      });
    }
  }, [currentInvoice]);

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

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: "1", pricePer: "0" }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const getProductPrice = (productId) => {
    const product = products?.find(p => p.id.toString() === productId);
    return product ? product.pricePer : 0;
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const pricePer = parseFloat(item.pricePer) || 0;
      return sum + (quantity * pricePer);
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const taxRate = parseFloat(formData.taxRate) || 0;
    return subtotal * (taxRate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    return subtotal + tax;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerId || formData.items.length === 0) {
      alert("Please select a customer and add at least one item");
      return;
    }

    // Validate items
    for (const item of formData.items) {
      if (!item.productId || !item.quantity || !item.pricePer) {
        alert("Please fill in all item fields");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const invoiceData = {
        customerId: parseInt(formData.customerId),
        year: parseInt(formData.year),
        date: formData.date,
        dueDate: formData.dueDate,
        status: formData.status,
        notes: formData.notes,
        taxRate: parseFloat(formData.taxRate) || 0,
        items: formData.items.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          pricePer: parseFloat(item.pricePer)
        }))
      };

      await dispatch(updateInvoice({ id: parseInt(id), data: invoiceData })).unwrap();
      
      alert("Invoice updated successfully!");
      navigate('/invoices');
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert("Error updating invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate('/invoices');
  };

  if (!currentInvoice) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading invoice...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-semibold">
                Edit Invoice #{currentInvoice.number}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {(!products || !customers) ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">Loading products and customers...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="customerId">Customer *</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) => handleSelectChange("customerId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers && customers.length > 0 ? customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        )) : (
                          <SelectItem value="no-customers" disabled>No customers available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="number">Invoice Number</Label>
                    <Input
                      id="number"
                      name="number"
                      value={formData.number}
                      onChange={handleChange}
                      className="bg-gray-50"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Invoice number cannot be changed
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      value={formData.year}
                      onChange={handleChange}
                      min="2020"
                      max="2030"
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
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      name="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.taxRate}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <Label className="text-lg font-medium">Invoice Items</Label>
                    <Button
                      type="button"
                      onClick={addItem}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                    
                  {formData.items.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-lg">No items added yet. Click "Add Item" to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg bg-gray-50">
                          <div className="col-span-4">
                            <Label>Product *</Label>
                            <Select
                              value={item.productId}
                              onValueChange={(value) => {
                                updateItem(index, "productId", value);
                                updateItem(index, "pricePer", getProductPrice(value).toString());
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products && products.length > 0 ? products.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    <div className="flex items-center justify-between">
                                      <span>{product.name}</span>
                                      <span className="text-sm text-gray-500">
                                        Stock: {product.quantity || 0}
                                      </span>
                                    </div>
                                  </SelectItem>
                                )) : (
                                  <SelectItem value="no-products" disabled>No products available</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-2">
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", e.target.value)}
                              required
                            />
                          </div>
                           
                          <div className="col-span-2">
                            <Label>Price per Unit *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.pricePer}
                              onChange={(e) => updateItem(index, "pricePer", e.target.value)}
                              required
                            />
                          </div>
                           
                          <div className="col-span-2">
                            <Label>Total</Label>
                            <Input
                              type="text"
                              value={`KSh ${((parseFloat(item.quantity) || 0) * (parseFloat(item.pricePer) || 0)).toFixed(2)}`}
                              readOnly
                              className="bg-gray-100 font-medium"
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <Button
                              type="button"
                              onClick={() => removeItem(index)}
                              variant="outline"
                              size="sm"
                              className="w-full text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                    
                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional notes for this invoice"
                    rows={4}
                  />
                </div>
                    
                {/* Totals */}
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-lg">Subtotal:</span>
                    <span className="font-semibold text-lg">KSh {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-lg">Tax ({formData.taxRate}%):</span>
                    <span className="font-semibold text-lg">KSh {calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-xl font-bold">Total:</span>
                    <span className="text-xl font-bold text-blue-600">KSh {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    className="flex-1 py-3 text-lg bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Invoice
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 py-3 text-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateInvoice;
