import api from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* =========================================================
   TYPES
========================================================= */

export type JobUrgency = "normal" | "urgent";

export interface CreateJobData {
  workerId?: string;
  category: string;
  title: string;
  description: string;
  budget: number;
  address: string;
  city: string;
  phone?: string;
  urgency?: JobUrgency;
  image?: string;
}

export interface UpdateJobData {
  workerId?: string;
  category?: string;
  title?: string;
  description?: string;
  budget?: number;
  address?: string;
  city?: string;
  phone?: string;
  urgency?: JobUrgency;
  image?: string;
  status?: string;
}

/* =========================================================
   TOKEN
========================================================= */

async function getToken(): Promise<string> {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("User not logged in");
  }

  return token;
}

/* =========================================================
   AUTH CONFIG
========================================================= */

async function getAuthConfig() {
  const token = await getToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

/* =========================================================
   CREATE JOB
========================================================= */

export async function createJob(data: CreateJobData) {
  const config = await getAuthConfig();

  console.log("========== CREATE JOB ==========");
  console.log("JOB DATA =", data);

  const response = await api.post("/jobs", data, config);

  console.log("CREATE JOB RESPONSE =", response.data);

  return response.data;
}

/* =========================================================
   GET ALL JOBS
   Public endpoint
========================================================= */

export async function getJobs() {
  const response = await api.get("/jobs");

  return response.data;
}

/* =========================================================
   WORKER SMART FEED
========================================================= */

export async function getWorkerFeedJobs() {
  const config = await getAuthConfig();

  const response = await api.get("/jobs/worker-feed", config);

  return response.data;
}

/* =========================================================
   CUSTOMER JOBS
========================================================= */

export async function getMyCustomerJobs() {
  const config = await getAuthConfig();

  const response = await api.get("/jobs/my-jobs", config);

  return response.data;
}

/* =========================================================
   WORKER ASSIGNED JOBS
========================================================= */

export async function getMyWorkerJobs() {
  const config = await getAuthConfig();

  const response = await api.get("/jobs/worker/my-jobs", config);

  return response.data;
}

/* =========================================================
   SINGLE JOB
========================================================= */

export async function getJobById(id: string) {
  const jobId = String(id || "").trim();

  if (!jobId) {
    throw new Error("Job ID is required");
  }

  const config = await getAuthConfig();

  console.log("========== GET JOB BY ID ==========");
  console.log("JOB ID =", jobId);

  const response = await api.get(`/jobs/${jobId}`, config);

  console.log("GET JOB RESPONSE =", response.data);

  return response.data;
}

/* =========================================================
   ADD JOB VIEW
========================================================= */

export async function addJobView(id: string) {
  const jobId = String(id || "").trim();

  if (!jobId) {
    throw new Error("Job ID is required");
  }

  const config = await getAuthConfig();

  const response = await api.post(
    `/jobs/${jobId}/view`,
    {},
    config
  );

  return response.data;
}

/* =========================================================
   UPDATE JOB
========================================================= */

export async function updateJob(
  id: string,
  data: UpdateJobData
) {
  const jobId = String(id || "").trim();

  if (!jobId) {
    throw new Error("Job ID is required");
  }

  const config = await getAuthConfig();

  console.log("========== UPDATE JOB ==========");
  console.log("JOB ID =", jobId);
  console.log("UPDATE DATA =", data);

  const response = await api.put(
    `/jobs/${jobId}`,
    data,
    config
  );

  console.log(
    "UPDATE JOB RESPONSE =",
    response.data
  );

  return response.data;
}

/* =========================================================
   DELETE JOB
========================================================= */

export async function deleteJob(id: string) {
  const jobId = String(id || "").trim();

  if (!jobId) {
    throw new Error("Job ID is required");
  }

  const config = await getAuthConfig();

  console.log("========== DELETE JOB ==========");
  console.log("JOB ID =", jobId);

  const response = await api.delete(
    `/jobs/${jobId}`,
    config
  );

  console.log(
    "DELETE JOB RESPONSE =",
    response.data
  );

  return response.data;
}