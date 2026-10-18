import { Link } from "react-router-dom";
import RegisterForm from "../../../components/Authentication/RegisterForm/RegisterForm";

export default function Register() {
  return (
    <div className="space-y-4">
      <RegisterForm />
      <p className="text-center text-sm text-default-500">
        Already have an account?{" "}
        <Link to="/auth/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
