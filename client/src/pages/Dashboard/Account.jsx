import { useEffect, useState, useRef } from "react";
import { apiClient } from "../../api/axios.js";

import { useDispatch } from "react-redux";
import { updateUserProfile } from "../../features/authSlice.js";

const Account = () => {
  // Local State
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  // Updates & Forms
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    userName: "",
    email: "",
  });

  // Password Change States
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get("/users/me");
        setProfile(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load account details.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  // Helper function
  const showMessage = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage({ type: "", text: "" }), 5000);
  };

  // --- API Handlers ---

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await apiClient.put("/users/me", profileForm);
      setProfile(response.data.data);
      dispatch(updateUserProfile(response.data.data));
      setIsEditingProfile(false);
      showMessage("success", "Profile updated successfully!");
    } catch (err) {
      showMessage(
        "error",
        err.response?.data?.message || "Failed to update profile.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setIsUpdating(true);
    try {
      const response = await apiClient.put("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(response.data.data);
      dispatch(updateUserProfile(response.data.data));
      showMessage("success", "Avatar updated successfully!");
    } catch (err) {
      showMessage(
        "error",
        err.response?.data?.message || "Failed to update avatar.",
      );
    } finally {
      setIsUpdating(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage("error", "New passwords do not match.");
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.post("/users/change-password", passwordForm);
      setIsChangingPassword(false);
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showMessage("success", "Password updated successfully!");
    } catch (err) {
      showMessage(
        "error",
        err.response?.data?.message || "Failed to change password.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Utilities ---
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const openEditProfile = () => {
    setProfileForm({
      fullName: profile.fullName || "",
      userName: profile.userName || "",
      email: profile.email || "",
    });
    setIsEditingProfile(true);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-text-inverse">Account Overview</h1>

      {/* Global Action Messages */}
      {actionMessage.text && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            actionMessage.type === "error"
              ? "bg-red-500/10 text-red-500 border border-red-500/50"
              : "bg-green-500/10 text-green-500 border border-green-500/50"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {isLoading && (
        <div className="text-text-muted animate-pulse">Loading profile...</div>
      )}
      {error && (
        <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg text-sm w-fit">
          {error}
        </div>
      )}

      {!isLoading && !error && profile && (
        <div className="flex flex-col gap-6">
          {/* Main Identity Card */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 rounded-xl bg-gray-800/40 border border-gray-700 relative">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => setIsAvatarOpen(true)}
                className="w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 overflow-hidden shrink-0 flex items-center justify-center text-3xl font-bold text-text-muted cursor-pointer hover:opacity-80 hover:border-primary-500 transition-all"
                title="View Avatar"
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.fullName?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdating}
                className="text-tiny text-text-inverse bg-primary-500 rounded hover:text-primary-400 font-medium disabled:opacity-50 px-2 py-1"
              >
                {isUpdating ? "Uploading..." : "Change Avatar"}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Basic Info / Edit Form */}
            <div className="flex flex-col items-center md:items-start gap-1 flex-1 text-center md:text-left w-full">
              {!isEditingProfile ? (
                <>
                  <h2 className="text-2xl font-bold text-text-inverse">
                    {profile.fullName}
                  </h2>
                  <p className="text-primary-500 font-medium">
                    @{profile.userName}
                  </p>
                  <p className="text-text-muted text-sm mt-1">
                    {profile.email}
                  </p>
                  <button
                    onClick={openEditProfile}
                    className="mt-3 px-4 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <form
                  onSubmit={handleUpdateProfile}
                  className="flex flex-col gap-3 w-full"
                >
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        fullName: e.target.value,
                      })
                    }
                    placeholder="Full Name"
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-text-inverse focus:border-primary-500 outline-none"
                  />
                  <input
                    type="text"
                    value={profileForm.userName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        userName: e.target.value,
                      })
                    }
                    placeholder="Username"
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-text-inverse focus:border-primary-500 outline-none"
                  />
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    placeholder="Email"
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-text-inverse focus:border-primary-500 outline-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-4 py-1.5 text-sm bg-primary-600 hover:bg-primary-500 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      disabled={isUpdating}
                      className="px-4 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Account Details Data Table */}
          <div className="flex flex-col gap-4 p-6 rounded-xl bg-gray-800/40 border border-gray-700">
            <h3 className="text-lg font-semibold text-text-inverse border-b border-gray-800 pb-2 mb-2">
              Account Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex flex-col">
                <span className="text-sm text-text-muted">
                  Subscription Plan
                </span>
                <span className="text-text-inverse font-medium capitalize">
                  {profile.subscriptionPlan || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-text-muted">Member Since</span>
                <span className="text-text-inverse font-medium">
                  {formatDate(profile.createdAt)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-text-muted">
                  Last Profile Update
                </span>
                <span className="text-text-inverse font-medium">
                  {formatDate(profile.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Password Management */}
          <div className="flex flex-col gap-4 p-6 rounded-xl bg-gray-800/40 border border-gray-700">
            <h3 className="text-lg font-semibold text-text-inverse border-b border-gray-800 pb-2 mb-2">
              Security
            </h3>
            {!isChangingPassword ? (
              <div>
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                  Change Password
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleChangePassword}
                className="flex flex-col gap-4 max-w-sm"
              >
                <input
                  type="password"
                  placeholder="Current Password"
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      oldPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-text-inverse focus:border-primary-500 outline-none"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-text-inverse focus:border-primary-500 outline-none"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-text-inverse focus:border-primary-500 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-1.5 text-sm bg-primary-600 hover:bg-primary-500 text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    disabled={isUpdating}
                    className="px-4 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/*AVATAR FULLSCREEN MODAL*/}
      {isAvatarOpen && profile?.avatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsAvatarOpen(false)}
        >
          <div className="relative max-w-lg w-full flex flex-col items-center">
            <button
              onClick={() => setIsAvatarOpen(false)}
              className="absolute -top-12 right-0 text-gray-300 hover:text-white font-bold text-lg transition-colors"
            >
              ✕ Close
            </button>
            <img
              src={profile.avatar}
              alt="Full size avatar"
              className="w-full h-auto rounded-full md:rounded-xl border-4 border-gray-700 shadow-2xl object-contain max-h-[80vh] cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
