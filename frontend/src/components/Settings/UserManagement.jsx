import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  deleteUser,
  getRoles,
  clearError,
  setCurrentPage,
} from "../../store/slices/usersSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
} from "lucide-react";
import UserForm from "./UserForm";

export default function UserManagement() {
  const dispatch = useDispatch();
  const { users, roles, loading, error, pagination } = useSelector(
    (state) => state.users
  );
  const { user: currentUser } = useSelector((state) => state.auth);


  // Check if user has permission to access user management
  const canAccessUserManagement =
    currentUser && ["Admin", "Manager"].includes(currentUser.role);

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (canAccessUserManagement) {
      dispatch(
        fetchUsers({
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          search,
        })
      );
      dispatch(getRoles());
    }
  }, [
    dispatch,
    pagination.currentPage,
    pagination.pageSize,
    search,
    canAccessUserManagement,
  ]);


  // Check permissions first
  if (!canAccessUserManagement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage system users and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 text-lg font-medium">Access Denied</p>
            <p className="text-gray-600 mt-2">
              You don't have permission to access user management. Only
              Administrators and Managers can access this feature.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSearch = (e) => {
    setSearch(e.target.value);
    dispatch(setCurrentPage(1)); // Reset to first page when searching
  };

  const handleOpenForm = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "",
      phone: "",
      address: "",
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "",
      phone: "",
      address: "",
    });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "",
      phone: user.phone || "",
      address: user.address || "",
    });
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    dispatch(
      fetchUsers({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        search,
      })
    );
    handleCloseForm();
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to deactivate this user?")) {
      dispatch(deleteUser(userId));
    }
  };

  const canEditUser = (user) => {
    if (currentUser.role === "Admin") return true;
    if (currentUser.role === "Manager" && user.role === "Staff") return true;
    return false;
  };

  const canDeleteUser = (user) => {
    if (currentUser.role === "Admin") return true;
    if (currentUser.role === "Manager" && user.role === "Staff") return true;
    return false;
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      Admin: "bg-red-100 text-red-800",
      Manager: "bg-blue-100 text-blue-800",
      Staff: "bg-green-100 text-green-800",
    };

    return (
      <Badge className={roleColors[role] || "bg-gray-100 text-gray-800"}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage system users and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch(clearError())}
                className="mt-2 text-red-600 hover:text-red-700"
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Search and Add User */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            <Button onClick={handleOpenForm} className="whitespace-nowrap cursor-pointer">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          <div className="rounded-md border">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!users || users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditUser(user) && (
                                <DropdownMenuItem
                                  onClick={() => handleEdit(user)}
                                >
                                  <Edit className="w-4 h-4 mr-3 text-gray-500" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDeleteUser(user) && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-3" />
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing {(pagination.currentPage - 1) * pagination.pageSize + 1}{" "}
                to{" "}
                {Math.min(
                  pagination.currentPage * pagination.pageSize,
                  pagination.totalItems
                )}{" "}
                of {pagination.totalItems} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    dispatch(setCurrentPage(pagination.currentPage - 1))
                  }
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    dispatch(setCurrentPage(pagination.currentPage + 1))
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Side Drawer Form */}
      <UserForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editUser={editingUser}
        onSuccess={handleFormSuccess}
        roles={roles}
      />
    </div>
  );
}
