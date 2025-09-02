import { Route, Routes } from "react-router-dom";
import ErrorCtxProvider from "@/contexts/error.js";
import PermErrCtxProvider from "@/contexts/permission_error.js";
import CurrUserCtxProvider from "@/contexts/current_user.js";
import React from "react";

//lazy imports
const Usage = React.lazy(() => import("@/pages/Usage/index.js"));
const Login = React.lazy(() => import("@/pages/auth/Login/index.js"));
const ForgotPassword = React.lazy(
  () => import("@/pages/auth/ForgotPassword/index.js"),
);
const ResetPassword = React.lazy(
  () => import("@/pages/auth/ResetPassword/index.js"),
);
const HomePage = React.lazy(() => import("@/pages/HomePage.js"));
const ProtectedRoute = React.lazy(() => import("./ProtectedRoute.js"));

const AppRoute = () => {
  return (
    <ErrorCtxProvider>
      <PermErrCtxProvider>
        <CurrUserCtxProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/*" element={<ProtectedRoute />} />
          </Routes>
        </CurrUserCtxProvider>
      </PermErrCtxProvider>
    </ErrorCtxProvider>
  );
};

export default AppRoute;
