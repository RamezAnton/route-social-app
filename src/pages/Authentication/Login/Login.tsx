import { Link } from "react-router-dom";
import LoginForm from "../../../components/Authentication/LoginForm/LoginForm";

export default function Login() {
  return (
    <div className="space-y-4">
      <LoginForm />
      <p className="text-center text-sm text-default-500">
        No account?{" "}
        <Link to="/auth/register" className="font-semibold text-primary">
          Register
        </Link>
      </p>
    </div>
  );
}
