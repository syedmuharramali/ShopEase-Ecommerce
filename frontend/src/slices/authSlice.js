// frontend/src/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const adminFromStorage = localStorage.getItem('adminInfo') 
  ? JSON.parse(localStorage.getItem('adminInfo')) 
  : null;

const initialState = {
  adminInfo: adminFromStorage,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: ''
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.adminInfo = action.payload;
      localStorage.setItem('adminInfo', JSON.stringify(action.payload));
      state.isSuccess = true;
    },
    logout: (state) => {
      state.adminInfo = null;
      localStorage.removeItem('adminInfo');
    },
    clearState: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    }
  }
});

export const { setCredentials, logout, clearState } = authSlice.actions;
export default authSlice.reducer;