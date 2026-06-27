// // src/components/ProtectedRoute.jsx
// import { Navigate, Outlet } from "react-router-dom";
// import { useSelector } from "react-redux";

// const ProtectedRoute = () => {
//   const user = useSelector((state) => state.auth.user);

//   // If there is no user, redirect to login
//   // The 'replace' prop ensures this redirect is not added to the history stack
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   return <Outlet />;
// };

// export default ProtectedRoute;

// src/components/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();

  if (!user) {
    // 1. Redirect to login
    // 2. Pass 'from' state so we can redirect them back after they log in
    // 3. 'replace' is key here to clear the history stack
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
