import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchBusinessProfile = createAsyncThunk(
  'businessProfile/fetchBusinessProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/business-profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch business profile');
    }
  }
);

export const createBusinessProfile = createAsyncThunk(
  'businessProfile/createBusinessProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add basic fields
      formData.append('name', profileData.name);
      
      // Add individual company fields
      if (profileData.settings) {
        Object.keys(profileData.settings).forEach(key => {
          const value = profileData.settings[key];
          if (value !== undefined && value !== null && value !== '' && key !== 'company_logo' && key !== 'logo_type' && key !== 'logo_name') {
            formData.append(key, value);
          }
        });
      }
      
      // Add logo data if a new file was selected
      if (profileData.company_logo) {
        formData.append('company_logo', profileData.company_logo);
        formData.append('company_logo_type', profileData.company_logo_type);
        formData.append('company_logo_name', profileData.company_logo_name);
      }
      
      const response = await api.post('/business-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create business profile');
    }
  }
);

export const updateBusinessProfile = createAsyncThunk(
  'businessProfile/updateBusinessProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      console.log('updateBusinessProfile thunk called with:', profileData);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add basic fields
      formData.append('name', profileData.name);
      
      // Add individual company fields
      if (profileData.settings) {
        Object.keys(profileData.settings).forEach(key => {
          const value = profileData.settings[key];
          if (value !== undefined && value !== null && value !== '' && key !== 'company_logo' && key !== 'logo_type' && key !== 'logo_name') {
            formData.append(key, value);
          }
        });
      }
      
      // Add logo data if a new file was selected
      if (profileData.company_logo) {
        formData.append('company_logo', profileData.company_logo);
        formData.append('company_logo_type', profileData.company_logo_type);
        formData.append('company_logo_name', profileData.company_logo_name);
      }
      
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      const response = await api.put('/business-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update business profile');
    }
  }
);

export const deleteBusinessProfile = createAsyncThunk(
  'businessProfile/deleteBusinessProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete('/business-profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete business profile');
    }
  }
);

const initialState = {
  profile: null,
  exists: false,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  message: null
};

const businessProfileSlice = createSlice({
  name: 'businessProfile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.message = null;
    },
    clearBusinessProfile: (state) => {
      state.profile = null;
      state.exists = false;
      state.status = 'idle';
      state.error = null;
      state.message = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch business profile
      .addCase(fetchBusinessProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBusinessProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload.data;
        state.exists = action.payload.exists;
        state.error = null;
      })
      .addCase(fetchBusinessProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Create business profile
      .addCase(createBusinessProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createBusinessProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload.data;
        state.exists = true;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(createBusinessProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Update business profile
      .addCase(updateBusinessProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateBusinessProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload.data;
        state.exists = true;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(updateBusinessProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Delete business profile
      .addCase(deleteBusinessProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteBusinessProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = null;
        state.exists = false;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(deleteBusinessProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { clearError, clearBusinessProfile } = businessProfileSlice.actions;

// Selectors
export const selectBusinessProfile = (state) => state.businessProfile.profile;
export const selectBusinessProfileExists = (state) => state.businessProfile.exists;
export const selectBusinessProfileStatus = (state) => state.businessProfile.status;
export const selectBusinessProfileError = (state) => state.businessProfile.error;
export const selectBusinessProfileMessage = (state) => state.businessProfile.message;

export default businessProfileSlice.reducer;
