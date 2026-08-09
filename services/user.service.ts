import api from "./api";

/**
 * Get Logged In User Profile
 */
export const getMyProfile = async () => {
  const response = await api.get("/users/me");

  return response.data;
};

/**
 * Update Logged In User Profile
 */
export const updateMyProfile = async (data: any) => {
  const response = await api.put("/users/me", data);

  return response.data;
};