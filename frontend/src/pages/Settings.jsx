import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Plus, Users, Building2, Settings as SettingsIcon, Contact, Banknote } from "lucide-react";
import BusinessProfileForm from "../components/Settings/BusinessProfileForm";
import ContactDetailsForm from "../components/Settings/ContactDetailsForm";
import PaymentDetailsForm from "../components/Settings/PaymentDetailsForm";
import UserManagement from "../components/Settings/UserManagement";

export default function Settings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("business-profile");

  // Check if user has permission to manage users
  const canManageUsers = user?.role === "Admin" || user?.role === "Manager" || user?.role === "admin" || user?.role === "manager";

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-gray-600">
          Manage your business profile and user accounts
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[900px]">
          <TabsTrigger value="business-profile" className="flex items-center gap-2 cursor-pointer">
            <Building2 className="h-4 w-4" />
            Business Profile
          </TabsTrigger>
          <TabsTrigger value="contact-details" className="flex items-center gap-2 cursor-pointer">
            <Contact className="h-4 w-4" />
            Contact Details
          </TabsTrigger>
          <TabsTrigger value="payment-details" className="flex items-center gap-2 cursor-pointer">
            <Banknote className="h-4 w-4" />
            Payment Details
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            User Management
            {!canManageUsers && (
              <Badge variant="secondary" className="ml-1">
                Admin Only
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business-profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Business Profile
              </CardTitle>
              <CardDescription>
                Update your business information, contact details, and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact-details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Contact className="h-5 w-5 text-blue-600" />
                Contact & Departments
              </CardTitle>
              <CardDescription>
                Manage company contacts (name, email, telephone, department)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactDetailsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-blue-600" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Manage bank account details used for receiving payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentDetailsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {canManageUsers ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-500">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Access restricted to administrators and managers
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  You don't have permission to access user management.
                </p>
                <p className="text-sm text-gray-400">
                  Contact your administrator to request access.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
