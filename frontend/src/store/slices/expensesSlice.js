import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchExpenseList = createAsyncThunk(
  "expenses/fetchList",
  async ({ page, pageSize, search }, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/expenses", {
        params: { page, pageSize, search },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createExpense = createAsyncThunk(
  "expenses/create",
  async (expense, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/expenses", expense);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateExpense = createAsyncThunk(
  "expenses/update",
  async ({ id, data: changes }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/expenses/${id}`, changes);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteExpense = createAsyncThunk(
  "expenses/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/expenses/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const expensesSlice = createSlice({
  name: "expenses",
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
      .addCase(fetchExpenseList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseList.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.items;
        state.total = payload.total;
        state.page = payload.page;
        state.pageSize = payload.pageSize;
      })
      .addCase(fetchExpenseList.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      .addCase(createExpense.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
        state.total += 1;
      })
      .addCase(updateExpense.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((e) => e.id === payload.id);
        if (idx !== -1) state.list[idx] = payload;
      })
      .addCase(deleteExpense.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((e) => e.id !== payload);
        state.total -= 1;
      });
  },
});

export default expensesSlice.reducer;
