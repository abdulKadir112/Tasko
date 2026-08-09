import axios from "axios";
import { auth } from "@/config/firebase";

export const API_BASE_URL = "http://192.168.0.117:5000/api";

// Android Emulator হলে:
// export const API_BASE_URL = "http://10.0.2.2:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Attach Firebase Token
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken(true);

        // ✅ Type-safe (AxiosHeaders support)
        config.headers.set("Authorization", `Bearer ${token}`);
      }

      console.log(
        "➡️",
        `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
      );

      return config;
    } catch (e) {
      console.log("Request Error:", e);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

/**
 * Response Logger
 */
api.interceptors.response.use(
  (response) => {
    console.log("✅", response.config.url, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      console.log("❌ API ERROR");
      console.log("URL:", error.config?.url);
      console.log("STATUS:", error.response.status);
      console.log("DATA:", error.response.data);
    } else {
      console.log("❌ NETWORK ERROR");
      console.log(error.message);
    }

    return Promise.reject(error);
  }
);

export default api;