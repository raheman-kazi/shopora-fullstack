import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { adminApi } from "./adminApi";
import "./admin.css";

// =====================================================
// ADMIN ROUTE GUARD
//
// Frontend check sirf UI ke liye hai.
// Asli security backend ke adminOnly middleware me hai.
// =====================================================

const AdminRoute = ({ user, authLoading, children }) => {
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setChecking(false);
      setAllowed(false);
      return;
    }

    let active = true;

    adminApi
      .verify()
      .then(() => {
        if (active) {
          setAllowed(true);
          setChecking(false);
        }
      })
      .catch(() => {
        if (active) {
          setAllowed(false);
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  if (authLoading || checking) {
    return (
      <div className="admin-shell">
        <div className="admin-loading" style={{ margin: "auto" }}>
          Checking admin access…
        </div>
      </div>
    );
  }

  if (!localStorage.getItem("token")) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
