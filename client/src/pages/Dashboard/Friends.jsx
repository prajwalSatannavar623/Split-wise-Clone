import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/axios.js";

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await apiClient.get("/users/me/friends");
        setFriends(response.data.data);
      } catch (err) {
        console.error("Failed to fetch friends:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFriends();
  }, []);

  if (isLoading)
    return (
      <div className="p-8 text-text-muted animate-pulse">
        Loading friends...
      </div>
    );

  return (
    <div className="max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-text-inverse mb-6">
        Your Friends
      </h1>

      {friends.length === 0 ? (
        <div className="text-text-muted">
          No friends found yet. Join some groups!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {friends.map((friend) => (
            <div
              key={friend._id}
              onClick={() => navigate(`/dashboard/users/${friend._id}`)}
              className="flex items-center gap-4 p-4 bg-gray-800/40 border border-gray-700 rounded-xl hover:bg-gray-800/60 cursor-pointer transition-all"
            >
              <img
                src={friend.avatar}
                alt={friend.fullName}
                className="w-16 h-16 rounded-full object-cover border border-gray-600"
              />
              <div>
                <h2 className="text-lg font-bold text-text-inverse">
                  {friend.fullName}
                </h2>
                <p className="text-primary-500 text-sm">@{friend.userName}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Friends;
