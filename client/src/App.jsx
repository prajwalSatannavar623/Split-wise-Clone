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
import Friends from "./pages/Dashboard/Friends.jsx";
import Activity from "./pages/Dashboard/Activity.jsx";
import Account from "./pages/Dashboard/Account.jsx";
import Overview from "./pages/Dashboard/Overview.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<SignUp />} />

      {/* {nested route} */}
      <Route path="/dashboard" element={<Dashboard />}>
        {/* index => exact -> /dashboard */}
        <Route index element={<Overview />} />

        {/* Children */}
        <Route path="groups" element={<Groups />} />
        <Route path="friends" element={<Friends />} />
        <Route path="activity" element={<Activity />} />
        <Route path="account" element={<Account />} />
      </Route>
    </>,
  ),
);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
