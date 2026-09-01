import React, { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import "./admin.css";

// =====================================================
// ICONS
// =====================================================

const Icon = ({ path, size = 17 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {path}
  </svg>
);

const icons = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </>
  ),
  products: (
    <>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>
  ),
  orders: (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
};

// =====================================================
// PAGE TITLES
// =====================================================

const titles = {
  "/admin": {
    title: "Dashboard",
    sub: "Store performance at a glance",
  },
  "/admin/products": {
    title: "Products",
    sub: "Add, edit and manage stock",
  },
  "/admin/orders": {
    title: "Orders",
    sub: "Track and update customer orders",
  },
  "/admin/users": {
    title: "Customers",
    sub: "Accounts and spending",
  },
};

// =====================================================
// LAYOUT
// =====================================================

const AdminLayout = ({ user, onLogout }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const page =
    titles[location.pathname] || {
      title: "Admin",
      sub: "",
    };

  const closeMenu = () => setMenuOpen(false);

  const links = [
    { to: "/admin", label: "Dashboard", icon: icons.dashboard, end: true },
    { to: "/admin/products", label: "Products", icon: icons.products },
    { to: "/admin/orders", label: "Orders", icon: icons.orders },
    { to: "/admin/users", label: "Customers", icon: icons.users },
  ];

  return (
    <div className="admin-shell">
      {menuOpen && (
        <div className="admin-scrim" onClick={closeMenu} />
      )}

      {/* ============ SIDEBAR ============ */}

      <aside
        className={`admin-sidebar ${menuOpen ? "open" : ""}`}
      >
        <Link
          to="/admin"
          className="admin-brand"
          onClick={closeMenu}
        >
          <span className="dot">●</span>
          shopora
          <span className="tag">ADMIN</span>
        </Link>

        <nav className="admin-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={closeMenu}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon path={link.icon} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <div className="admin-who">
            <strong>{user?.name || "Admin"}</strong>
            {user?.email}
          </div>

          <Link
            to="/"
            className="admin-foot-link"
            onClick={closeMenu}
          >
            View store
          </Link>

          <button
            className="admin-foot-link"
            onClick={onLogout}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      {/* ============ MAIN ============ */}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Icon path={icons.menu} size={18} />
          </button>

          <h1>{page.title}</h1>
          <span className="sub">{page.sub}</span>

          <div className="admin-topbar-right">
            <Link to="/" className="admin-btn sm">
              Store
            </Link>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
