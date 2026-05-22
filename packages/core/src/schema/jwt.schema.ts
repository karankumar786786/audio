import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const payload = z.object(
    {
        id: z.string({invalid_type_error:"string is required invalid type received"}),
        userName: z.string({invalid_type_error:"string is required invalid type received"}),
        email: z.string({invalid_type_error:"string is required invalid type received"}).email("invalid email"),
        picture: z.string({invalid_type_error:"string is required invalid type received"}).url("invalid picture url"),
        role: z.string().optional(),
    },
    {
        invalid_type_error:"invalid type object is required with fields userName, email"
    }
);

export type Payload = z.infer<typeof payload>;
