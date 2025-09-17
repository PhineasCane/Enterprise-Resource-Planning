import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchInvoiceList = createAsyncThunk(
  "invoices/fetchList",
  async ({ page, pageSize, search }, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/invoices", {
        params: { page, pageSize, search },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchInvoiceById = createAsyncThunk(
  "invoices/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/invoices/${id}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createInvoice = createAsyncThunk(
  "invoices/create",
  async (invoice, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/invoices", invoice);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateInvoice = createAsyncThunk(
  "invoices/update",
  async ({ id, data: changes }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/invoices/${id}`, changes);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  "invoices/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/invoices/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const invoicesSlice = createSlice({
  name: "invoices",
  initialState: {
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: null,
    currentInvoice: null,
    currentInvoiceLoading: false,
    currentInvoiceError: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoiceList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceList.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.items;
        state.total = payload.total;
        state.page = payload.page;
        state.pageSize = payload.pageSize;
      })
      .addCase(fetchInvoiceList.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      .addCase(fetchInvoiceById.pending, (state) => {
        state.currentInvoiceLoading = true;
        state.currentInvoiceError = null;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, { payload }) => {
        state.currentInvoiceLoading = false;
        state.currentInvoice = payload;
      })
      .addCase(fetchInvoiceById.rejected, (state, { payload }) => {
        state.currentInvoiceLoading = false;
        state.currentInvoiceError = payload;
      })

      .addCase(createInvoice.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
        state.total += 1;
      })
      .addCase(updateInvoice.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((inv) => inv.id === payload.id);
        if (idx !== -1) state.list[idx] = payload;
        state.currentInvoice = payload;
      })
      .addCase(deleteInvoice.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((inv) => inv.id !== payload);
        state.total -= 1;
      });
  },
});

export default invoicesSlice.reducer;
