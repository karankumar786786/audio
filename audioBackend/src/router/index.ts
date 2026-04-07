import {Router} from "express";
import {userRouter} from "./user.route";



export const masterRouter = Router();

masterRouter.use("/users",userRouter);