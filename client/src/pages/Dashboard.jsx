import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/authSlice.js";
import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiClient } from "../api/axios.js";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      window.location.replace("/login");
    }
  }, [user, navigate]);

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false);

    localStorage.removeItem("accessToken");
    dispatch(logout());

    try {
      await apiClient.post("/users/auth/logout");
    } catch (err) {
      console.log(err);
    }

    // 3. NUCLEAR HISTORY RESET
    window.location.href = "/login";
  };

  const navLinkClasses = ({ isActive }) =>
    isActive
      ? "p-3 bg-gray-800 rounded-lg text-secondary-600 font-medium transition"
      : "p-3 text-text-muted hover:bg-gray-800 hover:text-white rounded-lg transition";

  return (
    <div className="flex h-screen bg-bg-dark text-text-inverse font-sans">
      {/* {sidebar} */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-primary-500">
            <span>SplitWise</span>
            <img src="/logo.svg" alt="SplitWise Logo" className="h-8 w-8" />
          </h1>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          <NavLink to="/dashboard" end className={navLinkClasses}>
            Dashboard
          </NavLink>
          <NavLink to="/dashboard/groups" className={navLinkClasses}>
            Groups
          </NavLink>
          <NavLink to="/dashboard/friends" className={navLinkClasses}>
            Friends
          </NavLink>
          <NavLink to="/dashboard/activity" className={navLinkClasses}>
            Activity
          </NavLink>
          <NavLink to="/dashboard/account" className={navLinkClasses}>
            Account
          </NavLink>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-900/50">
          <h2 className="text-xl font-semibold">Overview</h2>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">
                  {user?.fullName || "Guest User"}
                </p>
                <p className="text-xs text-text-muted">
                  {user?.userName || "@guest"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-700 border border-gray-600 overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-text-muted">
                    {user?.fullName?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="text-sm text-red-400 hover:text-red-300 transition"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex flex-col overflow-y-auto p-8 gap-4">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Log out?</h3>
            <p className="text-text-muted mb-6">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
