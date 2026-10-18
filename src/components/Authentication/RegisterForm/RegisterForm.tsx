import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { registrationSchema } from "../../../schema/authschema";
import type { RegistrationInterface } from "../../../interface/auth.interface";
import { signup } from "../../../api/api";

const inputClass =
  "w-full rounded-lg border border-default-200 bg-field-background px-3 py-2 text-sm outline-none focus:border-primary";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs text-danger">{message}</span>;
}

export default function RegisterForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInterface>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit: SubmitHandler<RegistrationInterface> = async (values) => {
    setServerError("");
    try {
      await signup(values);
      toast.success("Account created. Please sign in.");
      navigate("/auth/login", { state: location.state });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create account.";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="text-xl font-bold">Create account</h1>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Name</span>
        <input
          {...register("name")}
          placeholder="Your name"
          className={inputClass}
        />
        <FieldError message={errors.name?.message} />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Username</span>
        <input
          {...register("username")}
          placeholder="username123"
          className={inputClass}
        />
        <FieldError message={errors.username?.message} />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          {...register("email")}
          type="email"
          placeholder="you@example.com"
          className={inputClass}
        />
        <FieldError message={errors.email?.message} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Date of birth</span>
          <input
            {...register("dateOfBirth")}
            type="date"
            className={inputClass}
          />
          <FieldError message={errors.dateOfBirth?.message} />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Gender</span>
          <select {...register("gender")} className={inputClass} defaultValue="">
            <option value="" disabled>
              Select
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <FieldError message={errors.gender?.message} />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Password</span>
        <input
          {...register("password")}
          type="password"
          placeholder="••••••••"
          className={inputClass}
        />
        <FieldError message={errors.password?.message} />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Confirm password</span>
        <input
          {...register("rePassword")}
          type="password"
          placeholder="••••••••"
          className={inputClass}
        />
        <FieldError message={errors.rePassword?.message} />
      </label>

      {serverError && (
        <p role="alert" className="text-sm text-danger">
          {serverError}
        </p>
      )}

      <Button type="submit" fullWidth isDisabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Register"}
      </Button>
    </form>
  );
}
