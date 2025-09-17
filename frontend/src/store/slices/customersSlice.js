import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchCustomerList = createAsyncThunk(
  "customers/fetchList",
  async ({ page, pageSize, search }, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/customers", {
        params: { page, pageSize, search },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Alias for fetchCustomerList to maintain compatibility
export const fetchCustomers = fetchCustomerList;

export const createCustomer = createAsyncThunk(
  "customers/create",
  async (customer, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/customers", customer);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateCustomer = createAsyncThunk(
  "customers/update",
  async ({ id, data: changes }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/customers/${id}`, changes);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  "customers/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/customers/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const customersSlice = createSlice({
  name: "customers",
  initialState: {
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerList.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.items;
        state.total = payload.total;
        state.page = payload.page;
        state.pageSize = payload.pageSize;
      })
      .addCase(fetchCustomerList.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      .addCase(createCustomer.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
        state.total += 1;
      })
      .addCase(updateCustomer.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((c) => c.id === payload.id);
        if (idx !== -1) state.list[idx] = payload;
      })
      .addCase(deleteCustomer.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((c) => c.id !== payload);
        state.total -= 1;
      });
  },
});

export default customersSlice.reducer;
