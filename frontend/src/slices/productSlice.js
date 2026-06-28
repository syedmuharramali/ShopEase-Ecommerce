// frontend/src/slices/productSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  currentProduct: null,
  isLoading: false,
  isError: false,
  message: ''
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    addProduct: (state, action) => {
      state.products.unshift(action.payload);
    },
    updateProduct: (state, action) => {
      const index = state.products.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    deleteProduct: (state, action) => {
      state.products = state.products.filter(p => p._id !== action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.isError = true;
      state.message = action.payload;
    },
    clearError: (state) => {
      state.isError = false;
      state.message = '';
    }
  }
});

export const {
  setProducts,
  setCurrentProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  setLoading,
  setError,
  clearError
} = productSlice.actions;
export default productSlice.reducer;