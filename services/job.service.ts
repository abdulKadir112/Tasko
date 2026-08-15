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
   CREATE JOB
=========================== */

export async function createJob(data: {
  workerId?: string;
  category: string;
  title: string;
  description: string;
  budget: number;
  address: string;
  city: string;
  phone?: string;
  urgency?: "normal" | "urgent";
  image?: string;
}) {
  const token = await getToken();

  const response = await api.post("/jobs", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/* ===========================
   GET ALL JOBS
=========================== */

export async function getJobs() {
  const response = await api.get("/jobs");
  return response.data;
}

/* ===========================
   WORKER SMART FEED
=========================== */

export async function getWorkerFeedJobs() {
  const token = await getToken();

  const response = await api.get("/jobs/worker-feed", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/* ===========================
   CUSTOMER JOBS
=========================== */

export async function getMyCustomerJobs() {
  const token = await getToken();

  const response = await api.get("/jobs/my-jobs", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/* ===========================
   WORKER ASSIGNED JOBS
=========================== */

export async function getMyWorkerJobs() {
  const token = await getToken();

  const response = await api.get("/jobs/worker/my-jobs", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/* ===========================
   SINGLE JOB
=========================== */

export async function getJobById(id: string) {
  console.log("Loading Job:", id);

  const response = await api.get(`/jobs/${id}`);

  console.log(response.data);

  return response.data;
}

/* ===========================
   ADD JOB VIEW
=========================== */

export async function addJobView(id: string) {
  const token = await getToken();

  const response = await api.post(
    `/jobs/${id}/view`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

/* ===========================
   UPDATE JOB
=========================== */

export async function updateJob(
  id: string,
  data: {
    workerId?: string;
    category?: string;
    title?: string;
    description?: string;
    budget?: number;
    address?: string;
    city?: string;
    phone?: string;
    urgency?: "normal" | "urgent";
    image?: string;
    status?: string;
  }
) {
  const token = await getToken();

  const response = await api.put(`/jobs/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/* ===========================
   DELETE JOB
=========================== */

export async function deleteJob(id: string) {
  const token = await getToken();

  const response = await api.delete(`/jobs/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}