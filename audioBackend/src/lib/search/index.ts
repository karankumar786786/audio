import type { SearchRecord, SearchService as GenericSearchService } from "./index.types";

export * from "./index.types";
export * from "./algolia";
export type SearchService = GenericSearchService<SearchRecord>;