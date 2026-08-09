import api from "./api";

export async function getWorkers(category?: string) {
  try {
    const response = await api.get("/users/workers", {
      params: category ? { category } : {},
    });

    return response.data;
  } catch (error) {
    console.log("getWorkers Error:", error);
    throw error;
  }
}

export async function getWorkersByCategory(
  category: string
) {
  try {
    const response = await api.get("/users/workers", {
      params: { category },
    });

    return response.data;
  } catch (error) {
    console.log("getWorkersByCategory Error:", error);
    throw error;
  }
}

export async function getWorkerById(
  id: string
) {
  try {
    const response = await api.get(
      `/users/workers/${id}`
    );

    return response.data;
  } catch (error) {
    console.log("getWorkerById Error:", error);
    throw error;
  }
}