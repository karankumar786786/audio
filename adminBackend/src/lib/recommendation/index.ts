import type { RecommendationSchema, RecommendationService as GenericRecommendationService } from "./index.types";
export type { RecommendationSchema } from "./index.types";
export * from "./recombee";
export type RecommendationService = GenericRecommendationService<RecommendationSchema>;