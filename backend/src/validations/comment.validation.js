import { z } from "zod";

const commentSchemaValidation = z.object({
  content: z
    .string()
    .min(3, { message: "Comment  Content Must be of 3 char" })
    .max(500, { message: "Comment Content Cannot be greater then 500 char" }),
  // .regex(/^[a-zA-Z0-9@#$5^&*()!\p{Emoji}]+$/u),
});

export { commentSchemaValidation };
