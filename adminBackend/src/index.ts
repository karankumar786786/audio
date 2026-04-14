import { config } from "dotenv";
config();
import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import { ApiError } from "./utils/ApiError";
import helmet from "helmet";
import { masterRouter } from "./routes";
import { logger } from "./observablity";
import { traceMiddleware } from "./middlewares/trace.middleware";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "./docs/openapi-registry";
import "./docs/openapi-routes";



export const app = express();

const PORT = process.env.PORT || 4001;

app.use(traceMiddleware);
app.use(cors())
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));


// Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(generateOpenApiDocument()));

// Routes Implementation
app.use("/api/v1", masterRouter);

// Not Found Route
app.use((req, res, next) => {
    next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
    app.listen(Number(PORT), async () => {
        logger.info(`Admin Backend server started at port ${PORT}`);
    });
}

