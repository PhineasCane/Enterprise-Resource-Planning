// src/store/slices/settingsSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

const API_URL = "/settings";

// Fetch paginated list
export const fetchSettingsList = createAsyncThunk(
  "settings/fetchList",
  async ({ page, pageSize, search }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API_URL, {
        params: { page, pageSize, search },
      });
      // Expected shape: { items: [...], total, page, pageSize }
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Create a new setting
export const createSetting = createAsyncThunk(
  "settings/create",
  async (setting, { rejectWithValue }) => {
    try {
      const { data } = await api.post(API_URL, setting);
      return data; // new record
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update an existing setting
export const updateSetting = createAsyncThunk(
  "settings/update",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`${API_URL}/${id}`, changes);
      return data; // updated record
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Delete a setting
export const deleteSetting = createAsyncThunk(
  "settings/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: null,
  },
  reducers: {
    // Optionally reset error
    clearSettingsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchSettingsList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettingsList.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.items;
        state.total = payload.total;
        state.page = payload.page;
        state.pageSize = payload.pageSize;
      })
      .addCase(fetchSettingsList.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // CREATE
      .addCase(createSetting.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
        state.total += 1;
      })

      // UPDATE
      .addCase(updateSetting.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((item) => item.id === payload.id);
        if (idx !== -1) state.list[idx] = payload;
      })

      // DELETE
      .addCase(deleteSetting.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((item) => item.id !== payload);
        state.total -= 1;
      });
  },
});

export const { clearSettingsError } = settingsSlice.actions;
export default settingsSlice.reducer;
