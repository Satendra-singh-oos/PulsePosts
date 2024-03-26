import { z } from "zod";
const blogSchemaValidation = z.object({
  title: z
    .string()
    .min(3, { message: "Title Should be minium of 3 character" })
    .max(50, { message: "Title Cannot be more then 50 character" })
    .regex(/^[a-zA-Z0-9-_]+$/),
  content: z
    .string()
    .min(10, { message: "Blog Content Must be of 10 char" })
    .max(5000, { message: "Blog Content Cannot be greater then 5000 char" }),
  // .regex(/^[a-zA-Z0-9@#$5^&*()!\p{Emoji}]+$/u),

  tag: z
    .array(z.string())
    .min(3, { message: "Tag Should be minium of 3 character" })
    .max(10, { message: "Tag Cannot be more then 10 character" })
    .regex(/^[a-zA-Z0-9-]+$/),

  isPublished: z.boolean().optional(),
});

const updateBlogSchemaValidation = z.object({
  title: z
    .string()
    .min(3, { message: "Title Should be minium of 3 character" })
    .max(50, { message: "Title Cannot be more then 50 character" })
    .regex(/^[a-zA-Z0-9-_]+$/)
    .optional(),
  content: z
    .string()
    .min(10, { message: "Blog Content Must be of 10 char" })
    .max(5000, { message: "Blog Content Cannot be greater then 5000 char" })
    .regex(/^[a-zA-Z0-9@#$5^&*()!\p{Emoji}]+$/u)
    .optional(),

  tag: z
    .array(z.string())
    .min(3, { message: "Tag Should be minium of 3 character" })
    .max(10, { message: "Tag Cannot be more then 10 character" })
    .regex(/^[a-zA-Z0-9-]+$/)
    .optional(),

  isPublished: z.boolean().optional(),
});

export { blogSchemaValidation, updateBlogSchemaValidation };
