import rateLimit from "express-rate-limit";

export const generalLimiter = rateLimit({
    windowMs: 1000, // 1 second
    limit: 10, // Limit each IP to 10 requests per second
    standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 429,
        message: "Too many requests from this IP, please try again after 1 second."
    }
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        status: 429,
        message: "Too many login/registration attempts, please try again after 15 minutes."
    }
});
