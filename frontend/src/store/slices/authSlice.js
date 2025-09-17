import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { setAuthToken } from "../../services/api";

const API_URL = "/auth";
const token = localStorage.getItem("token");
const cachedUserRaw = localStorage.getItem("user");
let cachedUser = null;
try {
  cachedUser = cachedUserRaw ? JSON.parse(cachedUserRaw) : null;
} catch (e) {
  cachedUser = null;
}

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`${API_URL}/login`, credentials);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (user, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`${API_URL}/register`, user);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${API_URL}/me`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: cachedUser,
    token: token || null,
    status: "idle",
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAuthToken(null);
    },
    setUser(state, { payload }) {
      state.user = payload || null;
      if (payload) {
        localStorage.setItem("user", JSON.stringify(payload));
      } else {
        localStorage.removeItem("user");
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.user = payload.user;
        state.token = payload.token;
        localStorage.setItem("token", payload.token);
        localStorage.setItem("user", JSON.stringify(payload.user));
        setAuthToken(payload.token);
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.user = payload.user;
        state.token = payload.token;
        localStorage.setItem("token", payload.token);
        localStorage.setItem("user", JSON.stringify(payload.user));
        setAuthToken(payload.token);
      })
      .addCase(register.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.user = payload.user;
        localStorage.setItem("user", JSON.stringify(payload.user));
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
