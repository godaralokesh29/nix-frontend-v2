import axios from "axios";
import { getTokenFromStorage } from "./localStorageParser";

const API = axios.create({
  baseURL: import.meta.env.VITE_NIX_BACKEND,
});


API.interceptors.request.use((req) => {
  const token = getTokenFromStorage();
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const prevRequest = error?.config;
    if (error?.response?.status === 401 && !prevRequest?.sent) {
      prevRequest.sent = true;
      const newAccessToken = await refreshAuthToken();
      prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      return API(prevRequest);
    }
    // Redirect to login page or other error handling for different types of errors
    if (error?.response?.status === 401) {
      window.location.href = "/login?sessionExpired=true";
    }

    //here redirect to login page
    return Promise.reject(error);
  },
);

export const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const response = await API.get("/auth/refresh", {
      withCredentials: true,
    });
    localStorage.setItem("token", response?.data?.data?.accessToken);
    return (response?.data?.data?.accessToken as string) || null;
  } catch (err) {
    console.debug(err);
    window.location.href = "/login?sessionExpired=true";
    return null;
  }
};

export default API;
