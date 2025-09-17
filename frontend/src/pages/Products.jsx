import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductList,
  deleteProduct,
} from "../store/slices/productsSlice";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2,
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  Tag
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import ProductsForm from "../components/Products/ProductsForm";

export default function Products() {
  const dispatch = useDispatch();
  const { list, total, page, pageSize, loading } = useSelector(
    (s) => s.products
  );

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    dispatch(fetchProductList({ page, pageSize, search }));
  }, [dispatch, page, pageSize, search]);

  const handlePageChange = (newPage) =>
    dispatch(fetchProductList({ page: newPage + 1, pageSize, search }));

  const handleOpenForm = () => {
    setEditProduct(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditProduct(null);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    dispatch(fetchProductList({ page, pageSize, search }));
    handleCloseForm();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'discontinued':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Discontinued</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog and pricing</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer" onClick={handleOpenForm}>
          <Plus className="h-5 w-5 mr-2" />
          New Product
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
            <div className="text-2xl font-bold">{total || 0}</div>
            <p className="text-xs text-muted-foreground">All products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {list?.filter(product => product.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {(() => {
                const totalRevenue = list?.reduce((sum, product) => {
                  const totalPrice = Number(product.totalPrice) || 0;
                  const currentSum = Number(sum) || 0;
                  return currentSum + totalPrice;
                }, 0) || 0;
                
                if (isNaN(totalRevenue)) {
                  return 'KSh 0.00';
                }
                
                return formatCurrency(totalRevenue);
              })()}
            </div>
            <p className="text-xs text-muted-foreground">Combined value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {list?.reduce((sum, product) => sum + (product.quantity || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">In stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button variant="outline" className="border-gray-300">
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${list?.length || 0} products found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Quantity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Price per</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Total Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list?.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">#{product.id}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center">
                        <span className={product.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                          {product.quantity}
                        </span>
                        {product.quantity === 0 && (
                          <AlertTriangle className="h-4 w-4 ml-1 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{formatCurrency(product.pricePer || product.price || 0)}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{formatCurrency(product.totalPrice || 0)}</td>
                    <td className="py-3 px-4">{getStatusBadge(product.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(product)}
                          className="h-8 w-8 p-0 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dispatch(deleteProduct(product.id))}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && list?.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 2)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-2 text-sm text-gray-600">
                  Page {page} of {Math.ceil(total / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  disabled={page >= Math.ceil(total / pageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Form Drawer */}
      <ProductsForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editProduct={editProduct}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
