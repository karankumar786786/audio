import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { errorHandler } from "./middlewares/errorHandler";
import { ApiError } from "./utils/ApiError";
import helmet from "helmet";
import { masterRouter } from "./routes";
import { logger } from "./infra";
config();

const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors())
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

// Routes Implementation
app.use("/api/v1", masterRouter);

// Not Found Route
app.use((req, res, next) => {
    next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

app.listen(Number(PORT),async ()=>{
    logger.info(`Admin Backend server started at port ${PORT}`);
})
