import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verifyTurnstileToken } from "../lib/turnstile.js";

/**
 * Registers Turnstile verification middleware for the auth routes
 * Only runs in cloud mode and only for email signup
 */
export async function registerTurnstileMiddleware(
  fastify: FastifyInstance,
  isCloud: boolean,
  logger: any
) {
  // Turnstile verification middleware for email signup (cloud only)
  fastify.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    // Only verify Turnstile for email signup in cloud mode
    if (isCloud && request.url === "/api/auth/sign-up/email" && request.method === "POST") {
      try {
        // Read the Turnstile token from the custom header
        const turnstileToken = request.headers["x-turnstile-token"] as string;

        logger.info("Turnstile verification - token received:", !!turnstileToken);

        if (!turnstileToken) {
          return reply.status(400).send({
            error: "Captcha verification required",
            message: "Please complete the captcha verification",
          });
        }

        // Verify the Turnstile token
        const remoteIp = request.ip;
        const isValid = await verifyTurnstileToken(turnstileToken, remoteIp);

        if (!isValid) {
          return reply.status(400).send({
            error: "Captcha verification failed",
            message: "Invalid captcha. Please try again.",
          });
        }

        logger.info("Turnstile verification successful");
      } catch (error) {
        logger.error("Error in Turnstile verification:", error);
        return reply.status(500).send({
          error: "Verification error",
          message: "An error occurred during captcha verification",
        });
      }
    }
  });
}
