// src/store/slices/inventorySlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Thunks for CRUD operations
export const fetchInventory = createAsyncThunk(
  "inventory/fetchInventory",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/inventory");
      // The backend returns { items, total, page, pageSize }
      // We need to extract the items array
      return response.data.items || response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const fetchInventoryMovements = createAsyncThunk(
  "inventory/fetchMovements",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/inventory/movements");
      // The backend returns { items, total, page, pageSize }
      // We need to extract the items array
      return response.data.items || response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const createInventoryMovement = createAsyncThunk(
  "inventory/createMovement",
  async (movement, thunkAPI) => {
    try {
      const response = await api.post("/inventory/movements", movement);
      return response.data; // Expect the created movement with ID
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

// Stock operations
export const stockIn = createAsyncThunk(
  "inventory/stockIn",
  async (stockData, thunkAPI) => {
    try {
      const response = await api.post("/inventory/stock-in", stockData);
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const stockOut = createAsyncThunk(
  "inventory/stockOut",
  async (stockData, thunkAPI) => {
    try {
      const response = await api.post("/inventory/stock-out", stockData);
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    items: [],
    movements: [],
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    clearInventoryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchInventory.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Ensure we always have an array, even if the API response is unexpected
        state.items = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.items = []; // Reset to empty array on error
      })
      // Fetch movements
      .addCase(fetchInventoryMovements.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchInventoryMovements.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Ensure we always have an array, even if the API response is unexpected
        state.movements = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchInventoryMovements.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.movements = []; // Reset to empty array on error
      })
      // Create movement
      .addCase(createInventoryMovement.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createInventoryMovement.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.movements.unshift(action.payload);
        state.error = null;
      })
      .addCase(createInventoryMovement.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Stock In
      .addCase(stockIn.pending, (state) => {
        state.status = "loading";
      })
      .addCase(stockIn.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Update inventory item quantity
        const inventoryItem = state.items.find(item => item.productId === action.payload.inventory.productId);
        if (inventoryItem) {
          inventoryItem.quantity = action.payload.inventory.quantity;
        }
        // Add movement record
        state.movements.unshift(action.payload.movement);
        state.error = null;
      })
      .addCase(stockIn.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Stock Out
      .addCase(stockOut.pending, (state) => {
        state.status = "loading";
      })
      .addCase(stockOut.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Update inventory item quantity
        const inventoryItem = state.items.find(item => item.productId === action.payload.inventory.productId);
        if (inventoryItem) {
          inventoryItem.quantity = action.payload.inventory.quantity;
        }
        // Add movement record
        state.movements.unshift(action.payload.movement);
        state.error = null;
      })
      .addCase(stockOut.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearInventoryError } = inventorySlice.actions;

export default inventorySlice.reducer;
