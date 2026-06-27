import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { Link } from "react-router-dom";

import { useDispatch } from "react-redux";
import { setCredentials } from "../features/authSlice.js";

import { apiClient } from "../api/axios.js";

const SignUp = () => {
  const [preview, setPreview] = useState(null);
  const [avatar, setAvatar] = useState(null);

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsloading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    setIsloading(true);
    setError(null);

    if (!avatar) {
      setError("Please upload an avatar image.");
      setIsloading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("fullName", fullname);
      formData.append("userName", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("avatar", avatar);

      const response = await apiClient.post("/users/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
        err.response?.data?.message || "An unexpected Error occured";

      setError(backendErrorMessage);
    } finally {
      setIsloading(false);
    }
  };

  return (
    <>
      <div className="bg-bg-dark w-full min-h-screen flex flex-col gap-2 justify-center items-center">
        <label className="cursor-pointer">
          {/* The Visual UI */}
          <div className="w-32 h-32 rounded-full border-2 border-primary-500 flex items-center justify-center overflow-hidden bg-gray-800">
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col justify-center items-center">
                <span className="text-text-muted text-heading">+</span>
                <span className="text-text-muted">Upload</span>
              </div>
            )}
          </div>

          {/* The Hidden Input */}
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            disabled={isLoading}
          />
        </label>

        <form
          onSubmit={handleFormSubmit}
          className="w-full flex flex-col gap-2 justify-center items-center"
        >
          <Input
            value={fullname}
            id="fullname"
            label={"Full name"}
            type="text"
            required={true}
            className="text-text-inverse"
            placeholder="display name"
            onChange={setFullname}
            disabled={isLoading}
          />

          <Input
            value={username}
            id="username"
            label={"username"}
            type="text"
            required={true}
            className="text-text-inverse"
            placeholder="@username"
            onChange={setUsername}
            disabled={isLoading}
          />

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
            Register
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
          Already have account? &nbsp;
          <Link to={"/login"} className="text-base underline text-yellow-300">
            login here
          </Link>
        </p>
      </div>
    </>
  );
};

export default SignUp;
