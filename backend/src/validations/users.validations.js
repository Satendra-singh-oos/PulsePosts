import { z } from "zod";
const registerUserSchemaValidation = z.object({
  username: z
    .string()
    .min(3, { message: "Username Must be 5 or more characters long" })
    .max(25, { message: "Must be less then 25  characters " }),

  fullname: z
    .string()
    .min(3, { message: "Fullname Must be 5 or more characters long" })
    .max(25, { message: "Must be less then 25  characters " }),

  email: z.string().email({ message: "Invalid  Email address" }),

  //   avatar: z.string(),
  //   coverImage: z.string().optional(),

  dob: z.string().optional(),
  bio: z
    .string()
    .max(500, { message: "Bio Must be less then 500 Character long" })
    .optional(),

  password: z
    .string()
    .min(5, { message: "Password Must be 5 or more character long" }),
});

const loginUserSchemaValidation = z.object({
  email: z.string().email({ message: "Invalid Email address" }),

  password: z
    .string()
    .min(5, { message: "Password Must be 5 or more character long" }),
});

const passwordValidation = z.object({
  oldPassword: z
    .string()
    .min(5, { message: "Password Must be 5 or more character long" }),

  newPassword: z
    .string()
    .min(5, { message: "Password Must be 5 or more character long" }),
});

const updatedUserAccountValidation = z.object({
  email: z.string().email({ message: "Invalid  Email address" }),
});

export {
  loginUserSchemaValidation,
  registerUserSchemaValidation,
  passwordValidation,
  updatedUserAccountValidation,
};
