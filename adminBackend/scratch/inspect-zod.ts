import { z } from "zod";
console.log("Keys of z:", Object.keys(z));
console.log("ZodType exists:", !!(z as any).ZodType);
