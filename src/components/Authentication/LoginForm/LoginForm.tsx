import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@heroui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginSchema } from "../../../schema/authschema";
import type { LoginInterface } from "../../../interface/auth.interface";
import { useAuth } from "../../../context/AuthContext";


const inputClass =
  "w-full rounded-lg border border-default-200 bg-field-background px-3 py-2 text-sm outline-none focus:border-primary";

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInterface>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginInterface> = async (values) => {
    setServerError("");
    try {
      await login(values);
      toast.success("Welcome back.");
      const from =
        (location.state as { from?: string } | null)?.from ?? "/";
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to sign in.";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <h1 className="text-xl font-bold">Sign in</h1>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Email or Username</span>
          <input
            {...register("email")}
            type="email"
            placeholder="Email address or username"
            className={inputClass}
          />
          {errors.email && (
            <span className="text-xs text-danger">{errors.email.message}</span>
          )}
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Password</span>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className={inputClass}
          />
          {errors.password && (
            <span className="text-xs text-danger">{errors.password.message}</span>
          )}
        </label>

        {serverError && (
          <p role="alert" className="text-sm text-danger">
            {serverError}
          </p>
        )}

        <Button type="submit" fullWidth isDisabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Login"}
        </Button>
      </form>
    </>
  );
}
