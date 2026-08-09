import { Request, Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/auth.middleware";
import { updateProfileSchema } from "../validations/user.validation";

export async function getMyProfile(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function updateMyProfile(
  req: AuthRequest,
  res: Response
) {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = updateProfileSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.error.flatten(),
      });
      return;
    }

    const {
      name,
      phone,
      photoURL,
      address,
      city,
      category,
      skills,
      experience,
      about,
    } = result.data;

    await db.collection("users").doc(uid).set(
      {
        name,
        phone,
        photoURL,
        address,
        city,
        category,
        skills,
        experience,
        about,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    const updatedUser = await db.collection("users").doc(uid).get();

    res.json({
      success: true,
      message: "Profile Updated Successfully",
      data: {
        id: updatedUser.id,
        ...updatedUser.data(),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Profile Update Failed",
    });
  }
}

export async function getWorkers(
  req: Request,
  res: Response
) {
  try {
    const category = req.query.category as string;

    let query: FirebaseFirestore.Query = db
      .collection("users")
      .where("role", "==", "worker");

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.orderBy("rating", "desc").get();

    const workers = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        photoURL: data.photoURL,
        city: data.city,
        category: data.category,
        skills: data.skills,
        experience: data.experience,
        rating: data.rating,
        completedJobs: data.completedJobs,
        totalJobs: data.totalJobs,
        isOnline: data.isOnline,
      };
    });

    res.json({
      success: true,
      total: workers.length,
      data: workers,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch workers",
    });
  }
}

export async function getWorkerById(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Worker id is required",
      });
    }

    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    const worker = doc.data();

    if (worker?.role !== "worker") {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    const workerData = {
      id: doc.id,
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      photoURL: worker.photoURL,
      city: worker.city,
      category: worker.category,
      skills: worker.skills,
      experience: worker.experience,
      rating: worker.rating,
      completedJobs: worker.completedJobs,
      totalJobs: worker.totalJobs,
      isOnline: worker.isOnline,
      about: worker.about,
    };

    return res.json({
      success: true,
      data: workerData,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch worker",
    });
  }
}