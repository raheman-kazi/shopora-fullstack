import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { adminApi, money } from "./adminApi";

// =====================================================
// EMPTY FORM
// =====================================================

const blankProduct = {
  name: "",
  price: "",
  originalPrice: "",
  category: "",
  image: "",
  rating: "",
  description: "",
  stock: "",
  featured: false,
};

// =====================================================
// PRODUCT FORM MODAL
// =====================================================

const ProductModal = ({
  product,
  categories,
  onClose,
  onSaved,
  notify,
}) => {
  const isEdit = Boolean(product);

  const [form, setForm] = useState(
    product
      ? {
          name: product.name ?? "",
          price: product.price ?? "",
          originalPrice: product.originalPrice ?? "",
          category: product.category ?? "",
          image: product.image ?? "",
          rating: product.rating ?? "",
          description: product.description ?? "",
          stock: product.stock ?? "",
          featured: Boolean(product.featured),
        }
      : blankProduct
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (field) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError("");

    if (
      !form.name.trim() ||
      form.price === "" ||
      !form.category.trim() ||
      !form.image.trim() ||
      !form.description.trim()
    ) {
      setError(
        "Name, price, category, image and description are required."
      );
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        await adminApi.updateProduct(product._id, form);
        notify("Product updated");
      } else {
        await adminApi.createProduct(form);
        notify("Product added");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="admin-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="admin-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-head">
          <h3>
            {isEdit ? "Edit product" : "Add product"}
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
          {error && (
            <div className="admin-error">{error}</div>
          )}

          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="p-name">Name</label>
              <input
                id="p-name"
                className="admin-input"
                value={form.name}
                onChange={setField("name")}
                placeholder="Wireless headphones"
              />
            </div>

            <div className="form-field">
              <label htmlFor="p-price">Price</label>
              <input
                id="p-price"
                className="admin-input"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={setField("price")}
                placeholder="49.99"
              />
            </div>

            <div className="form-field">
              <label htmlFor="p-original">
                Compare-at price
              </label>
              <input
                id="p-original"
                className="admin-input"
                type="number"
                min="0"
                step="0.01"
                value={form.originalPrice ?? ""}
                onChange={setField("originalPrice")}
                placeholder="Optional"
              />
            </div>

            <div className="form-field">
              <label htmlFor="p-category">Category</label>
              <input
                id="p-category"
                className="admin-input"
                list="category-options"
                value={form.category}
                onChange={setField("category")}
                placeholder="Electronics"
              />
              <datalist id="category-options">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>

            <div className="form-field">
              <label htmlFor="p-stock">Stock</label>
              <input
                id="p-stock"
                className="admin-input"
                type="number"
                min="0"
                value={form.stock}
                onChange={setField("stock")}
                placeholder="0"
              />
            </div>

            <div className="form-field full">
              <label htmlFor="p-image">Image URL</label>
              <input
                id="p-image"
                className="admin-input"
                value={form.image}
                onChange={setField("image")}
                placeholder="https://…"
              />
            </div>

            {form.image && (
              <div className="form-field full">
                <img
                  className="image-preview"
                  src={form.image}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              </div>
            )}

            <div className="form-field">
              <label htmlFor="p-rating">
                Rating (0–5)
              </label>
              <input
                id="p-rating"
                className="admin-input"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={setField("rating")}
                placeholder="0"
              />
            </div>

            <div
              className="form-field"
              style={{ justifyContent: "flex-end" }}
            >
              <label className="form-check">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={setField("featured")}
                />
                Show on homepage
              </label>
            </div>

            <div className="form-field full">
              <label htmlFor="p-description">
                Description
              </label>
              <textarea
                id="p-description"
                className="admin-textarea"
                value={form.description}
                onChange={setField("description")}
                placeholder="What makes this product worth buying?"
              />
            </div>
          </div>
        </div>

        <div className="admin-modal-foot">
          <button
            className="admin-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="admin-btn primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "Saving…"
              : isEdit
              ? "Save changes"
              : "Add product"}
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// PRODUCTS PAGE
// =====================================================

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const notify = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2600);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await adminApi.getProducts({
        search,
        category,
        stock: stockFilter,
        page,
        limit: 12,
      });

      setProducts(data.products);
      setCategories(data.categories);
      setMeta({
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, stockFilter, page]);

  // Search me halka debounce
  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await adminApi.deleteProduct(product._id);
      notify("Product deleted");
      load();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setModalOpen(true);
  };

  const stockBadge = (stock) => {
    if (stock <= 0) return "badge-stock-out";
    if (stock <= 5) return "badge-stock-low";
    return "badge-stock-ok";
  };

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="admin-input search"
          placeholder="Search products by name"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <select
          className="admin-select"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="admin-select"
          value={stockFilter}
          onChange={(event) => {
            setStockFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Any stock level</option>
          <option value="low">Low stock (1–5)</option>
          <option value="out">Out of stock</option>
        </select>

        <button
          className="admin-btn primary"
          onClick={openAdd}
          style={{ marginLeft: "auto" }}
        >
          Add product
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-card">
        {loading ? (
          <div className="admin-loading">
            Loading products…
          </div>
        ) : products.length === 0 ? (
          <div className="admin-empty">
            <strong>No products found</strong>
            Change the filters, or add your first product.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="num">Price</th>
                  <th className="num">Stock</th>
                  <th>Homepage</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
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
                            {"★".repeat(
                              Math.round(product.rating)
                            ) || "Not rated"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="cell-sub">
                      {product.category}
                    </td>

                    <td className="num">
                      <div className="cell-main">
                        {money(product.price)}
                      </div>
                      {product.originalPrice ? (
                        <div
                          className="cell-sub"
                          style={{
                            textDecoration: "line-through",
                          }}
                        >
                          {money(product.originalPrice)}
                        </div>
                      ) : null}
                    </td>

                    <td className="num">
                      <span
                        className={`badge ${stockBadge(
                          product.stock
                        )}`}
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td className="cell-sub">
                      {product.featured ? "Featured" : "—"}
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          className="admin-btn sm"
                          onClick={() => openEdit(product)}
                        >
                          Edit
                        </button>

                        <button
                          className="admin-btn sm danger"
                          onClick={() =>
                            handleDelete(product)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="admin-pager">
            <span>
              {meta.total} product
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

      {modalOpen && (
        <ProductModal
          product={editing}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSaved={load}
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

export default AdminProducts;
