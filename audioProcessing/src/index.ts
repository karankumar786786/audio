import express from "express";
import cors from "cors";
import { config } from "dotenv";
import helmet from "helmet";
import { logger } from "./infra";
import { serve } from "inngest/express";
import { inngest } from "./infra";
import { functions } from "./inngest";
config();

const app = express();

const PORT = process.env.PORT || 3002;

app.use(cors())
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

// Inngest Endpoint
app.use("/api/inngest", serve({ client: inngest, functions }));

app.listen(Number(PORT),async ()=>{
    logger.info(`Audio Processing server started at port ${PORT}`);
})
