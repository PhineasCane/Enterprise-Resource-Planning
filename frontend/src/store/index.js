import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import businessProfileReducer from "./slices/businessProfileSlice";
import currencyReducer from "./slices/currencySlice";
import customersReducer from "./slices/customersSlice";
import dashboardReducer from "./slices/dashboardSlice";
import expensesReducer from "./slices/expensesSlice";
import inventoryReducer from "./slices/inventorySlice";
import invoicesReducer from "./slices/invoicesSlice";
import paymentsReducer from "./slices/paymentsSlice";
import productsReducer from "./slices/productsSlice";
import reportsReducer from "./slices/reportsSlice";
import settingsReducer from "./slices/settingsSlice";
import usersReducer from "./slices/usersSlice";
import contactDetailsReducer from "./slices/contactDetailsSlice";
import paymentDetailsReducer from "./slices/paymentDetailsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    businessProfile: businessProfileReducer,
    currency: currencyReducer,
    customers: customersReducer,
    dashboard: dashboardReducer,
    expenses: expensesReducer,
    inventory: inventoryReducer,
    invoices: invoicesReducer,
    payments: paymentsReducer,
    products: productsReducer,
    reports: reportsReducer,
    settings: settingsReducer,
    users: usersReducer,
    contactDetails: contactDetailsReducer,
    paymentDetails: paymentDetailsReducer,
  },
});

// Add default export
export default store;
