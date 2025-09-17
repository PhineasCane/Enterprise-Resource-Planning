import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchDashboard = createAsyncThunk(
  "dashboard/fetch",
  async (timeFilter = 'month', { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/dashboard?timeFilter=${timeFilter}`);
      
      // Check if the response contains an error object
      if (data && data.error) {
        return rejectWithValue(data);
      }
      
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    stats: {},
    loading: false,
    error: null,
    currentTimeFilter: 'month',
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.stats = payload;
        state.currentTimeFilter = payload.timeFilter || 'month';
      })
      .addCase(fetchDashboard.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });
  },
});

export default dashboardSlice.reducer;
