import axios from "axios";
import { auth } from "@/config/firebase";

export const API_BASE_URL =
  "https://tasko-backend-5pgd.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});


/**
 * Attach Firebase authentication token
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;

      if (user) {
        const token =
          await user.getIdToken();

        if (config.headers) {
          config.headers.set(
            "Authorization",
            `Bearer ${token}`
          );
        }
      }

      console.log("➡️ API REQUEST");
      console.log(
        "METHOD:",
        config.method?.toUpperCase()
      );
      console.log(
        "URL:",
        `${config.baseURL}${config.url}`
      );

      return config;
    } catch (error) {
      console.log(
        "❌ TOKEN ERROR:",
        error
      );

      return config;
    }
  },

  (error) => {
    return Promise.reject(error);
  }
);


/**
 * Response logger
 */
api.interceptors.response.use(
  (response) => {
    console.log(
      "✅ API RESPONSE:",
      response.status,
      response.config.url
    );

    return response;
  },

  (error) => {
    if (error.response) {
      console.log("❌ API ERROR");
      console.log(
        "STATUS:",
        error.response.status
      );
      console.log(
        "URL:",
        error.config?.url
      );
      console.log(
        "DATA:",
        error.response.data
      );
    } else {
      console.log("❌ NETWORK ERROR");
      console.log(
        "MESSAGE:",
        error.message
      );
    }

    return Promise.reject(error);
  }
);


export default api;