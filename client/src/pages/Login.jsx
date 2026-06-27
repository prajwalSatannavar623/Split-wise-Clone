import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useDispatch } from "react-redux";
import { setCredentials } from "../features/authSlice.js";

import { apiClient } from "../api/axios.js";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsloading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    setIsloading(true);
    setError(null);

    try {
      const response = await apiClient.post("users/auth/login", {
        email,
        password,
      });

      const { user, accessToken } = response.data.data;

      dispatch(
        setCredentials({
          user: user,
          token: accessToken,
        }),
      );

      navigate("/dashboard");
    } catch (err) {
      const backendErrorMessage =
        err.response?.data?.message || "An unexpected error occurred.";
      setError(backendErrorMessage);
    } finally {
      setIsloading(false);
    }
  };

  return (
    <>
      <div className="bg-bg-dark w-full h-screen flex flex-col gap-2 justify-center items-center">
        <form
          onSubmit={handleFormSubmit}
          className="w-full flex flex-col gap-2 justify-center items-center"
        >
          <Input
            value={email}
            id="email"
            label={"Email address"}
            type="email"
            required={true}
            className="text-text-inverse"
            placeholder="example@gmail.com"
            onChange={setEmail}
            disabled={isLoading}
          />
          <Input
            value={password}
            id="Password"
            label={"Password"}
            type="password"
            required={true}
            className="text-text-inverse"
            placeholder="password"
            onChange={setPassword}
            disabled={isLoading}
          />

          {error && (
            <div className="p-3 bg-red-500/10 text-secondary-600 border border-secondary-500 rounded-lg text-base text-center transition-all">
              {error}
            </div>
          )}

          <Button
            variant="primary"
            type={"submit"}
            className="w-1/2"
            disabled={isLoading}
          >
            Log in
          </Button>

          {isLoading ? (
            <span className="flex items-center gap-2">
              {/* CSS Spinner made with Tailwind */}
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Logging in...
            </span>
          ) : null}
        </form>
        <p className="text-text-inverse text-base">
          New user? &nbsp;
          <Link
            to={"/register"}
            className="text-base underline text-yellow-300"
          >
            register here
          </Link>
        </p>
      </div>
    </>
  );
};

export default Login;
