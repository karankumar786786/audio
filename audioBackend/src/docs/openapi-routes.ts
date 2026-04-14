import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./openapi-registry";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";

export function generateOpenApiDocs() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Music Audio API",
      description: "API for Music Audio Backend (Consumption and User Interactivity)",
    },
    servers: [{ url: "/api/v1" }],
  });
}

export const swaggerRouter = Router();

swaggerRouter.get("/openapi.json", (req, res) => {
  res.json(generateOpenApiDocs());
});

swaggerRouter.use("/", swaggerUi.serve, swaggerUi.setup(undefined, {
  swaggerOptions: {
    url: "/api-docs/openapi.json",
  },
}));
