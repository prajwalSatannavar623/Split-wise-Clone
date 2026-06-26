import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/authSlice.js";
import { NavLink, Outlet } from "react-router-dom";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
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
          <h1 className="text-2xl font-bold text-primary-500">SplitWise</h1>
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
              onClick={handleLogout}
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
    </div>
  );
};

export default Dashboard;
