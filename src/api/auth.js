import api from "./axios";

export const loginUser = (credentials) => api.post("/accounts/login/", credentials);

export const registerUser = (userData) => api.post("/accounts/register/", userData);

export const sendOtp = (email, otp) => api.post("/accounts/send-otp/", { email, otp });

export const logoutUser = () => api.post("/accounts/logout/");

export const refreshToken = (refresh) =>
  api.post("/accounts/token/refresh/", { refresh });
