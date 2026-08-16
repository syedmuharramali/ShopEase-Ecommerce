import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaCheckCircle,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaSave,
  FaSearch,
  FaSpinner,
  FaStore,
  FaTruck,
} from "react-icons/fa";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100";

const formatPrice = (value) =>
  value === null || value === undefined || value === ""
    ? "—"
    : `PKR ${new Intl.NumberFormat("en-PK", {
        maximumFractionDigits: 0,
      }).format(Number(value) || 0)}`;

const getOrderItems = (order) =>
  Array.isArray(order?.items) ? order.items : [];

const getFulfillmentName = (order, fulfillment) => {
  const item = getOrderItems(order).find(
    (candidate) =>
      String(candidate.product) === String(fulfillment.product) &&
      String(candidate.variant) === String(fulfillment.variant)
  );

  return {
    productName: item?.productSnapshot?.name || "Markaz product",
    variantTitle:
      item?.variantSnapshot?.title ||
      item?.variantSnapshot?.sku ||
      "Default",
  };
};

const AdminMarkazPage = () => {
  const navigate = useNavigate();
  const { adminInfo } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [draft, setDraft] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingFulfillmentId, setSavingFulfillmentId] = useState("");
  const [notice, setNotice] = useState(null);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${adminInfo?.token || ""}` }),
    [adminInfo?.token]
  );

  useEffect(() => {
    if (!adminInfo?.token) navigate("/admin/login", { replace: true });
  }, [adminInfo?.token, navigate]);

  const showNotice = (type, message) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 4500);
  };

  const fetchWorkspace = async () => {
    if (!adminInfo?.token) return;

    try {
      setLoading(true);
      const [productResponse, orderResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/markaz/products`, {
          headers: authHeaders,
        }),
        axios.get(`${API_BASE_URL}/admin/markaz/orders`, {
          headers: authHeaders,
        }),
      ]);

      const incomingProducts = Array.isArray(productResponse.data?.products)
        ? productResponse.data.products
        : [];
      const incomingOrders = Array.isArray(orderResponse.data?.orders)
        ? orderResponse.data.orders
        : [];

      setProducts(incomingProducts);
      setOrders(incomingOrders);

      if (!selectedProductId && incomingProducts.length) {
        setSelectedProductId(incomingProducts[0]._id);
      }
    } catch (error) {
      console.error("Markaz workspace load error:", error);
      showNotice(
        "error",
        error.response?.data?.message || "Could not load the Markaz workspace."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminInfo?.token]);

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === selectedProductId) || null,
    [products, selectedProductId]
  );

  useEffect(() => {
    if (!selectedProduct) {
      setDraft(null);
      return;
    }

    setDraft({
      supplier: selectedProduct.supplier || "internal",
      supplierProductCode: selectedProduct.supplierProductCode || "",
      variants: (selectedProduct.variants || []).map((variant) => ({
        _id: variant._id,
        title: variant.title || variant.sku || "Default",
        shopEaseSku: variant.sku || "",
        sellingPrice: Number(variant.price || 0),
        supplierSku: variant.supplierSku || "",
        supplierCost:
          variant.supplierCost === null || variant.supplierCost === undefined
            ? ""
            : String(variant.supplierCost),
        expectedProfit:
          variant.expectedProfit === null || variant.expectedProfit === undefined
            ? ""
            : String(variant.expectedProfit),
      })),
    });
  }, [selectedProduct]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.brand, product.supplierProductCode, product.category?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [products, searchTerm]);

  const updateDraftVariant = (variantId, field, value) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant._id === variantId ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const updateLocalFulfillment = (orderId, fulfillmentId, field, value) => {
    setOrders((current) =>
      current.map((order) =>
        order._id !== orderId
          ? order
          : {
              ...order,
              supplierFulfillments: (order.supplierFulfillments || []).map(
                (entry) =>
                  entry._id === fulfillmentId
                    ? { ...entry, [field]: value }
                    : entry
              ),
            }
      )
    );
  };

  const saveProductSettings = async () => {
    if (!selectedProduct?._id || !draft || savingProduct) return;

    try {
      setSavingProduct(true);
      const response = await axios.put(
        `${API_BASE_URL}/admin/markaz/products/${selectedProduct._id}`,
        {
          supplier: draft.supplier,
          supplierProductCode: draft.supplierProductCode,
          variants: draft.variants.map((variant) => ({
            _id: variant._id,
            supplierSku: variant.supplierSku,
            supplierCost: variant.supplierCost,
            expectedProfit: variant.expectedProfit,
          })),
        },
        { headers: authHeaders }
      );

      const savedProduct = response.data?.product;
      if (savedProduct?._id) {
        setProducts((current) =>
          current.map((product) =>
            product._id === savedProduct._id ? savedProduct : product
          )
        );
      }
      showNotice("success", "Markaz product settings saved.");
    } catch (error) {
      showNotice(
        "error",
        error.response?.data?.message || "Could not save Markaz product settings."
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const saveFulfillment = async (orderId, fulfillment) => {
    if (!orderId || !fulfillment?._id || savingFulfillmentId) return;

    try {
      setSavingFulfillmentId(fulfillment._id);
      const response = await axios.put(
        `${API_BASE_URL}/admin/markaz/orders/${orderId}/fulfillments/${fulfillment._id}`,
        {
          status: fulfillment.status,
          externalOrderId: fulfillment.externalOrderId,
          trackingId: fulfillment.trackingId,
          courierName: fulfillment.courierName,
          estimatedDeliveryMinDays: fulfillment.estimatedDeliveryMinDays,
          estimatedDeliveryMaxDays: fulfillment.estimatedDeliveryMaxDays,
          riderName: fulfillment.riderName,
          riderPhone: fulfillment.riderPhone,
        },
        { headers: authHeaders }
      );

      const saved = response.data?.fulfillment;
      if (saved?._id) {
        setOrders((current) =>
          current.map((order) =>
            order._id !== orderId
              ? order
              : {
                  ...order,
                  status: response.data?.orderStatus || order.status,
                  supplierFulfillments: (order.supplierFulfillments || []).map(
                    (entry) => (entry._id === saved._id ? saved : entry)
                  ),
                }
          )
        );
      }

      showNotice(
        "success",
        response.data?.customerEmailSent
          ? "Fulfillment saved and the customer was emailed."
          : "Fulfillment saved."
      );
    } catch (error) {
      showNotice(
        "error",
        error.response?.data?.message || "Could not update Markaz fulfillment."
      );
    } finally {
      setSavingFulfillmentId("");
    }
  };

  if (!adminInfo?.token) return null;

  const pendingFulfillments = orders.reduce(
    (sum, order) =>
      sum +
      (order.supplierFulfillments || []).filter(
        (entry) => entry.status === "not_submitted"
      ).length,
    0
  );

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950">
      {notice && (
        <div className="fixed right-4 top-28 z-[100] w-[calc(100%-2rem)] max-w-sm">
          <div
            className={`flex gap-3 rounded-2xl border bg-white p-4 shadow-xl ${
              notice.type === "success"
                ? "border-emerald-100 text-emerald-700"
                : "border-red-100 text-red-700"
            }`}
          >
            {notice.type === "success" ? (
              <FaCheckCircle className="mt-0.5 shrink-0" />
            ) : (
              <FaExclamationTriangle className="mt-0.5 shrink-0" />
            )}
            <p className="text-sm font-medium">{notice.message}</p>
          </div>
        </div>
      )}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950"
          >
            <FaArrowLeft className="text-xs" /> Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Supplier workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Markaz integration
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Markaz remains private. ShopEase stores only the customer-safe delivery details needed for tracking and email updates.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-center">
                <p className="text-xl font-semibold">
                  {products.filter((product) => product.supplier === "markaz").length}
                </p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Markaz products
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3 text-center">
                <p className="text-xl font-semibold text-amber-800">{pendingFulfillments}</p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-600">
                  Need submission
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-[111px] z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6 lg:px-8">
          {[
            ["products", "Product setup", FaBoxOpen],
            ["orders", "Fulfillment", FaTruck],
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`relative inline-flex items-center gap-2 px-4 py-4 text-sm font-semibold ${
                activeTab === key ? "text-slate-950" : "text-slate-400"
              }`}
            >
              <Icon className="text-xs" /> {label}
              {activeTab === key && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-slate-950" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
            <div className="text-center">
              <FaSpinner className="mx-auto animate-spin text-2xl text-emerald-600" />
              <p className="mt-3 text-sm text-slate-400">Loading Markaz workspace...</p>
            </div>
          </div>
        ) : activeTab === "products" ? (
          <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-300" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search products..."
                    className={`${fieldClass} pl-9`}
                  />
                </div>
              </div>
              <div className="max-h-[650px] overflow-y-auto p-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => setSelectedProductId(product._id)}
                    className={`w-full rounded-2xl p-3 text-left transition ${
                      selectedProductId === product._id
                        ? "bg-slate-950 text-white"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className={`mt-1 text-[10px] ${selectedProductId === product._id ? "text-white/50" : "text-slate-400"}`}>
                      {product.category?.name || "Uncategorized"}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {selectedProduct && draft ? (
              <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Supplier configuration</p>
                    <h2 className="mt-1 text-xl font-semibold">{selectedProduct.name}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={saveProductSettings}
                    disabled={savingProduct}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {savingProduct ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    Save Markaz settings
                  </button>
                </div>

                <div className="space-y-6 p-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">Fulfillment source</label>
                      <select
                        value={draft.supplier}
                        onChange={(event) => setDraft((current) => ({ ...current, supplier: event.target.value }))}
                        className={fieldClass}
                      >
                        <option value="internal">ShopEase inventory</option>
                        <option value="markaz">Markaz dropshipping</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">Markaz product code</label>
                      <input
                        value={draft.supplierProductCode}
                        onChange={(event) => setDraft((current) => ({ ...current, supplierProductCode: event.target.value }))}
                        disabled={draft.supplier !== "markaz"}
                        placeholder="MZ2065200004HA"
                        className={`${fieldClass} font-mono disabled:bg-slate-50`}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {draft.variants.map((variant) => (
                      <div key={variant._id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="mb-4">
                          <p className="font-semibold">{variant.title}</p>
                          <p className="mt-1 text-xs text-slate-400">Selling {formatPrice(variant.sellingPrice)}</p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                          <input value={variant.supplierSku} onChange={(e) => updateDraftVariant(variant._id, "supplierSku", e.target.value)} placeholder="Markaz SKU" className={fieldClass} />
                          <input type="number" min="0" value={variant.supplierCost} onChange={(e) => updateDraftVariant(variant._id, "supplierCost", e.target.value)} placeholder="Supplier cost" className={fieldClass} />
                          <input type="number" min="0" value={variant.expectedProfit} onChange={(e) => updateDraftVariant(variant._id, "expectedProfit", e.target.value)} placeholder="Expected profit" className={fieldClass} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center">
            <FaClipboardCheck className="mx-auto text-3xl text-emerald-500" />
            <h2 className="mt-4 text-lg font-semibold">No Markaz orders yet</h2>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <section key={order._id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="font-mono text-sm font-semibold">{order.orderNumber || order._id}</p>
                    <p className="mt-1 text-xs text-slate-400">{order.name} · {order.phoneNumber} · {order.province}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">ShopEase status: {order.status}</p>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  {(order.supplierFulfillments || []).map((fulfillment) => {
                    const names = getFulfillmentName(order, fulfillment);
                    const busy = savingFulfillmentId === fulfillment._id;

                    return (
                      <div key={fulfillment._id} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 sm:p-5">
                        <div className="mb-5 flex items-start gap-3">
                          <FaStore className="mt-1 text-emerald-600" />
                          <div>
                            <p className="font-semibold">{names.productName}</p>
                            <p className="mt-1 text-xs text-slate-500">{names.variantTitle} · Qty {fulfillment.quantity}</p>
                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-4">
                          <div>
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Markaz order ID</label>
                            <input value={fulfillment.externalOrderId || ""} onChange={(e) => updateLocalFulfillment(order._id, fulfillment._id, "externalOrderId", e.target.value)} placeholder="Enter after placing order" className={fieldClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Courier</label>
                            <input value={fulfillment.courierName || ""} onChange={(e) => updateLocalFulfillment(order._id, fulfillment._id, "courierName", e.target.value)} placeholder="TCS / Leopards / Rider" className={fieldClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tracking ID</label>
                            <input value={fulfillment.trackingId || ""} onChange={(e) => updateLocalFulfillment(order._id, fulfillment._id, "trackingId", e.target.value)} placeholder="Courier tracking ID" className={fieldClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</label>
                            <select value={fulfillment.status || "not_submitted"} onChange={(e) => updateLocalFulfillment(order._id, fulfillment._id, "status", e.target.value)} className={fieldClass}>
                              <option value="not_submitted">Not submitted</option>
                              <option value="submitted">Submitted to Markaz</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Min delivery days</label>
                            <input type="number" min="1" max="90" value={fulfillment.estimatedDeliveryMinDays ?? ""} onChange={(e) => updateLocalFulfillment(order._id, fulfillment._id, "estimatedDeliveryMinDays", e.target.value)} placeholder="3" className={fieldClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Max delivery days</label>
                            <input type="number" min="1" max="90" value={fulfillment.estimatedDeliveryMaxDays ?? ""} onChange={(e) => updateLocalFulfillment(order._id, fulfillment._id, "estimatedDeliveryMaxDays", e.target.value)} placeholder="5" className={fieldClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Rider name</label>
                            <input value={fulfillment.riderName || ""} onChange={(e) => updateLocalFulfillment(order._id, fulfillment._id, "riderName", e.target.value)} placeholder="Only when assigned" className={fieldClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Rider phone</label>
                            <input value={fulfillment.riderPhone || ""} onChange={(e) => updateLocalFulfillment(order._id, fulfillment._id, "riderPhone", e.target.value)} placeholder="03XXXXXXXXX" className={fieldClass} />
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs leading-5 text-blue-800">
                            Saving changes updates customer tracking. For submitted, shipped or delivered orders, ShopEase emails the customer when these delivery details change.
                          </p>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => saveFulfillment(order._id, fulfillment)}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {busy ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            Save delivery update
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminMarkazPage;
