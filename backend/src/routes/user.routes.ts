import { Router } from "express";

import {
  getMyProfile,
  updateMyProfile,
  getWorkers,
  getWorkerById,
} from "../controllers/user.controller";

import {
  verifyToken,
} from "../middleware/auth.middleware";

const router = Router();

/**
 * Public Routes
 */

// Get all workers
// Optional Query:
// /api/users/workers
// /api/users/workers?category=plumbing
router.get(
  "/workers",
  getWorkers
);

// Get single worker
router.get(
  "/workers/:id",
  getWorkerById
);

/**
 * Protected Routes
 */

router.get(
  "/me",
  verifyToken,
  getMyProfile
);

router.put(
  "/me",
  verifyToken,
  updateMyProfile
);

export default router;