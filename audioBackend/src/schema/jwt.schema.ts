import {z} from "zod";


export const payload = z.object(
    {
        id: z.string({invalid_type_error:"string is required invalid type recived"}),
        userName: z.string({invalid_type_error:"string is required invalid type recived"}),
        email: z.string({invalid_type_error:"string is required invalid type recived"}).email("invalid email"),
        picture: z.string({invalid_type_error:"string is required invaild type recived"}).url("invalid picture url"),
    },
    {
        invalid_type_error:"invalid type object is required with fields userName, email"
    }
);

export type Payload = z.infer<typeof payload>;