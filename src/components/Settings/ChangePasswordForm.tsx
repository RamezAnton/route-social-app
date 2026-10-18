import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@heroui/react";
import { toast } from "react-toastify";
import { z } from "zod";
import { changePasswordSchema } from "../../schema/authschema";
import { changePassword } from "../../api/api";

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const inputClass =
  "w-full rounded-lg border border-default-200 bg-field-background px-3 py-2 text-sm outline-none focus:border-primary";

export function ChangePasswordForm() {
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit: SubmitHandler<ChangePasswordValues> = async (values) => {
    setServerError("");
    try {
      await changePassword(values.password, values.newPassword);
      toast.success("Password updated.");
      reset();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update password.";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Current password</span>
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

      <label className="block space-y-1 text-sm">
        <span className="font-medium">New password</span>
        <input
          {...register("newPassword")}
          type="password"
          placeholder="••••••••"
          className={inputClass}
        />
        {errors.newPassword && (
          <span className="text-xs text-danger">
            {errors.newPassword.message}
          </span>
        )}
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Confirm new password</span>
        <input
          {...register("confirmNewPassword")}
          type="password"
          placeholder="••••••••"
          className={inputClass}
        />
        {errors.confirmNewPassword && (
          <span className="text-xs text-danger">
            {errors.confirmNewPassword.message}
          </span>
        )}
      </label>

      {serverError && (
        <p role="alert" className="text-sm text-danger">
          {serverError}
        </p>
      )}

      <Button type="submit" fullWidth isDisabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
