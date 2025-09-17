import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchProductList = createAsyncThunk(
  "products/fetchList",
  async ({ page, pageSize, search }, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/products", {
        params: { page, pageSize, search },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Alias for fetchProductList to maintain compatibility
export const fetchProducts = fetchProductList;

export const createProduct = createAsyncThunk(
  "products/create",
  async (product, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/products", product);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ id, data: changes }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/products/${id}`, changes);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    list: [],
    products: [], // For inventory integration
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductList.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.items;
        state.products = payload.items; // Update products array for inventory
        state.total = payload.total;
        state.page = payload.page;
        state.pageSize = payload.pageSize;
      })
      .addCase(fetchProductList.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      .addCase(createProduct.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
        state.products.unshift(payload); // Update products array
        state.total += 1;
      })
      .addCase(updateProduct.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((p) => p.id === payload.id);
        if (idx !== -1) {
          state.list[idx] = payload;
          state.products[idx] = payload; // Update products array
        }
      })
      .addCase(deleteProduct.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((p) => p.id !== payload);
        state.products = state.products.filter((p) => p.id !== payload); // Update products array
        state.total -= 1;
      });
  },
});

export default productsSlice.reducer;
