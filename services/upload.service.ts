import api from "@/config/api";

/**
 * Upload image to backend
 *
 * Backend endpoint:
 * POST /api/upload/image
 *
 * Backend expects:
 * upload.single("image")
 */
export async function uploadImage(
  uri: string,
  fileName?: string,
  mimeType?: string
) {
  try {
    const name =
      fileName || `image_${Date.now()}.jpg`;

    const type =
      mimeType || "image/jpeg";

    const formData = new FormData();

    formData.append("image", {
      uri,
      name,
      type,
    } as any);

    console.log("==========================================");
    console.log("📤 IMAGE UPLOAD START");
    console.log("📂 Field: image");
    console.log("📁 URI:", uri);
    console.log("📄 File:", name);
    console.log("🎵 MIME:", type);
    console.log(
      "🌐 API BASE URL:",
      api.defaults.baseURL
    );
    console.log(
      "🌐 UPLOAD ENDPOINT:",
      "/upload/image"
    );
    console.log(
      "🌐 FULL URL:",
      `${api.defaults.baseURL}/upload/image`
    );
    console.log("==========================================");

    const response = await api.post(
      "/upload/image",
      formData,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },

        // Important for React Native multipart uploads
        transformRequest: (data) => data,
      }
    );

    console.log("==========================================");
    console.log("✅ IMAGE UPLOAD SUCCESS");
    console.log("📦 RESPONSE:", response.data);
    console.log("==========================================");

    return response.data;
  } catch (error: any) {
    console.log("==========================================");
    console.log("❌ IMAGE UPLOAD ERROR");

    if (error.response) {
      console.log(
        "📡 STATUS:",
        error.response.status
      );

      console.log(
        "📡 RESPONSE:",
        error.response.data
      );
    } else {
      console.log(
        "❌ MESSAGE:",
        error.message
      );
    }

    console.log("==========================================");

    throw error;
  }
}


/**
 * Upload voice to backend
 *
 * Backend expects:
 * upload.single("voice")
 */
export async function uploadVoice(
  uri: string,
  fileName?: string,
  mimeType?: string
) {
  try {
    const name =
      fileName || `voice_${Date.now()}.m4a`;

    const type =
      mimeType || "audio/m4a";

    const formData = new FormData();

    formData.append("voice", {
      uri,
      name,
      type,
    } as any);

    console.log("🎤 VOICE UPLOAD START");
    console.log("URI:", uri);
    console.log("File:", name);
    console.log("MIME:", type);

    const response = await api.post(
      "/upload/voice",
      formData,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },

        transformRequest: (data) => data,
      }
    );

    console.log(
      "✅ VOICE UPLOAD SUCCESS:",
      response.data
    );

    return response.data;
  } catch (error: any) {
    console.log(
      "❌ VOICE UPLOAD ERROR:",
      error.response?.data || error.message
    );

    throw error;
  }
}


/**
 * Upload document to backend
 *
 * Backend expects:
 * upload.single("document")
 */
export async function uploadDocument(
  uri: string,
  fileName?: string,
  mimeType?: string
) {
  try {
    const name =
      fileName || `document_${Date.now()}`;

    const type =
      mimeType || "application/pdf";

    const formData = new FormData();

    formData.append("document", {
      uri,
      name,
      type,
    } as any);

    console.log("📄 DOCUMENT UPLOAD START");
    console.log("URI:", uri);
    console.log("File:", name);
    console.log("MIME:", type);

    const response = await api.post(
      "/upload/document",
      formData,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },

        transformRequest: (data) => data,
      }
    );

    console.log(
      "✅ DOCUMENT UPLOAD SUCCESS:",
      response.data
    );

    return response.data;
  } catch (error: any) {
    console.log(
      "❌ DOCUMENT UPLOAD ERROR:",
      error.response?.data || error.message
    );

    throw error;
  }
}