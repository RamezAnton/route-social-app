export interface RegistrationInterface {
  name: string;
  username: string;
  email: string;
  dateOfBirth: string;
  gender: "male" | "female";
  password: string;
  rePassword: string;
}

export interface LoginInterface {
  email: string;
  password: string;
}
