// src/features/currency/currencySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Fetch currency data (default currency, list, rates) from backend
export const fetchCurrencies = createAsyncThunk(
  "currency/fetchCurrencies",
  async () => {
    const res = await api.get("/currency/currencies"); // backend route
    return res.data; // { defaultCurrency, currencyList, rates }
  }
);

const currencySlice = createSlice({
  name: "currency",
  initialState: {
    defaultCurrency: null,
    currencyList: [],
    rates: {},
    selectedSymbol: 'KSh', // Set KSh as default
    status: "idle",
    error: null,
  },
  reducers: {
    setSelectedSymbol: (state, action) => {
      state.selectedSymbol = action.payload; // e.g. 'KSh', '$'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrencies.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.defaultCurrency = action.payload.defaultCurrency;
        state.currencyList = action.payload.currencyList;
        state.rates = action.payload.rates;

        // Automatically set the default symbol (from KES in backend)
        const defaultCurrencyData = action.payload.currencyList.find(
          (c) => c.code === action.payload.defaultCurrency
        );
        if (defaultCurrencyData) {
          state.selectedSymbol = defaultCurrencyData.symbol;
        }
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { setSelectedSymbol } = currencySlice.actions;

export default currencySlice.reducer;
