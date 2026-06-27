import React, { useEffect, useState } from "react";
import { apiClient } from "../../api/axios.js";
import { useNavigate } from "react-router-dom"; // 1. Import useNavigate

const Groups = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);

  const navigate = useNavigate(); // 2. Initialize the hook

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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-inverse">Your Groups</h1>

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
              // 3. Add the onClick handler here!
              onClick={() => navigate(`/dashboard/groups/${group.groupId}`)}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/40 border border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-all cursor-pointer group"
            >
              {/* Group Avatar (Square with rounded corners) */}
              <div className="w-12 h-12 shrink-0 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-xl border border-primary-500/20 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                {group.groupName
                  ? group.groupName.charAt(0).toUpperCase()
                  : "#"}
              </div>

              {/* Group Details */}
              <div className="flex flex-col flex-1 overflow-hidden">
                <h3 className="font-semibold text-text-inverse text-lg truncate">
                  {group.groupName}
                </h3>

                {/* Balance Logic based on netBalance */}
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
          <button className="text-primary-500 hover:text-primary-400 font-medium text-sm transition-colors">
            + Create a new group
          </button>
        </div>
      )}
    </div>
  );
};

export default Groups;
