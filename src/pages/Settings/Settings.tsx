import { ChangePasswordForm } from "../../components/Settings/ChangePasswordForm";

export default function Settings() {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-xl font-bold">Settings</h1>
      <div className="rounded-2xl border border-default-200 bg-background p-6">
        <h2 className="mb-4 font-semibold">Change password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
