import React, { useEffect, useState } from "react";
import { apiClient } from "../../api/axios.js";

const Account = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for the avatar popup modal
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("/users/me");
      // Mapping directly to your API's "data" object
      setProfile(response.data.data);
    } catch (err) {
      const backendErrorMessage =
        err.response?.data?.message || "Failed to load account details.";
      setError(backendErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Helper function to format MongoDB timestamps
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-text-inverse">Account Overview</h1>

      {/* Loading State */}
      {isLoading && (
        <div className="text-text-muted animate-pulse">Loading profile...</div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg text-sm w-fit">
          {error}
        </div>
      )}

      {/* Profile Content */}
      {!isLoading && !error && profile && (
        <div className="flex flex-col gap-6">
          {/* Main Identity Card */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 rounded-xl bg-gray-800/40 border border-gray-700">
            {/* Avatar Display - Now Clickable! */}
            <div
              onClick={() => setIsAvatarOpen(true)}
              className="w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 overflow-hidden shrink-0 flex items-center justify-center text-3xl font-bold text-text-muted cursor-pointer hover:opacity-80 hover:border-primary-500 transition-all"
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

            {/* Basic Info */}
            <div className="flex flex-col items-center md:items-start gap-1 flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-text-inverse">
                {profile.fullName}
              </h2>
              <p className="text-primary-500 font-medium">
                @{profile.userName}
              </p>
              <p className="text-text-muted text-sm mt-1">{profile.email}</p>
            </div>
          </div>

          {/* Account Details Data Table */}
          <div className="flex flex-col gap-4 p-6 rounded-xl bg-gray-800/40 border border-gray-700">
            <h3 className="text-lg font-semibold text-text-inverse border-b border-gray-800 pb-2 mb-2">
              Account Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              {/* Subscription Plan */}
              <div className="flex flex-col">
                <span className="text-sm text-text-muted">
                  Subscription Plan
                </span>
                <span className="text-text-inverse font-medium capitalize">
                  {profile.subscriptionPlan}
                </span>
              </div>

              {/* Account Created Date */}
              <div className="flex flex-col">
                <span className="text-sm text-text-muted">Member Since</span>
                <span className="text-text-inverse font-medium">
                  {formatDate(profile.createdAt)}
                </span>
              </div>

              {/* Last Updated Date */}
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
        </div>
      )}

      {/* --- AVATAR FULLSCREEN MODAL --- */}
      {isAvatarOpen && profile?.avatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsAvatarOpen(false)} // Clicking background closes it
        >
          <div className="relative max-w-lg w-full flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={() => setIsAvatarOpen(false)}
              className="absolute -top-12 right-0 text-gray-300 hover:text-white font-bold text-lg transition-colors"
            >
              ✕ Close
            </button>

            {/* The Full Image */}
            <img
              src={profile.avatar}
              alt="Full size avatar"
              className="w-full h-auto rounded-full md:rounded-xl border-4 border-gray-700 shadow-2xl object-contain max-h-[80vh] cursor-default"
              onClick={(e) => e.stopPropagation()} // Prevents clicking the image from closing the modal
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
