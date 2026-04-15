import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { errorHandler } from "./middlewares/errorHandler";
import { ApiError } from "./utils/ApiError";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { masterRouter } from "./router";
import { logger } from "./infra";
import { swaggerRouter } from "./docs/openapi-routes";
config();

export const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // Allow common dev ports
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use("/api-docs", swaggerRouter);

// Routes Implementation
app.use("/api/v1", masterRouter);


// Not Found Route (should be AFTER all actual routes and BEFORE error handler)
app.use((req, res, next) => {
    next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Global Error Handler (should be the last middleware)
app.use(errorHandler);

app.listen(Number(PORT),async ()=>{
    logger.info(`server started at port ${PORT}`);
})