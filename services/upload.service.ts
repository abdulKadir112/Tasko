import api from "./api";
import mime from "mime";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function getToken() {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("User not logged in");
  }

  return token;
}

async function uploadFile(
  uri: string,
  fieldName: "image" | "voice" | "document"
): Promise<string> {
  try {
    const token = await getToken();

    const mimeType =
      mime.getType(uri) || "application/octet-stream";

    const extension =
      mime.getExtension(mimeType) || "dat";

    const formData = new FormData();

    formData.append(fieldName, {
      uri,
      name: `${fieldName}_${Date.now()}.${extension}`,
      type: mimeType,
    } as any);

    console.log("📤 Uploading:", uri);
    console.log("📂 Type:", fieldName);

    // IMPORTANT
    const endpoint = `/upload/${fieldName}`;

    const response = await api.post(
      endpoint,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ Upload Success:", response.data);

    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Upload failed"
      );
    }

    // Backend compatible
    return (
      response.data.data?.url ||
      response.data.data?.imageUrl ||
      response.data.data?.voiceUrl ||
      response.data.data?.documentUrl ||
      response.data.url ||
      response.data.imageUrl ||
      response.data.voiceUrl ||
      response.data.documentUrl
    );
  } catch (error: any) {
    console.log(
      "❌ Upload Error:",
      error?.response?.data || error.message
    );

    throw error;
  }
}

/**
 * IMAGE
 */
export async function uploadImage(
  imageUri: string
): Promise<string> {
  return uploadFile(imageUri, "image");
}

/**
 * VOICE
 */
export async function uploadVoice(
  voiceUri: string
): Promise<string> {
  return uploadFile(voiceUri, "voice");
}

/**
 * DOCUMENT
 */
export async function uploadDocument(
  documentUri: string
): Promise<string> {
  return uploadFile(documentUri, "document");
}