import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name is required"),

    email: z.string().email("Invalid email"),

    password: z.string().min(6, "Password must be at least 6 characters"),

    confirmPassword: z.string(),

    role: z.enum(["customer", "worker"]),

    phone: z.string().optional(),

    city: z.string().optional(),

    category: z.string().optional(),

    skills: z.array(z.string()).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });