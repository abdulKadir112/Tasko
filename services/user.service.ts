import api from "@/config/api";

/**
 * =========================================================
 * NORMALIZE PHOTO URL
 * =========================================================
 */

function normalizePhotoURL(value: any): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object") {
    const nested =
      value.url ??
      value.secure_url ??
      value.imageUrl ??
      value.photoURL ??
      value.uri ??
      null;

    if (
      nested &&
      typeof nested === "string"
    ) {
      return nested.trim();
    }
  }

  console.log(
    "⚠️ Unexpected photoURL format, ignoring:",
    value
  );

  return "";
}

/**
 * =========================================================
 * NORMALIZE PROFILE DATA
 * =========================================================
 */

function normalizeProfileData(data: any) {
  if (
    !data ||
    typeof data !== "object"
  ) {
    return data;
  }

  return {
    ...data,
    photoURL: normalizePhotoURL(
      data.photoURL
    ),
  };
}

/**
 * =========================================================
 * GET MY PROFILE
 * =========================================================
 */

export const getMyProfile = async () => {
  const response = await api.get(
    "/users/me"
  );

  const body = response.data;

  if (body?.data) {
    body.data =
      normalizeProfileData(
        body.data
      );
  }

  return body;
};

/**
 * =========================================================
 * UPDATE MY PROFILE
 * =========================================================
 */

export const updateMyProfile = async (
  data: Record<string, any>
) => {
  console.log(
    "📤 updateMyProfile:",
    data
  );

  const response = await api.put(
    "/users/me",
    data
  );

  const body = response.data;

  if (body?.data) {
    body.data =
      normalizeProfileData(
        body.data
      );
  }

  return body;
};

/**
 * =========================================================
 * GET ANY USER BY UID
 * =========================================================
 */

export const getUserById = async (
  uid: string
) => {
  if (!uid) {
    throw new Error(
      "User ID is required"
    );
  }

  console.log(
    "👤 getUserById:",
    uid
  );

  const response = await api.get(
    `/users/${uid}`
  );

  console.log(
    "👤 getUserById response:",
    response.data
  );

  return normalizeProfileData(
    response.data?.data
  );
};

/**
 * =========================================================
 * GET WORKER PROFILE BY ID
 * =========================================================
 */

export const getWorkerById = async (
  uid: string
) => {
  if (!uid) {
    throw new Error(
      "Worker ID is required"
    );
  }

  const response = await api.get(
    `/users/workers/${uid}`
  );

  return normalizeProfileData(
    response.data?.data
  );
};