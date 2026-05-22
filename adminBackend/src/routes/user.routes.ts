import { Router } from "express";
import { z } from "zod";
import { getAllUsers, createOrPromoteAdmin, deleteOrDemoteAdmin } from "../controllers/user.controller";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";

export const userRouter = Router();

const createAdminSchema = z.object({
    name: z.string().optional(),
    email: z.string().email("Valid email is required")
});

userRouter.get("/", requireRole(["admin", "superadmin"]), getAllUsers);
userRouter.post("/admins", requireRole(["superadmin"]), validate(createAdminSchema), createOrPromoteAdmin);
userRouter.delete("/admins/:id", requireRole(["superadmin"]), deleteOrDemoteAdmin);
