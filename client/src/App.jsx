import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";

import Home from "./pages/Home.jsx";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard.jsx";
import Groups from "./pages/Dashboard/Groups.jsx";
import GroupDetails from "./pages/Dashboard/GroupDetails.jsx";
import ExpenseForm from "./pages/Dashboard/ExpenseForm.jsx";
import Friends from "./pages/Dashboard/Friends.jsx";
import Activity from "./pages/Dashboard/Activity.jsx";
import Account from "./pages/Dashboard/Account.jsx";
import Overview from "./pages/Dashboard/Overview.jsx";
import ExpenseDetails from "./Pages/Dashboard/ExpenseDetails.jsx";

import { useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { apiClient } from "./api/axios.js";
import { setCredentials } from "./features/authSlice.js";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import UserProfile from "./Pages/Dashboard/UserProfile";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<SignUp />} />

      {/* {nested route} */}
      <Route path="/dashboard" element={<ProtectedRoute />}>
        <Route element={<Dashboard />}>
          {/* index => exact -> /dashboard */}
          <Route index element={<Overview />} />

          {/* Children */}
          <Route path="groups" element={<Groups />} />
          <Route path="groups/:groupId" element={<GroupDetails />} />
          <Route path="groups/:groupId/add-expense" element={<ExpenseForm />} />

          {/* --- NEW: Expense Details Route --- */}
          <Route path="expenses/:expenseId" element={<ExpenseDetails />} />

          <Route path="expenses/edit/:expenseId" element={<ExpenseForm />} />

          <Route path="friends" element={<Friends />} />
          <Route path="users/:userId" element={<UserProfile />} />

          <Route path="activity" element={<Activity />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Route>
    </>,
  ),
);

const App = () => {
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await apiClient.get("/users/me");
        // Assuming your backend response data structure
        dispatch(
          setCredentials({
            user: response.data.data,
            // If you store token in localStorage, you can re-validate it here too
          }),
        );
      } catch (err) {
        console.log("No active session found");
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [dispatch]);

  // Prevent rendering the router until we know if the user is logged in
  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }
  return <RouterProvider router={router} />;
};

export default App;
