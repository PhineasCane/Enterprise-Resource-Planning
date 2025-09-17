import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Plus, 
  Search, 
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Box,
  BarChart3,
  CheckCircle,
  Package,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import {
  fetchInventory,
  fetchInventoryMovements,
} from "../store/slices/inventorySlice";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import InventoryForm from "../components/Inventory/InventoryForm";

export default function Inventory() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector(
    (s) => s.inventory
  );
  const loading = status === "loading";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedInventory, setSelectedInventory] = useState(null);

  useEffect(() => {
    dispatch(fetchInventory());
    dispatch(fetchInventoryMovements());
  }, [dispatch]);

  const handleOpenForm = (inventory = null) => {
    setSelectedInventory(inventory);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedInventory(null);
  };

  const handleSuccess = () => {
    // Refresh inventory data after successful operation
    dispatch(fetchInventory());
    dispatch(fetchInventoryMovements());
    handleCloseForm();
  };

  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity <= reorderLevel) {
      return (
        <Badge variant="destructive" className="flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Low Stock
        </Badge>
      );
    } else if (quantity <= reorderLevel * 1.5) {
      return (
        <Badge variant="warning" className="flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Medium
        </Badge>
      );
    } else {
      return (
        <Badge variant="success" className="flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Good
        </Badge>
      );
    }
  };

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];
  
  const filteredItems = safeItems.filter(item => 
    item.productId?.toString().includes(search) || 
    item.quantity?.toString().includes(search) ||
    item.productName?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = safeItems.filter(item => item.quantity <= item.reorderLevel) || [];
  const totalValue = safeItems.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor stock levels and manage inventory operations
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          Stock Operation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Products in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue}</div>
            <p className="text-xs text-muted-foreground">
              Total units in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Below reorder level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Status</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeItems.length > 0 ? Math.round((safeItems.filter(item => item.quantity > item.reorderLevel).length / safeItems.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Products with good stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Current stock levels and status for all products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {search ? 'No inventory items found matching your search.' : 'No inventory items found.'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.productName || `Product ${item.productId}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {item.productId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.quantity || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {item.reorderLevel || 5}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStockStatus(item.quantity, item.reorderLevel)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenForm(item)}
                            className="flex items-center gap-1"
                          >
                            <TrendingUp className="h-3 w-3" />
                            Stock In
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenForm(item)}
                            className="flex items-center gap-1"
                          >
                            <TrendingDown className="h-3 w-3" />
                            Stock Out
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Inventory Form Drawer */}
      <InventoryForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        inventory={selectedInventory}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
