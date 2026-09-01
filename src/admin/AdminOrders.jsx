import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  adminApi,
  money,
  dateTime,
} from "./adminApi";

import { StatusBadge } from "./AdminDashboard";

const ORDER_STATUSES = [
  "Processing",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed"];

// =====================================================
// ORDER DETAIL MODAL
// =====================================================

const OrderModal = ({ orderId, onClose, onChanged, notify }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getOrder(orderId)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  const changePayment = async (paymentStatus) => {
    try {
      const data = await adminApi.updateOrderStatus(
        orderId,
        { paymentStatus }
      );

      setOrder((prev) => ({
        ...prev,
        paymentStatus: data.order.paymentStatus,
      }));

      notify("Payment status updated");
      onChanged();
    } catch (err) {
      notify(err.message, true);
    }
  };

  return (
    <div
      className="admin-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="admin-modal"
        style={{ maxWidth: 640 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-head">
          <h3>
            {order ? order.orderNumber : "Order"}
          </h3>

          <button
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="admin-modal-body">
          {loading && (
            <div className="admin-loading">
              Loading order…
            </div>
          )}

          {error && (
            <div className="admin-error">{error}</div>
          )}

          {order && (
            <>
              <div className="order-detail-grid">
                <div className="detail-block">
                  <h4>Ship to</h4>
                  <p>
                    {order.shippingAddress.firstName}{" "}
                    {order.shippingAddress.lastName}
                    <br />
                    {order.shippingAddress.address}
                    <br />
                    {order.shippingAddress.city}
                    {order.shippingAddress.state
                      ? `, ${order.shippingAddress.state}`
                      : ""}{" "}
                    {order.shippingAddress.zip}
                    <br />
                    {order.shippingAddress.phone}
                    <br />
                    {order.shippingAddress.email}
                  </p>
                </div>

                <div className="detail-block">
                  <h4>Order</h4>
                  <p>
                    Placed {dateTime(order.createdAt)}
                    <br />
                    Account:{" "}
                    {order.user?.name || "Deleted user"}
                    <br />
                    Method: {order.paymentMethod}
                    <br />
                    Status:{" "}
                    <StatusBadge
                      status={order.orderStatus}
                    />
                  </p>

                  <div style={{ marginTop: 10 }}>
                    <label
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#555",
                        display: "block",
                        marginBottom: 5,
                      }}
                    >
                      Payment status
                    </label>

                    <select
                      className="status-select"
                      value={order.paymentStatus}
                      onChange={(event) =>
                        changePayment(event.target.value)
                      }
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div
                    className="order-item-row"
                    key={index}
                  >
                    <img
                      className="cell-thumb"
                      src={item.image}
                      alt=""
                    />

                    <span className="name">
                      {item.name}
                    </span>

                    <span className="qty">
                      {item.quantity} × {money(item.price)}
                    </span>

                    <span className="amount">
                      {money(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>{money(order.subtotal)}</span>
                </div>

                <div className="total-row">
                  <span>Shipping</span>
                  <span>
                    {order.shipping === 0
                      ? "Free"
                      : money(order.shipping)}
                  </span>
                </div>

                <div className="total-row grand">
                  <span>Total</span>
                  <span>{money(order.total)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="admin-modal-foot">
          <button className="admin-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// ORDERS PAGE
// =====================================================

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [openOrderId, setOpenOrderId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const notify = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2600);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await adminApi.getOrders({
        search,
        status,
        page,
        limit: 15,
      });

      setOrders(data.orders);
      setMeta({
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const changeStatus = async (order, orderStatus) => {
    if (orderStatus === order.orderStatus) {
      return;
    }

    if (orderStatus === "Cancelled") {
      const confirmed = window.confirm(
        `Cancel ${order.orderNumber}? Stock will be returned to inventory.`
      );

      if (!confirmed) {
        return;
      }
    }

    setSavingId(order._id);

    try {
      const data = await adminApi.updateOrderStatus(
        order._id,
        { orderStatus }
      );

      setOrders((prev) =>
        prev.map((item) =>
          item._id === order._id
            ? {
                ...item,
                orderStatus: data.order.orderStatus,
                paymentStatus: data.order.paymentStatus,
              }
            : item
        )
      );

      notify(`${order.orderNumber} → ${orderStatus}`);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="admin-input search"
          placeholder="Search order number, email or name"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <select
          className="admin-select"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="All">All statuses</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-card">
        {loading ? (
          <div className="admin-loading">
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-empty">
            <strong>No orders match this view</strong>
            Try a different status or clear the search.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div className="cell-main">
                        {order.orderNumber}
                      </div>
                      <div className="cell-sub">
                        {dateTime(order.createdAt)}
                      </div>
                    </td>

                    <td>
                      <div className="cell-main">
                        {order.shippingAddress.firstName}{" "}
                        {order.shippingAddress.lastName}
                      </div>
                      <div className="cell-sub">
                        {order.shippingAddress.email}
                      </div>
                    </td>

                    <td className="cell-sub">
                      {order.items.length} item
                      {order.items.length === 1 ? "" : "s"}
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

                    <td className="num cell-main">
                      {money(order.total)}
                    </td>

                    <td>
                      <select
                        className="status-select"
                        value={order.orderStatus}
                        disabled={savingId === order._id}
                        onChange={(event) =>
                          changeStatus(
                            order,
                            event.target.value
                          )
                        }
                      >
                        {ORDER_STATUSES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          className="admin-btn sm"
                          onClick={() =>
                            setOpenOrderId(order._id)
                          }
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="admin-pager">
            <span>
              {meta.total} order
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

      {openOrderId && (
        <OrderModal
          orderId={openOrderId}
          onClose={() => setOpenOrderId(null)}
          onChanged={load}
          notify={notify}
        />
      )}

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

export default AdminOrders;
