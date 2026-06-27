import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../api/axios.js";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [commonGroups, setCommonGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch both endpoints in parallel for faster loading
        const [profileRes, groupsRes] = await Promise.all([
          apiClient.get(`/users/${userId}`),
          apiClient.get(`/users/${userId}/groups`),
        ]);

        setProfileData(profileRes.data.data);
        setCommonGroups(groupsRes.data.data);
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (isLoading)
    return <div className="p-8 text-text-muted">Loading profile...</div>;
  if (!profileData)
    return <div className="p-8 text-red-400">User not found.</div>;

  const { userInfo, transactionHistory } = profileData;

  return (
    <div className="max-w-2xl p-6 flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="text-primary-500 hover:text-primary-400 text-sm font-medium w-fit"
      >
        ← Back
      </button>

      {/* Profile Header */}
      <div className="flex items-center gap-6 p-6 bg-gray-800/40 border border-gray-700 rounded-xl">
        <img
          src={userInfo.avatar}
          className="w-20 h-20 rounded-full border border-gray-700"
          alt={userInfo.fullName}
        />
        <div>
          <h1 className="text-2xl font-bold text-text-inverse">
            {userInfo.fullName}
          </h1>
          <p className="text-primary-400">@{userInfo.userName}</p>
        </div>
      </div>

      {/* Common Groups Section */}
      <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-text-inverse mb-4">
          Common Groups
        </h2>
        {commonGroups.length > 0 ? (
          <div className="flex flex-col gap-2">
            {commonGroups.map((group) => (
              <div
                key={group._id}
                className="flex justify-between items-center p-3 bg-gray-900 rounded-lg"
              >
                <span className="text-gray-200">{group.name}</span>
                <span className="text-xs text-text-muted">
                  {group.memberCount} members
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">No common groups.</p>
        )}
      </div>

      {/* Transaction Balances Section */}
      <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-text-inverse mb-4">
          Transaction Balances
        </h2>
        {transactionHistory.length > 0 ? (
          <div className="flex flex-col gap-3">
            {transactionHistory.map((t, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border border-gray-800"
              >
                <div>
                  <p className="text-text-inverse font-medium">{t.group}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded uppercase ${t.position === "owe" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}
                  >
                    {t.position}
                  </span>
                </div>
                <div
                  className={`font-bold ${t.position === "owe" ? "text-red-400" : "text-green-400"}`}
                >
                  {t.position === "owe" ? "-" : "+"} ₹{t.amount}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">Settled up!</p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
