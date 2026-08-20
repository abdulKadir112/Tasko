import api from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* =========================================================
   TOKEN
========================================================= */

async function getToken() {
  const token =
    await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error(
      "User not logged in"
    );
  }

  return token;
}

/* =========================================================
   TYPES
========================================================= */

export type ServicePackage = {
  id:
    | "basic"
    | "standard"
    | "premium";

  title: string;

  price: number;

  description?: string;

  deliveryHours?: number;
};

export type ServiceImage =
  | string
  | {
      url?: string;
      secure_url?: string;
      secureUrl?: string;
      imageUrl?: string;
      src?: string;
    };

export type CreateServicePayload = {
  title: string;

  description?: string;

  category: string;

  price?: number;

  packages?: ServicePackage[];

  images?: string[];

  coverImage?: string;

  bannerImage?: string;

  image?: string;

  isEmergency?: boolean;

  city?: string;

  isActive?: boolean;
};

export type UpdateServicePayload =
  Partial<CreateServicePayload>;

/* =========================================================
   PUBLIC
========================================================= */

/**
 * GET /api/services
 */

export async function getServices(
  params?: {
    category?: string;
    search?: string;
    emergency?: boolean;
    workerId?: string;
  }
) {
  const response =
    await api.get("/services", {
      params: {
        category:
          params?.category,

        search:
          params?.search,

        emergency:
          params?.emergency
            ? "true"
            : undefined,

        workerId:
          params?.workerId,
      },
    });

  return response.data;
}

/**
 * GET /api/services/emergency
 */

export async function getEmergencyServices(
  category?: string
) {
  const response =
    await api.get(
      "/services/emergency",
      {
        params: category
          ? { category }
          : undefined,
      }
    );

  return response.data;
}

/* =========================================================
   GET SERVICE BY ID
========================================================= */

/**
 * GET /api/services/:id
 *
 * Important:
 * প্রতিবার নতুন ID দিয়ে request হবে।
 */

export async function getServiceById(
  id: string
) {
  const serviceId = String(
    id || ""
  ).trim();

  if (!serviceId) {
    throw new Error(
      "Service ID is required"
    );
  }

  const response =
    await api.get(
      `/services/${encodeURIComponent(
        serviceId
      )}`,
      {
        /*
         * Browser / HTTP cache থেকে পুরোনো
         * response নেওয়া আটকানোর জন্য।
         */
        headers: {
          "Cache-Control":
            "no-cache",
          Pragma: "no-cache",
        },

        /*
         * Axios/browser adapter support করলে
         * cache-busting query-ও কাজ করবে।
         */
        params: {
          _t: Date.now(),
        },
      }
    );

  return response.data;
}

/* =========================================================
   WORKER
========================================================= */

/**
 * GET /api/services/my
 */

export async function getMyServices() {
  const token =
    await getToken();

  const response =
    await api.get(
      "/services/my",
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}

/* =========================================================
   CREATE SERVICE
========================================================= */

/**
 * POST /api/services
 *
 * Worker publishes a gig / package
 */

export async function createService(
  data: CreateServicePayload
) {
  const token =
    await getToken();

  const response =
    await api.post(
      "/services",
      data,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}

/* =========================================================
   UPDATE SERVICE
========================================================= */

/**
 * PUT /api/services/:id
 */

export async function updateService(
  id: string,
  data: UpdateServicePayload
) {
  const token =
    await getToken();

  const serviceId =
    String(id || "").trim();

  if (!serviceId) {
    throw new Error(
      "Service ID is required"
    );
  }

  const response =
    await api.put(
      `/services/${encodeURIComponent(
        serviceId
      )}`,
      data,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}

/* =========================================================
   DELETE SERVICE
========================================================= */

/**
 * DELETE /api/services/:id
 */

export async function deleteService(
  id: string
) {
  const token =
    await getToken();

  const serviceId =
    String(id || "").trim();

  if (!serviceId) {
    throw new Error(
      "Service ID is required"
    );
  }

  const response =
    await api.delete(
      `/services/${encodeURIComponent(
        serviceId
      )}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}