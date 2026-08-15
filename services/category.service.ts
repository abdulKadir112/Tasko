import api from "@/config/api";

export const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};