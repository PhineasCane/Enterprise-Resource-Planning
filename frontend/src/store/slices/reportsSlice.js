import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchReportData = createAsyncThunk(
  "reports/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/reports");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const reportsSlice = createSlice({
  name: "reports",
  initialState: {
    chartData: {},
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportData.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.chartData = payload;
      })
      .addCase(fetchReportData.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });
  },
});

export default reportsSlice.reducer;
