import api from "@/config/api";

/*
=========================================================
NORMALIZE PHOTO URL  (⭐ NEW — ROOT CAUSE FIX)
=========================================================

Backend থেকে কখনো কখনো photoURL সরাসরি string না হয়ে
object হয়ে আসতে পারে — যেমন Cloudinary-এর raw upload
response ({ url, public_id, secure_url, ... }) ভুলবশত
সরাসরি DB-তে সেভ হয়ে গেলে, string-এর বদলে পুরো object
চলে আসে।

React Native-এর <Image source={{ uri }}> এ uri অবশ্যই
string হতে হয়। Object দিলে এই crash হয়:

  "Value for uri cannot be cast from
   ReadableNativeMap to String"

আগে screen-level কোডে `user?.photoURL || ""` ব্যবহার
করা হতো — কিন্তু object সবসময় truthy, তাই `|| ""`
কখনো কার্যকর হতো না এবং object-ই state-এ বসে যেত।

এই ফাংশনটা সেই কারণেই এখানে, service layer-এ বসানো
হলো — যাতে getMyProfile/updateMyProfile/getUserById/
getWorkerById যেখান থেকেই কল হোক না কেন, photoURL
সবসময় নিরাপদ string হয়েই বের হয়।
=========================================================
*/

function normalizePhotoURL(
  value: any
): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  /*
   * object হলে ভেতর থেকে আসল URL string বের করার
   * চেষ্টা করবো।
   */

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

  /*
   * অচেনা ফরম্যাট হলে খালি string রিটার্ন করবো —
   * object কখনোই বাইরে যেতে দেওয়া হবে না, এটাই
   * মূল নিরাপত্তা।
   */

  console.log(
    "⚠️ Unexpected photoURL format, ignoring:",
    value
  );

  return "";
}

/*
=========================================================
NORMALIZE PROFILE DATA  (⭐ NEW)
=========================================================
*/

function normalizeProfileData(
  data: any
) {
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

/*
=========================================================
GET MY PROFILE
=========================================================
*/

export const getMyProfile = async () => {
  const response = await api.get(
    "/users/me"
  );

  const body = response.data;

  /*
   * ⭐ FIX: photoURL সবসময় normalize করে দেওয়া হচ্ছে,
   * যাতে Edit Profile স্ক্রিনে গিয়ে object <Image>-এ
   * বসে crash না করে।
   */

  if (body?.data) {
    body.data = normalizeProfileData(
      body.data
    );
  }

  return body;
};

/*
=========================================================
UPDATE MY PROFILE
=========================================================
*/

export const updateMyProfile = async (
  data: any
) => {
  const response = await api.put(
    "/users/me",
    data
  );

  const body = response.data;

  if (body?.data) {
    body.data = normalizeProfileData(
      body.data
    );
  }

  return body;
};

/*
=========================================================
GET ANY USER BY UID
=========================================================

Customer এবং Worker — দুই ধরনের user-এর
profile পাওয়ার জন্য এই API ব্যবহার হবে।

Backend:

GET /api/users/:uid

Example:

GET /api/users/bk3HM91m4Abgs1UWlEUtqNYWdKn1

Response:

{
  success: true,
  data: {
    id,
    name,
    photoURL,
    isOnline
  }
}

=========================================================
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

  /*
   * ⭐ FIX: এখানেও photoURL normalize করা হচ্ছে —
   * ChatHeader/ChatCard-এ ব্যবহৃত otherUser-এর ছবিও
   * এই ফাংশন দিয়েই আসে।
   */

  return normalizeProfileData(
    response.data?.data
  );
};

/*
=========================================================
GET WORKER PROFILE BY ID
=========================================================

শুধু Worker-specific screen-এর জন্য।

Backend:

GET /api/users/workers/:id
=========================================================
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