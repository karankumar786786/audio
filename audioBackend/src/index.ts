import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { errorHandler } from "./middlewares/errorHandler";
import { ApiError } from "./utils/ApiError";
import helmet from "helmet";
import { masterRouter } from "./router";
import { logger } from "./infra";
import { inngest } from "./infra";
config();

const app = express();

const PORT = process.env.PORT || 3000;


app.use(cors())
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

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