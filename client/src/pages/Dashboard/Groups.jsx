import { useEffect, useState } from "react";
import { apiClient } from "../../api/axios.js";
import { useNavigate } from "react-router-dom";

const Groups = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);

  // --- NEW STATE FOR CREATING GROUP ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  const getAllGroups = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("users/me/groups");
      setGroups(response.data.data);
    } catch (err) {
      const backendErrorMessage =
        err.response?.data?.message || "Failed to load groups.";
      setError(backendErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllGroups();
  }, []);

  // --- HANDLER TO CREATE GROUP ---
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setActionMessage({ type: "error", text: "Group name is required." });
      setTimeout(() => setActionMessage({ type: "", text: "" }), 3000);
      return;
    }

    setIsCreating(true);
    try {
      await apiClient.post("/groups/create-group", createForm);

      setActionMessage({
        type: "success",
        text: "Group created successfully!",
      });
      setCreateForm({ name: "", description: "" }); // Reset form
      setIsCreateModalOpen(false); // Close modal
      getAllGroups(); // Refresh the list to show the new group
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create group.",
      });
    } finally {
      setIsCreating(false);
      // Clear success/error message after 3 seconds
      setTimeout(() => setActionMessage({ type: "", text: "" }), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <h1 className="text-2xl font-bold text-text-inverse">Your Groups</h1>

      {/* Global Action Messages */}
      {actionMessage.text && (
        <div
          className={`p-3 rounded-lg text-sm font-medium w-fit transition-all ${
            actionMessage.type === "error"
              ? "bg-red-500/10 text-red-500 border border-red-500/50"
              : "bg-green-500/10 text-green-500 border border-green-500/50"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-text-muted animate-pulse">Loading groups...</div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg text-sm w-fit">
          {error}
        </div>
      )}

      {/* Populated State */}
      {!isLoading && !error && groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.groupId}
              onClick={() => navigate(`/dashboard/groups/${group.groupId}`)}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/40 border border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 shrink-0 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-xl border border-primary-500/20 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                {group.groupName
                  ? group.groupName.charAt(0).toUpperCase()
                  : "#"}
              </div>

              <div className="flex flex-col flex-1 overflow-hidden">
                <h3 className="font-semibold text-text-inverse text-lg truncate">
                  {group.groupName}
                </h3>

                {group.netBalance < 0 ? (
                  <p className="text-sm font-medium text-red-400">
                    You owe ₹{Math.abs(group.netBalance)}
                  </p>
                ) : group.netBalance > 0 ? (
                  <p className="text-sm font-medium text-green-400">
                    You are owed ₹{group.netBalance}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-text-muted">
                    Settled up
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-800/20 border border-gray-700 border-dashed rounded-xl">
          <p className="text-text-muted mb-2">
            You aren't part of any groups yet.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-primary-500 hover:text-primary-400 font-medium text-sm transition-colors"
          >
            + Create a new group
          </button>
        </div>
      )}

      {/* --- CREATE GROUP MODAL --- */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => {
            if (!isCreating) {
              setIsCreateModalOpen(false);
              setCreateForm({ name: "", description: "" });
            }
          }}
        >
          <form
            className="bg-bg-dark border border-gray-700 rounded-xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateGroup}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-text-inverse">
                Create New Group
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateForm({ name: "", description: "" });
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Goa Trip, Apartment 4B"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-text-inverse outline-none focus:border-primary-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">
                Description (Optional)
              </label>
              <textarea
                placeholder="What is this group for?"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-text-inverse outline-none focus:border-primary-500 h-24 resize-none transition-colors"
              />
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateForm({ name: "", description: "" });
                }}
                disabled={isCreating}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !createForm.name.trim()}
                className="px-6 py-2 rounded-lg font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- FLOATING ACTION BUTTON (Create Group) --- */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-10 right-10 flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-4 rounded-full shadow-lg shadow-primary-500/30 transition-all hover:scale-105 z-40 group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="font-semibold hidden sm:block">New Group</span>
      </button>
    </div>
  );
};

export default Groups;
