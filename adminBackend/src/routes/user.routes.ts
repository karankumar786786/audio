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

const paginationQuery = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const idParam = z.object({
    id: z.string().min(1, "ID must not be empty"),
});

userRouter.get("/", requireRole(["admin", "superadmin"]), validate({ query: paginationQuery }), getAllUsers);
userRouter.post("/admins", requireRole(["superadmin"]), validate(createAdminSchema), createOrPromoteAdmin);
userRouter.delete("/admins/:id", requireRole(["superadmin"]), validate({ params: idParam }), deleteOrDemoteAdmin);

