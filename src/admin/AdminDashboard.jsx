import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  adminApi,
  money,
  shortDate,
} from "./adminApi";

// =====================================================
// STATUS BADGE
// =====================================================

export const StatusBadge = ({ status }) => (
  <span className={`badge badge-${String(status).toLowerCase()}`}>
    {status}
  </span>
);

// =====================================================
// 7 DAY SALES CHART
// =====================================================

const SalesChart = ({ data }) => {
  const max = Math.max(
    ...data.map((day) => day.revenue),
    1
  );

  return (
    <div className="chart-wrap">
      <div className="chart-bars">
        {data.map((day) => (
          <div className="chart-col" key={day.date}>
            <span className="chart-amount">
              {day.revenue > 0
                ? `₹${Math.round(day.revenue)}`
                : ""}
            </span>

            <div
              className="chart-bar"
              style={{
                height: `${(day.revenue / max) * 100}%`,
              }}
              title={`${day.orders} order(s) · ${money(
                day.revenue
              )}`}
            />

            <span className="chart-day">
              {new Date(day.date).toLocaleDateString(
                "en-GB",
                { weekday: "short" }
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// =====================================================
// DASHBOARD
// =====================================================

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getStats()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-card">
        <div className="admin-loading">
          Loading dashboard…
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="admin-error">{error}</div>;
  }

  const {
    stats,
    dailySales,
    topProducts,
    lowStockProducts,
    recentOrders,
  } = data;

  const weekRevenue = dailySales.reduce(
    (sum, day) => sum + day.revenue,
    0
  );

  return (
    <>
      {/* ============ STAT TILES ============ */}

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-label">Revenue</div>
          <div className="stat-value">
            {money(stats.totalRevenue)}
          </div>
          <div className="stat-note">
            {money(weekRevenue)} in the last 7 days
          </div>
        </div>

        <div className="stat-tile">
          <div className="stat-label">Orders</div>
          <div className="stat-value">
            {stats.totalOrders}
          </div>
          <div className="stat-note">
            {stats.statusCounts.Processing} awaiting
            confirmation
          </div>
        </div>

        <div className="stat-tile">
          <div className="stat-label">
            Average order value
          </div>
          <div className="stat-value">
            {money(stats.averageOrderValue)}
          </div>
          <div className="stat-note">
            Cancelled orders excluded
          </div>
        </div>

        <div className="stat-tile">
          <div className="stat-label">Customers</div>
          <div className="stat-value">
            {stats.totalUsers}
          </div>
          <div className="stat-note">
            {stats.totalProducts} products listed
          </div>
        </div>

        <div className="stat-tile">
          <div className="stat-label">Out of stock</div>
          <div className="stat-value">
            {stats.outOfStock}
          </div>
          <div
            className={`stat-note ${
              stats.outOfStock > 0 ? "danger" : ""
            }`}
          >
            {stats.outOfStock > 0
              ? "Restock these to keep selling"
              : "Everything is in stock"}
          </div>
        </div>
      </div>

      {/* ============ CHART + STATUS ============ */}

      <div className="admin-grid-2">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Revenue, last 7 days</h2>
          </div>

          <SalesChart data={dailySales} />
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Orders by status</h2>
            <Link to="/admin/orders" className="link">
              Manage
            </Link>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <tbody>
                {Object.entries(stats.statusCounts).map(
                  ([status, count]) => (
                    <tr key={status}>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                      <td className="num cell-main">
                        {count}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ============ RECENT ORDERS ============ */}

      <section
        className="admin-card"
        style={{ marginBottom: 16 }}
      >
        <div className="admin-card-head">
          <h2>Recent orders</h2>
          <Link to="/admin/orders" className="link">
            See all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="admin-empty">
            <strong>No orders yet</strong>
            Orders will appear here as soon as customers
            check out.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Placed</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="cell-main">
                      {order.orderNumber}
                    </td>

                    <td>
                      <div className="cell-main">
                        {order.user?.name || "Deleted user"}
                      </div>
                      <div className="cell-sub">
                        {order.user?.email || "—"}
                      </div>
                    </td>

                    <td className="cell-sub">
                      {shortDate(order.createdAt)}
                    </td>

                    <td>
                      <span
                        className={`badge badge-${String(
                          order.paymentStatus
                        ).toLowerCase()}`}
                      >
                        {order.paymentMethod} ·{" "}
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td>
                      <StatusBadge
                        status={order.orderStatus}
                      />
                    </td>

                    <td className="num cell-main">
                      {money(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ============ TOP + LOW STOCK ============ */}

      <div className="admin-grid-3">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Best sellers</h2>
          </div>

          {topProducts.length === 0 ? (
            <div className="admin-empty">
              Nothing sold yet.
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="num">Units</th>
                    <th className="num">Revenue</th>
                  </tr>
                </thead>

                <tbody>
                  {topProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="cell-product">
                          <img
                            className="cell-thumb"
                            src={product.image}
                            alt=""
                          />
                          <span className="cell-main">
                            {product.name}
                          </span>
                        </div>
                      </td>

                      <td className="num">
                        {product.unitsSold}
                      </td>

                      <td className="num cell-main">
                        {money(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Running low</h2>
            <Link to="/admin/products" className="link">
              Restock
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="admin-empty">
              Stock levels are healthy.
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="num">Left</th>
                  </tr>
                </thead>

                <tbody>
                  {lowStockProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="cell-product">
                          <img
                            className="cell-thumb"
                            src={product.image}
                            alt=""
                          />
                          <div>
                            <div className="cell-main">
                              {product.name}
                            </div>
                            <div className="cell-sub">
                              {product.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="num">
                        <span
                          className={`badge ${
                            product.stock <= 0
                              ? "badge-stock-out"
                              : "badge-stock-low"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default AdminDashboard;
