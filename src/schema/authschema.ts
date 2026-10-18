import { z } from "zod";

export const registrationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .min(3, "Name must be at least 3 characters")
      .max(12, "Name cannot exceed 12 characters"),

    username: z
      .string()
      .trim()
      .min(1, "Username is required")
      .min(3, "Username must be at least 3 characters")
      .max(12, "Username cannot exceed 12 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can contain only letters, numbers, and underscores",
      ),

    email: z
      .string()
      .trim()
      .email("Please enter a valid email address")
      .transform((value) => value.toLowerCase()),

    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

        const date = new Date(`${value}T00:00:00.000Z`);

        return (
          !Number.isNaN(date.getTime()) &&
          date.toISOString().slice(0, 10) === value &&
          date <= new Date()
        );
      }, "Please enter a valid date of birth that is not in the future"),

    gender: z.enum(["male", "female"], {
      error: "Please select a valid gender",
    }),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(15, "Password cannot exceed 15 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,15}$/,
        "Password must contain an uppercase letter, a lowercase letter, a number, and a special character",
      ),

    rePassword: z.string().min(1, "Please confirm your password"),
  })
  .refine(({ password, rePassword }) => password === rePassword, {
    error: "Passwords do not match",
    path: ["rePassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(15, "Password cannot exceed 15 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,15}$/,
      "Password must contain an uppercase letter, a lowercase letter, a number, and a special character",
    ),
});

const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(15, "Password cannot exceed 15 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,15}$/,
    "Password must contain an uppercase letter, a lowercase letter, a number, and a special character",
  );

export const changePasswordSchema = z
  .object({
    password: z.string().min(1, "Current password is required"),
    newPassword: passwordRules,
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine(
    ({ newPassword, confirmNewPassword }) => newPassword === confirmNewPassword,
    {
      error: "Passwords do not match",
      path: ["confirmNewPassword"],
    },
  );
