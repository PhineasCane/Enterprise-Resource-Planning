import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchPaymentList = createAsyncThunk(
  "payments/fetchList",
  async ({ page, pageSize, search }, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/payments", {
        params: { page, pageSize, search },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createPayment = createAsyncThunk(
  "payments/create",
  async (payment, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/payments", payment);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updatePayment = createAsyncThunk(
  "payments/update",
  async ({ id, data: changes }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/payments/${id}`, changes);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deletePayment = createAsyncThunk(
  "payments/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/payments/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const paymentsSlice = createSlice({
  name: "payments",
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
      .addCase(fetchPaymentList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentList.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.items;
        state.total = payload.total;
        state.page = payload.page;
        state.pageSize = payload.pageSize;
      })
      .addCase(fetchPaymentList.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      .addCase(createPayment.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
        state.total += 1;
      })
      .addCase(updatePayment.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((p) => p.id === payload.id);
        if (idx !== -1) state.list[idx] = payload;
      })
      .addCase(deletePayment.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((p) => p.id !== payload);
        state.total -= 1;
      });
  },
});

export default paymentsSlice.reducer;
