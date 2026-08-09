import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024, //20MB
  },

  fileFilter(req, file, cb) {
    const imageMime = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    const voiceMime = [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/m4a",
      "audio/wav",
      "audio/x-wav",
      "audio/ogg",
      "audio/aac",
    ];

    const documentMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowed = [
      ...imageMime,
      ...voiceMime,
      ...documentMime,
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error(`Unsupported file type : ${file.mimetype}`)
      );
    }

    cb(null, true);
  },
});

export default upload;