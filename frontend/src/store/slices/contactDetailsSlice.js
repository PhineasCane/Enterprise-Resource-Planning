import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchContactDetails = createAsyncThunk("contactDetails/fetch", async () => {
  const { data } = await api.get("/contact-details");
  return data;
});

export const createContactDetail = createAsyncThunk("contactDetails/create", async (payload) => {
  const { data } = await api.post("/contact-details", payload);
  return data;
});

export const updateContactDetail = createAsyncThunk("contactDetails/update", async ({ id, changes }) => {
  const { data } = await api.patch(`/contact-details/${id}`, changes);
  return data;
});

export const deleteContactDetail = createAsyncThunk("contactDetails/delete", async (id) => {
  await api.delete(`/contact-details/${id}`);
  return id;
});

const slice = createSlice({
  name: "contactDetails",
  initialState: { list: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContactDetails.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchContactDetails.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.list = payload || [];
      })
      .addCase(fetchContactDetails.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      })
      .addCase(createContactDetail.fulfilled, (state, { payload }) => {
        state.list.unshift(payload);
      })
      .addCase(updateContactDetail.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((r) => r.id === payload.id);
        if (idx !== -1) state.list[idx] = payload;
      })
      .addCase(deleteContactDetail.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((r) => r.id !== payload);
      });
  },
});

export default slice.reducer;


