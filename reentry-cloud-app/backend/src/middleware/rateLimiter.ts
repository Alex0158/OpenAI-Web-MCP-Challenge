import rateLimit from "express-rate-limit";

const tooManyRequests = {
  success: false,
  error: "TOO_MANY_REQUESTS",
  message: "Too many requests, try again later.",
};

// Registration and login are credential endpoints, so keep them tight.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
});
