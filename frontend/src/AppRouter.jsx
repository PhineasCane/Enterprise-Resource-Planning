import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Layout from "./components/Layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import Payments from "./pages/Payments";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import InvoiceForm from "./components/Invoice/InvoiceForm";
import PaymentsForm from "./components/Payments/PaymentsForm";
import UpdateInvoice from "./components/Invoice/UpdateInvoice";
import InvoicePreview from "./components/Invoice/InvoicePreview";

function Protected({ children }) {
  const token = useSelector((state) => state.auth.token);
  return token ? children : <Navigate to="/login" />;
}

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="/"
          element={
            <Protected>
              <Layout>
                <Dashboard />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="invoices"
          element={
            <Protected>
              <Layout>
                <Invoices />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="invoices/new"
          element={
            <Protected>
              <Layout>
                <InvoiceForm />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="invoices/edit/:id"
          element={
            <Protected>
              <Layout>
                <UpdateInvoice />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="invoices/view/:id"
          element={
            <Protected>
              <Layout>
                <InvoicePreview isFullPage={true} />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="invoices/pay"
          element={
            <Protected>
              <Layout>
                <PaymentsForm />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="customers"
          element={
            <Protected>
              <Layout>
                <Customers />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="payments"
          element={
            <Protected>
              <Layout>
                <Payments />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="products"
          element={
            <Protected>
              <Layout>
                <Products />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="inventory"
          element={
            <Protected>
              <Layout>
                <Inventory />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="expenses"
          element={
            <Protected>
              <Layout>
                <Expenses />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="reports"
          element={
            <Protected>
              <Layout>
                <Reports />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="settings"
          element={
            <Protected>
              <Layout>
                <Settings />
              </Layout>
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}
