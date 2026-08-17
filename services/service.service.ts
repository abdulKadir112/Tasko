import api from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ===========================
   TOKEN
=========================== */

async function getToken() {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("User not logged in");
  }

  return token;
}

/* ===========================
   TYPES
=========================== */

export type ServicePackage = {
  id: "basic" | "standard" | "premium";
  title: string;
  price: number;
  description?: string;
  deliveryHours?: number;
};

export type CreateServicePayload = {
  title: string;
  description?: string;
  category: string;
  price?: number;
  packages?: ServicePackage[];
  images?: string[];
  isEmergency?: boolean;
  city?: string;
  isActive?: boolean;
};

export type UpdateServicePayload = Partial<CreateServicePayload>;

/* ===========================
   PUBLIC
=========================== */

/**
 * GET /api/services
 */
export async function getServices(params?: {
  category?: string;
  search?: string;
  emergency?: boolean;
  workerId?: string;
}) {
  const response = await api.get("/services", {
    params: {
      category: params?.category,
      search: params?.search,
      emergency: params?.emergency ? "true" : undefined,
      workerId: params?.workerId,
    },
  });

  return response.data;
}

/**
 * GET /api/services/emergency
 */
export async function getEmergencyServices(category?: string) {
  const response = await api.get("/services/emergency", {
    params: category ? { category } : undefined,
  });

  return response.data;
}

/**
 * GET /api/services/:id
 */
export async function getServiceById(id: string) {
  const response = await api.get(`/services/${id}`);
  return response.data;
}

/* ===========================
   WORKER (PROTECTED)
=========================== */

/**
 * GET /api/services/my
 */
export async function getMyServices() {
  const token = await getToken();

  const response = await api.get("/services/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/**
 * POST /api/services
 * Worker publishes a gig / package
 */
export async function createService(data: CreateServicePayload) {
  const token = await getToken();

  const response = await api.post("/services", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/**
 * PUT /api/services/:id
 */
export async function updateService(
  id: string,
  data: UpdateServicePayload
) {
  const token = await getToken();

  const response = await api.put(`/services/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/**
 * DELETE /api/services/:id
 */
export async function deleteService(id: string) {
  const token = await getToken();

  const response = await api.delete(`/services/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}