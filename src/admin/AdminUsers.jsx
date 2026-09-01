import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  adminApi,
  money,
  shortDate,
} from "./adminApi";

// =====================================================
// CUSTOMERS PAGE
// =====================================================

const AdminUsers = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const notify = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2600);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await adminApi.getUsers({
        search,
        role,
        page,
        limit: 15,
      });

      setUsers(data.users);
      setMeta({
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, role, page]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const toggleRole = async (user) => {
    const nextRole =
      user.role === "admin" ? "user" : "admin";

    const confirmed = window.confirm(
      nextRole === "admin"
        ? `Give ${user.name} full admin access?`
        : `Remove admin access from ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    setBusyId(user._id);

    try {
      await adminApi.updateUserRole(user._id, nextRole);
      notify(`${user.name} is now ${nextRole}`);
      load();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (user) => {
    const confirmed = window.confirm(
      `Delete ${user.name}? Their orders stay in the system but the account is removed.`
    );

    if (!confirmed) {
      return;
    }

    setBusyId(user._id);

    try {
      await adminApi.deleteUser(user._id);
      notify("Customer deleted");
      load();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="admin-input search"
          placeholder="Search name, email or phone"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <select
          className="admin-select"
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(1);
          }}
        >
          <option value="All">All accounts</option>
          <option value="admin">Admins</option>
          <option value="user">Customers</option>
        </select>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-card">
        {loading ? (
          <div className="admin-loading">
            Loading customers…
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty">
            <strong>No accounts found</strong>
            Clear the search to see everyone.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Joined</th>
                  <th>Role</th>
                  <th className="num">Orders</th>
                  <th className="num">Spent</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const isSelf =
                    currentUser?.id === user._id;

                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="cell-product">
                          <div className="avatar-sm">
                            {user.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <div className="cell-main">
                              {user.name}
                              {isSelf ? " (you)" : ""}
                            </div>
                            <div className="cell-sub">
                              {user.googleId
                                ? "Google account"
                                : "Password account"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="cell-sub">
                          {user.email}
                        </div>
                        <div className="cell-sub">
                          {user.phone || "No phone"}
                        </div>
                      </td>

                      <td className="cell-sub">
                        {shortDate(user.createdAt)}
                      </td>

                      <td>
                        <span
                          className={`badge badge-${user.role}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="num">
                        {user.orderCount}
                      </td>

                      <td className="num cell-main">
                        {money(user.totalSpent)}
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            className="admin-btn sm"
                            disabled={
                              isSelf || busyId === user._id
                            }
                            onClick={() => toggleRole(user)}
                          >
                            {user.role === "admin"
                              ? "Make customer"
                              : "Make admin"}
                          </button>

                          <button
                            className="admin-btn sm danger"
                            disabled={
                              isSelf ||
                              user.role === "admin" ||
                              busyId === user._id
                            }
                            onClick={() =>
                              removeUser(user)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="admin-pager">
            <span>
              {meta.total} account
              {meta.total === 1 ? "" : "s"} · page {page} of{" "}
              {meta.totalPages}
            </span>

            <div className="spacer">
              <button
                className="admin-btn sm"
                disabled={page <= 1}
                onClick={() => setPage((n) => n - 1)}
              >
                Previous
              </button>

              <button
                className="admin-btn sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((n) => n + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {toast && (
        <div
          className={`admin-toast ${
            toast.isError ? "error" : ""
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
};

export default AdminUsers;
