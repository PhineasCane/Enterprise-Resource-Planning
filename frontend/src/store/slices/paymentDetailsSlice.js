import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchPaymentDetails = createAsyncThunk("paymentDetails/fetch", async () => {
  const { data } = await api.get("/payment-details");
  return data;
});

export const createPaymentDetail = createAsyncThunk("paymentDetails/create", async (payload) => {
  const { data } = await api.post("/payment-details", payload);
  return data;
});

export const updatePaymentDetail = createAsyncThunk("paymentDetails/update", async ({ id, changes }) => {
  const { data } = await api.patch(`/payment-details/${id}`, changes);
  return data;
});

export const deletePaymentDetail = createAsyncThunk("paymentDetails/delete", async (id) => {
  await api.delete(`/payment-details/${id}`);
  return id;
});

const slice = createSlice({
  name: "paymentDetails",
  initialState: { list: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentDetails.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPaymentDetails.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.list = payload || [];
      })
      .addCase(fetchPaymentDetails.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      })
      .addCase(createPaymentDetail.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
      })
      .addCase(updatePaymentDetail.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((r) => r.id === payload.id);
        if (idx !== -1) state.list[idx] = payload;
      })
      .addCase(deletePaymentDetail.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((r) => r.id !== payload);
      });
  },
});

export default slice.reducer;


