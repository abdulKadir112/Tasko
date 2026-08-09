import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function getToken() {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("User token not found");
  }

  return token;
}

/* ===========================
   CREATE BID
=========================== */

export async function createBid(data: {
  jobId: string;
  amount: number;
  message: string;
}) {
  const token = await getToken();

  const response = await api.post("/bids", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/* ===========================
   GET ALL BIDS OF A JOB
=========================== */

export async function getJobBids(jobId: string) {
  const token = await getToken();

  const response = await api.get(`/bids/${jobId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/* ===========================
   MY BIDS (Worker)
=========================== */

export async function getMyBids() {
  const token = await getToken();

  const response = await api.get("/bids/my-bids", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/* ===========================
   ACCEPT BID
=========================== */

export async function acceptBid(id: string) {
  const token = await getToken();

  const response = await api.put(
    `/bids/${id}/accept`,
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
   REJECT BID
=========================== */

export async function rejectBid(id: string) {
  const token = await getToken();

  const response = await api.put(
    `/bids/${id}/reject`,
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
   DELETE BID
=========================== */

export async function deleteBid(id: string) {
  const token = await getToken();

  const response = await api.delete(`/bids/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}