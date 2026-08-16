import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";
import { useSelector } from "react-redux";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArchive,
  FaArrowLeft,
  FaBoxOpen,
  FaCheck,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaEdit,
  FaExclamationTriangle,
  FaImage,
  FaLayerGroup,
  FaPlus,
  FaSave,
  FaSpinner,
  FaStar,
  FaTimes,
  FaTrash,
  FaTruck,
} from "react-icons/fa";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const getServerOrigin = () => {
  if (!API_BASE_URL) return "";

  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
};

const getImageUrl = (image) => {
  const rawPath = typeof image === "string" ? image : image?.url;

  if (!rawPath) {
    return "https://placehold.co/800x800/f8fafc/94a3b8?text=ShopEase";
  }

  const cleanPath = rawPath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;

  return `${getServerOrigin()}/${cleanPath.replace(/^\/+/, "")}`;
};

const normalizeProduct = (payload) =>
  payload?.product || payload || null;

const normalizeProducts = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  return [];
};

const normalizeOptions = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.options)) return payload.options;
  return [];
};

const normalizeVariants = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.variants)) return payload.variants;
  return [];
};

const formatPrice = (value) =>
  `PKR ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;

const fieldClass = (hasError = false) =>
  `w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
    hasError
      ? "border-red-300 ring-4 ring-red-50 focus:border-red-400"
      : "border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
  }`;

const SectionCard = ({ title, description, icon: Icon, children, action }) => (
  <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_45px_rgba(15,23,42,0.035)]">
    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
          <Icon className="text-sm" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      {action}
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

const DELIVERY_REGIONS = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Islamabad Capital Territory",
  "Azad Jammu & Kashmir",
];

const createEmptyDeliveryRates = () =>
  DELIVERY_REGIONS.map((region) => ({
    region,
    charge: "",
    isAvailable: true,
  }));

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adminInfo } = useSelector((state) => state.auth);

  const isEditMode = Boolean(id);

  const [activeTab, setActiveTab] = useState("details");
  const [productId, setProductId] = useState(id || "");

  const [productForm, setProductForm] = useState({
    name: "",
    shortDescription: "",
    description: "",
    brand: "",
    category: "",
    status: "active",
    featured: false,
  });

  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const [options, setOptions] = useState([]);
  const [variants, setVariants] = useState([]);

  const [deliveryRates, setDeliveryRates] = useState(
    createEmptyDeliveryRates
  );
  const [deliveryConfigured, setDeliveryConfigured] =
    useState(false);

  const [loadingPage, setLoadingPage] = useState(isEditMode);
  const [savingProduct, setSavingProduct] = useState(false);
  const [loadingCommerce, setLoadingCommerce] = useState(false);

  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);

  const [optionModal, setOptionModal] = useState(null);
  const [optionSaving, setOptionSaving] = useState(false);

  const [variantModal, setVariantModal] = useState(null);
  const [variantSaving, setVariantSaving] = useState(false);

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveBusy, setArchiveBusy] = useState(false);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${adminInfo?.token || ""}`,
    }),
    [adminInfo?.token]
  );

  useEffect(() => {
    if (!adminInfo?.token) {
      navigate("/admin/login", { replace: true });
    }
  }, [adminInfo?.token, navigate]);

  useEffect(() => {
    if (!adminInfo?.token) return;

    fetchCategories();

    if (id) {
      fetchProductWorkspace(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, adminInfo?.token]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]);

  const showNotice = (type, message) => {
    setNotice({ type, message });

    window.setTimeout(() => {
      setNotice(null);
    }, 3500);
  };

   const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/categories`
      );

      const incomingCategories =
        Array.isArray(response.data?.categories)
          ? response.data.categories
          : [];

      setCategories(
        [...incomingCategories].sort((a, b) =>
          String(a.name || "").localeCompare(
            String(b.name || "")
          )
        )
      );
    } catch (error) {
      console.warn(
        "Could not load categories:",
        error
      );

      setCategories([]);
    }
  };

  const fetchDeliveryRates = async (targetProductId) => {
    if (!targetProductId) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/products/admin/${targetProductId}/delivery-rates`,
        {
          headers: authHeaders,
        }
      );

      const configured = Boolean(response.data?.configured);
      const incomingRates = Array.isArray(response.data?.rates)
        ? response.data.rates
        : [];

      setDeliveryConfigured(configured);

      if (!configured) {
        setDeliveryRates(createEmptyDeliveryRates());
        return;
      }

      setDeliveryRates(
        DELIVERY_REGIONS.map((region) => {
          const existing = incomingRates.find(
            (rate) => rate.region === region
          );

          return {
            region,
            charge:
              existing?.charge !== undefined &&
              existing?.charge !== null
                ? String(existing.charge)
                : "",
            isAvailable: existing?.isAvailable !== false,
          };
        })
      );
    } catch (error) {
      console.error("Delivery rates loading error:", error);
      setDeliveryConfigured(false);
      setDeliveryRates(createEmptyDeliveryRates());

      showNotice(
        "error",
        error.response?.data?.message ||
          "Could not load delivery charges for this product."
      );
    }
  };

  const updateDeliveryRate = (index, field, value) => {
    setDeliveryRates((current) =>
      current.map((rate, rateIndex) =>
        rateIndex === index
          ? {
              ...rate,
              [field]: value,
            }
          : rate
      )
    );

    if (errors.delivery) {
      setErrors((current) => ({
        ...current,
        delivery: "",
      }));
    }
  };

  const getDeliveryPayload = () => ({
    rates: deliveryRates.map((rate) => ({
      region: rate.region,
      charge: rate.isAvailable ? Number(rate.charge) : 0,
      isAvailable: Boolean(rate.isAvailable),
    })),
  });

  const saveDeliveryRatesForProduct = async (targetProductId) => {
    const response = await axios.put(
      `${API_BASE_URL}/products/${targetProductId}/delivery-rates`,
      getDeliveryPayload(),
      {
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
      }
    );

    const savedRates = response.data?.delivery?.rates;

    if (Array.isArray(savedRates)) {
      setDeliveryRates(
        DELIVERY_REGIONS.map((region) => {
          const savedRate = savedRates.find(
            (rate) => rate.region === region
          );

          return {
            region,
            charge:
              savedRate?.isAvailable === false
                ? ""
                : String(savedRate?.charge ?? ""),
            isAvailable: savedRate?.isAvailable !== false,
          };
        })
      );
    }

    setDeliveryConfigured(true);
    return response;
  };

  const fetchProductWorkspace = async (targetProductId) => {
    try {
      setLoadingPage(true);
      setErrors({});

      const productResponse = await axios.get(
        `${API_BASE_URL}/products/${targetProductId}`
      );

      const product = normalizeProduct(productResponse.data);

      if (!product?._id) {
        throw new Error("Product not found");
      }

      setProductId(product._id);

      setProductForm({
        name: product.name || "",
        shortDescription: product.shortDescription || "",
        description: product.description || "",
        brand: product.brand || "",
        category:
          typeof product.category === "object"
            ? product.category?._id || ""
            : product.category || "",
        status: product.status || "active",
        featured: Boolean(product.featured),
      });

      setExistingImages(
        Array.isArray(product.images) ? product.images : []
      );

      await Promise.all([
        fetchCommerceData(product._id),
        fetchDeliveryRates(product._id),
      ]);
    } catch (error) {
      console.error("Product workspace error:", error);

      setErrors({
        page:
          error.response?.data?.message ||
          "We couldn't load this product.",
      });
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchCommerceData = async (targetProductId = productId) => {
    if (!targetProductId) return;

    try {
      setLoadingCommerce(true);

      const [optionsResponse, variantsResponse] =
        await Promise.all([
          axios.get(
            `${API_BASE_URL}/products/${targetProductId}/options`
          ),
          axios.get(
            `${API_BASE_URL}/products/${targetProductId}/variants`
          ),
        ]);

      setOptions(normalizeOptions(optionsResponse.data));
      setVariants(normalizeVariants(variantsResponse.data));
    } catch (error) {
      console.error("Commerce data error:", error);

      showNotice(
        "error",
        error.response?.data?.message ||
          "Product saved, but options/variants could not be loaded."
      );
    } finally {
      setLoadingCommerce(false);
    }
  };

  const handleProductChange = (event) => {
    const { name, value, type, checked } = event.target;

    setProductForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name] || errors.product) {
      setErrors((current) => ({
        ...current,
        [name]: "",
        product: "",
      }));
    }
  };

  const handleImagesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const underLimit = file.size <= 5 * 1024 * 1024;
      return isImage && underLimit;
    });

    if (validFiles.length !== files.length) {
      showNotice(
        "error",
        "Only image files up to 5MB each can be uploaded."
      );
    }

    const previews = validFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setNewImages((current) => [...current, ...validFiles]);
    setNewImagePreviews((current) => [...current, ...previews]);

    event.target.value = "";
  };

  const removeNewImage = (index) => {
    setNewImagePreviews((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });

    setNewImages((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const validateProduct = () => {
    const nextErrors = {};

    if (!productForm.name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    if (!productForm.description.trim()) {
      nextErrors.description = "Product description is required.";
    }

    if (!productForm.category) {
      nextErrors.category = "Please select a category.";
    }

    if (!isEditMode && !productId && newImages.length === 0) {
      nextErrors.product =
        "Add at least one product image before creating the product.";
    }

    const invalidDeliveryRate = deliveryRates.find(
      (rate) =>
        rate.isAvailable &&
        (!Number.isFinite(Number(rate.charge)) ||
          Number(rate.charge) <= 0)
    );

    if (invalidDeliveryRate) {
      nextErrors.delivery =
        `Enter a delivery charge greater than 0 for ${invalidDeliveryRate.region}.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();

    if (!validateProduct() || savingProduct) return;

    try {
      setSavingProduct(true);
      setErrors({});

      const payload = new FormData();

      payload.append("name", productForm.name.trim());
      payload.append(
        "shortDescription",
        productForm.shortDescription.trim()
      );
      payload.append(
        "description",
        productForm.description.trim()
      );
      payload.append("brand", productForm.brand.trim());
      payload.append("category", productForm.category);
      payload.append("status", productForm.status);
      payload.append(
        "featured",
        productForm.featured ? "true" : "false"
      );

      newImages.forEach((file) => {
        payload.append("images", file);
      });

      const targetId = productId || id;

      const response = targetId
        ? await axios.patch(
            `${API_BASE_URL}/products/${targetId}`,
            payload,
            {
              headers: authHeaders,
            }
          )
        : await axios.post(
            `${API_BASE_URL}/products`,
            payload,
            {
              headers: authHeaders,
            }
          );

      const savedProduct = normalizeProduct(response.data);

      if (!savedProduct?._id && !targetId) {
        throw new Error(
          "Product was saved but no product ID was returned."
        );
      }

      const savedId = savedProduct?._id || targetId;

      setProductId(savedId);

      if (savedProduct?.images) {
        setExistingImages(savedProduct.images);
      }

      newImagePreviews.forEach((url) =>
        URL.revokeObjectURL(url)
      );
      setNewImages([]);
      setNewImagePreviews([]);

      try {
        await saveDeliveryRatesForProduct(savedId);
      } catch (deliveryError) {
        console.error("Save delivery rates error:", deliveryError);

        if (!targetId) {
          navigate(`/admin/products/edit/${savedId}`, {
            replace: true,
          });
        }

        setErrors({
          product:
            "The product was saved, but its delivery charges could not be saved. Please check the charges and click Save product again.",
        });

        showNotice(
          "error",
          deliveryError.response?.data?.message ||
            "Product saved, but delivery charges failed to save."
        );
        return;
      }

      showNotice(
        "success",
        targetId
          ? "Product and delivery charges updated."
          : "Product and delivery charges created. You can now add options and variants."
      );

      if (!targetId) {
        navigate(`/admin/products/edit/${savedId}`, {
          replace: true,
        });
        setActiveTab("options");
      } else {
        setProductForm((current) => ({
          ...current,
          name: savedProduct?.name ?? current.name,
          shortDescription:
            savedProduct?.shortDescription ??
            current.shortDescription,
          description:
            savedProduct?.description ?? current.description,
          brand: savedProduct?.brand ?? current.brand,
          status: savedProduct?.status ?? current.status,
          featured:
            savedProduct?.featured !== undefined
              ? Boolean(savedProduct.featured)
              : current.featured,
        }));
      }
    } catch (error) {
      console.error("Save product error:", error);

      setErrors({
        product:
          error.response?.data?.message ||
          error.message ||
          "Failed to save the product.",
      });
    } finally {
      setSavingProduct(false);
    }
  };

  const openNewOption = () => {
    if (!productId) return;

    setOptionModal({
      mode: "create",
      _id: "",
      name: "",
      values: [""],
    });
  };

  const openEditOption = (option) => {
    setOptionModal({
      mode: "edit",
      _id: option._id,
      name: option.name || "",
      values: (option.values || [])
        .filter((value) => value.isActive !== false)
        .map((value) => ({
          _id: value._id,
          value: value.value,
        })),
    });
  };

  const updateOptionValue = (index, value) => {
    setOptionModal((current) => ({
      ...current,
      values: current.values.map((item, itemIndex) =>
        itemIndex === index
          ? typeof item === "object"
            ? { ...item, value }
            : value
          : item
      ),
    }));
  };

  const addOptionValue = () => {
    setOptionModal((current) => ({
      ...current,
      values: [...current.values, ""],
    }));
  };

  const removeOptionValue = (index) => {
    setOptionModal((current) => ({
      ...current,
      values: current.values.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const saveOption = async () => {
    if (!optionModal || optionSaving) return;

    const name = optionModal.name.trim();

    const values = optionModal.values
      .map((item, index) => {
        const value =
          typeof item === "object"
            ? item.value?.trim()
            : item?.trim();

        if (!value) return null;

        return typeof item === "object"
          ? {
              _id: item._id,
              value,
              position: index,
              isActive: true,
            }
          : {
              value,
              position: index,
              isActive: true,
            };
      })
      .filter(Boolean);

    if (!name) {
      showNotice("error", "Option name is required.");
      return;
    }

    if (!values.length) {
      showNotice(
        "error",
        "Add at least one value to this option."
      );
      return;
    }

    try {
      setOptionSaving(true);

      if (optionModal.mode === "edit") {
        await axios.patch(
          `${API_BASE_URL}/products/${productId}/options/${optionModal._id}`,
          {
            name,
            values,
          },
          {
            headers: {
              ...authHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/products/${productId}/options`,
          {
            name,
            values,
          },
          {
            headers: {
              ...authHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      setOptionModal(null);
      await fetchCommerceData();

      showNotice(
        "success",
        optionModal.mode === "edit"
          ? "Product option updated."
          : "Product option created."
      );
    } catch (error) {
      console.error("Save option error:", error);

      showNotice(
        "error",
        error.response?.data?.message ||
          "Failed to save this option."
      );
    } finally {
      setOptionSaving(false);
    }
  };

  const openNewVariant = () => {
    if (!productId) return;

    const selections = {};

    options.forEach((option) => {
      const firstValue = (option.values || []).find(
        (value) => value.isActive !== false
      );

      if (firstValue) {
        selections[option._id] = firstValue._id;
      }
    });

    setVariantModal({
      mode: "create",
      _id: "",
      sku: "",
      title: "",
      price: "",
      compareAtPrice: "",
      stock: "0",
      isDefault: variants.length === 0,
      isActive: true,
      selections,
    });
  };

  const openEditVariant = (variant) => {
    const selections = {};

    (variant.selectedOptions || []).forEach((selected) => {
      selections[selected.optionId] = selected.valueId;
    });

    setVariantModal({
      mode: "edit",
      _id: variant._id,
      sku: variant.sku || "",
      title: variant.title || "",
      price: String(variant.price ?? ""),
      compareAtPrice:
        variant.compareAtPrice === null ||
        variant.compareAtPrice === undefined
          ? ""
          : String(variant.compareAtPrice),
      stock: String(variant.stock ?? 0),
      isDefault: Boolean(variant.isDefault),
      isActive: variant.isActive !== false,
      selections,
    });
  };

  const setVariantField = (name, value) => {
    setVariantModal((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const setVariantSelection = (optionId, valueId) => {
    setVariantModal((current) => ({
      ...current,
      selections: {
        ...current.selections,
        [optionId]: valueId,
      },
    }));
  };

  const saveVariant = async () => {
    if (!variantModal || variantSaving) return;

    const price = Number(variantModal.price);
    const stock = Number(variantModal.stock);

    if (!variantModal.sku.trim()) {
      showNotice("error", "SKU is required.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      showNotice("error", "Enter a valid variant price.");
      return;
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      showNotice(
        "error",
        "Stock must be a non-negative whole number."
      );
      return;
    }

    for (const option of options) {
      const activeValues = (option.values || []).filter(
        (value) => value.isActive !== false
      );

      if (
        activeValues.length &&
        !variantModal.selections[option._id]
      ) {
        showNotice(
          "error",
          `Choose a value for ${option.name}.`
        );
        return;
      }
    }

    const selectedOptions = options
      .map((option) => {
        const valueId =
          variantModal.selections[option._id];

        if (!valueId) return null;

        return {
          optionId: option._id,
          valueId,
        };
      })
      .filter(Boolean);

    const compareAtPrice =
      variantModal.compareAtPrice === ""
        ? null
        : Number(variantModal.compareAtPrice);

    if (
      compareAtPrice !== null &&
      (!Number.isFinite(compareAtPrice) ||
        compareAtPrice < 0)
    ) {
      showNotice(
        "error",
        "Compare-at price must be empty or a valid amount."
      );
      return;
    }

    const payload = {
      sku: variantModal.sku.trim(),
      title: variantModal.title.trim(),
      selectedOptions,
      price,
      compareAtPrice,
      stock,
      isDefault: Boolean(variantModal.isDefault),
      isActive: Boolean(variantModal.isActive),
      images: [],
    };

    try {
      setVariantSaving(true);

      if (variantModal.mode === "edit") {
        await axios.patch(
          `${API_BASE_URL}/products/${productId}/variants/${variantModal._id}`,
          payload,
          {
            headers: {
              ...authHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/products/${productId}/variants`,
          payload,
          {
            headers: {
              ...authHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      setVariantModal(null);
      await fetchCommerceData();

      showNotice(
        "success",
        variantModal.mode === "edit"
          ? "Variant updated."
          : "Variant created."
      );
    } catch (error) {
      console.error("Save variant error:", error);

      showNotice(
        "error",
        error.response?.data?.message ||
          "Failed to save this variant."
      );
    } finally {
      setVariantSaving(false);
    }
  };

  const archiveOption = async (optionId) => {
    try {
      setArchiveBusy(true);

      await axios.delete(
        `${API_BASE_URL}/products/${productId}/options/${optionId}`,
        {
          headers: authHeaders,
        }
      );

      await fetchCommerceData();
      setArchiveTarget(null);

      showNotice("success", "Product option archived.");
    } catch (error) {
      console.error("Archive option error:", error);

      showNotice(
        "error",
        error.response?.data?.message ||
          "Failed to archive this option."
      );
    } finally {
      setArchiveBusy(false);
    }
  };

  const archiveVariant = async (variantId) => {
    try {
      setArchiveBusy(true);

      await axios.delete(
        `${API_BASE_URL}/products/${productId}/variants/${variantId}`,
        {
          headers: authHeaders,
        }
      );

      await fetchCommerceData();
      setArchiveTarget(null);

      showNotice("success", "Variant archived.");
    } catch (error) {
      console.error("Archive variant error:", error);

      showNotice(
        "error",
        error.response?.data?.message ||
          "Failed to archive this variant."
      );
    } finally {
      setArchiveBusy(false);
    }
  };

  const activeOptions = useMemo(
    () =>
      options.filter((option) => option.isActive !== false),
    [options]
  );

  const productStats = useMemo(() => {
    const activeVariants = variants.filter(
      (variant) => variant.isActive !== false
    );

    return {
      options: activeOptions.length,
      variants: activeVariants.length,
      stock: activeVariants.reduce(
        (sum, variant) =>
          sum + Number(variant.stock || 0),
        0
      ),
    };
  }, [activeOptions.length, variants]);

  if (!adminInfo?.token) return null;

  if (loadingPage) {
    return (
      <main className="min-h-screen bg-[#f5f6f8]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-8 h-32 animate-pulse rounded-[28px] bg-white" />
          <div className="mt-6 h-[560px] animate-pulse rounded-[28px] bg-white" />
        </div>
      </main>
    );
  }

  if (errors.page) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center">
          <FaExclamationTriangle className="mx-auto text-3xl text-amber-500" />
          <h1 className="mt-5 text-xl font-semibold text-slate-950">
            Product unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {errors.page}
          </p>
          <Link
            to="/admin/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            <FaArrowLeft />
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const tabs = [
    {
      key: "details",
      label: "Product details",
      icon: FaBoxOpen,
    },
    {
      key: "options",
      label: "Options",
      icon: FaLayerGroup,
      count: productStats.options,
      disabled: !productId,
    },
    {
      key: "variants",
      label: "Variants",
      icon: FaStar,
      count: productStats.variants,
      disabled: !productId,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      {notice && (
        <div className="fixed right-4 top-24 z-[90] w-[calc(100%-2rem)] max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex gap-3 rounded-2xl border bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.15)] ${
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
            <p className="flex-1 text-sm font-medium leading-5">
              {notice.message}
            </p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-slate-300 hover:text-slate-700"
            >
              <FaTimes className="text-xs" />
            </button>
          </motion.div>
        </div>
      )}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <FaArrowLeft className="text-xs" />
            Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-600">
                Catalog workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                {productId ? "Edit product" : "Create product"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage storefront content first, then configure purchasable
                options and variants without leaving this workspace.
              </p>
            </div>

            {productId && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Options", productStats.options],
                  ["Variants", productStats.variants],
                  ["Stock", productStats.stock],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-[92px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center"
                  >
                    <p className="text-lg font-semibold text-slate-950">
                      {value}
                    </p>
                    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="sticky top-[72px] z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-max gap-1">
            {tabs.map(
              ({
                key,
                label,
                icon: Icon,
                count,
                disabled,
              }) => (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center gap-2 px-4 py-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
                    activeTab === key
                      ? "text-slate-950"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Icon className="text-xs" />
                  {label}
                  {count !== undefined && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      {count}
                    </span>
                  )}
                  {activeTab === key && (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-slate-950" />
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {activeTab === "details" && (
          <form onSubmit={handleProductSubmit}>
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <SectionCard
                  title="Product information"
                  description="Customer-facing name, description and merchandising information."
                  icon={FaBoxOpen}
                >
                  {errors.product && (
                    <div className="mb-5 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-5 text-red-700">
                      <FaExclamationTriangle className="mt-0.5 shrink-0" />
                      {errors.product}
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Product name
                      </label>
                      <input
                        name="name"
                        value={productForm.name}
                        onChange={handleProductChange}
                        placeholder="e.g. Air Runner Pro"
                        className={fieldClass(Boolean(errors.name))}
                      />
                      {errors.name && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Brand
                      </label>
                      <input
                        name="brand"
                        value={productForm.brand}
                        onChange={handleProductChange}
                        placeholder="e.g. Nike"
                        className={fieldClass()}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Category
                      </label>
                      <select
                        name="category"
                        value={productForm.category}
                        onChange={handleProductChange}
                        className={fieldClass(Boolean(errors.category))}
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option
                            key={category._id}
                            value={category._id}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          {errors.category}
                        </p>
                      )}
                      {!categories.length && (
                        <p className="mt-2 text-[11px] leading-5 text-amber-600">
                          No existing categories were returned by the catalog.
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Short description
                      </label>
                      <input
                        name="shortDescription"
                        value={productForm.shortDescription}
                        onChange={handleProductChange}
                        placeholder="A concise one-line summary for cards and merchandising."
                        maxLength={220}
                        className={fieldClass()}
                      />
                      <p className="mt-2 text-right text-[10px] text-slate-400">
                        {productForm.shortDescription.length}/220
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Full description
                      </label>
                      <textarea
                        name="description"
                        value={productForm.description}
                        onChange={handleProductChange}
                        rows={8}
                        placeholder="Describe the product, its use, quality and important details."
                        className={`${fieldClass(
                          Boolean(errors.description)
                        )} resize-none`}
                      />
                      {errors.description && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          {errors.description}
                        </p>
                      )}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Product media"
                  description="Upload clean, high-resolution images. The storefront automatically uses the first image as the primary visual."
                  icon={FaImage}
                >
                  {(existingImages.length > 0 ||
                    newImagePreviews.length > 0) && (
                    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {existingImages.map((image, index) => (
                        <div
                          key={`existing-${image?._id || image?.url || image}-${index}`}
                          className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={
                              typeof image === "object"
                                ? image.alt || productForm.name
                                : productForm.name
                            }
                            className="h-full w-full object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute left-2 top-2 rounded-full bg-slate-950 px-2 py-1 text-[9px] font-semibold text-white">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}

                      {newImagePreviews.map((preview, index) => (
                        <div
                          key={preview}
                          className="group relative aspect-square overflow-hidden rounded-2xl border border-violet-200 bg-slate-100"
                        >
                          <img
                            src={preview}
                            alt={`New upload ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-2 py-1 text-[9px] font-semibold text-white">
                            New
                          </span>
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-red-500 opacity-100 shadow-sm transition hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100"
                            aria-label="Remove image"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-9 text-center transition hover:border-violet-300 hover:bg-violet-50/40">
                    <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white p-4 text-violet-600 shadow-sm">
                      <FaCloudUploadAlt className="text-xl" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-800">
                      Upload product images
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      JPG, PNG or WebP · maximum 5MB each
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesSelected}
                      className="hidden"
                    />
                  </label>
                </SectionCard>

                <SectionCard
                  title="Delivery charges"
                  description="Set the delivery fee for this product in each supported region. These charges are saved separately and linked to this product."
                  icon={FaTruck}
                  action={
                    deliveryConfigured ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                        Saved
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                        Required
                      </span>
                    )
                  }
                >
                  {errors.delivery && (
                    <div className="mb-5 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-5 text-red-700">
                      <FaExclamationTriangle className="mt-0.5 shrink-0" />
                      {errors.delivery}
                    </div>
                  )}

                  <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                    <div className="flex gap-3">
                      <FaTruck className="mt-0.5 shrink-0 text-violet-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Product-specific delivery pricing
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Enter the amount customers should pay to receive this
                          product in each region. Save product will save both the
                          product and these delivery charges.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {deliveryRates.map((rate, index) => (
                      <div
                        key={rate.region}
                        className={`rounded-[24px] border p-5 transition ${
                          rate.isAvailable
                            ? "border-slate-200 bg-white"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {rate.region}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {rate.isAvailable
                                ? "Delivery available"
                                : "Delivery unavailable"}
                            </p>
                          </div>

                          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-500">
                            <input
                              type="checkbox"
                              checked={rate.isAvailable}
                              onChange={(event) =>
                                updateDeliveryRate(
                                  index,
                                  "isAvailable",
                                  event.target.checked
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-violet-600"
                            />
                            Available
                          </label>
                        </div>

                        <div className="mt-5">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                            Delivery charge
                          </label>

                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                              PKR
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              disabled={!rate.isAvailable}
                              value={rate.charge}
                              onChange={(event) =>
                                updateDeliveryRate(
                                  index,
                                  "charge",
                                  event.target.value
                                )
                              }
                              placeholder="e.g. 250"
                              className={`${fieldClass(
                                Boolean(errors.delivery && rate.isAvailable)
                              )} pl-14 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 text-xs leading-5 text-slate-400">
                    These values are not stored inside the Product document. The
                    backend saves them in ProductDeliveryRate using the product ID.
                  </p>
                </SectionCard>
              </div>

              <aside className="space-y-6 lg:sticky lg:top-36">
                <SectionCard
                  title="Publishing"
                  description="Control how this product appears on the storefront."
                  icon={FaCheckCircle}
                >
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Status
                      </label>
                      <select
                        name="status"
                        value={productForm.status}
                        onChange={handleProductChange}
                        className={fieldClass()}
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={productForm.featured}
                        onChange={handleProductChange}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Featured product
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Prioritize this product in storefront merchandising.
                        </p>
                      </div>
                    </label>
                  </div>
                </SectionCard>

                <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                    Product workflow
                  </p>

                  <div className="mt-5 space-y-4">
                    {[
                      {
                        label: "1. Product details",
                        done: Boolean(productId),
                      },
                      {
                        label: "2. Delivery charges",
                        done: deliveryConfigured,
                      },
                      {
                        label: "3. Options",
                        done: productStats.options > 0,
                      },
                      {
                        label: "4. Variants & inventory",
                        done: productStats.variants > 0,
                      },
                    ].map((step) => (
                      <div
                        key={step.label}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            step.done
                              ? "bg-emerald-400 text-slate-950"
                              : "bg-white/10 text-white/35"
                          }`}
                        >
                          {step.done && (
                            <FaCheck className="text-[9px]" />
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            step.done
                              ? "text-white"
                              : "text-white/45"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-wait disabled:translate-y-0 disabled:opacity-60"
                  >
                    {savingProduct ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        {productId
                          ? "Save product"
                          : "Create product"}
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-[10px] leading-4 text-white/35">
                    Product details and delivery charges are saved together. Price and stock are configured on variants.
                  </p>
                </div>
              </aside>
            </div>
          </form>
        )}

        {activeTab === "options" && (
          <SectionCard
            title="Product options"
            description="Define choices customers can make, such as Color or Size. Option value IDs are preserved when editing."
            icon={FaLayerGroup}
            action={
              <button
                type="button"
                onClick={openNewOption}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <FaPlus />
                Add option
              </button>
            }
          >
            {loadingCommerce ? (
              <div className="py-16 text-center">
                <FaSpinner className="mx-auto animate-spin text-2xl text-violet-600" />
                <p className="mt-3 text-sm text-slate-400">
                  Loading options...
                </p>
              </div>
            ) : activeOptions.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <FaLayerGroup className="text-xl" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">
                  No options yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Add Color, Size, Material, Storage, or any other choice this
                  product needs.
                </p>
                <button
                  type="button"
                  onClick={openNewOption}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  <FaPlus />
                  Create first option
                </button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {activeOptions.map((option) => {
                  const values = (option.values || []).filter(
                    (value) => value.isActive !== false
                  );

                  return (
                    <div
                      key={option._id}
                      className="rounded-[24px] border border-slate-200 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-slate-950">
                            {option.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {values.length} active{" "}
                            {values.length === 1 ? "value" : "values"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditOption(option)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                            title="Edit option"
                          >
                            <FaEdit className="text-xs" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setArchiveTarget({
                                type: "option",
                                id: option._id,
                                name: option.name,
                              })
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50"
                            title="Archive option"
                          >
                            <FaArchive className="text-xs" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {values.map((value) => (
                          <span
                            key={value._id}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                          >
                            {value.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {activeTab === "variants" && (
          <SectionCard
            title="Variants & inventory"
            description="Every purchasable combination has its own SKU, price and stock."
            icon={FaStar}
            action={
              <button
                type="button"
                onClick={openNewVariant}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <FaPlus />
                Add variant
              </button>
            }
          >
            {loadingCommerce ? (
              <div className="py-16 text-center">
                <FaSpinner className="mx-auto animate-spin text-2xl text-violet-600" />
              </div>
            ) : variants.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FaStar className="text-xl" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">
                  No variants yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create at least one variant to give this product a price,
                  inventory level, and purchasable SKU.
                </p>
                <button
                  type="button"
                  onClick={openNewVariant}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  <FaPlus />
                  Create first variant
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden overflow-x-auto lg:block">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Variant
                        </th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Options
                        </th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Price
                        </th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Stock
                        </th>
                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {variants.map((variant) => (
                        <tr
                          key={variant._id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-950">
                                  {variant.title ||
                                    variant.sku ||
                                    "Variant"}
                                </p>
                                <p className="mt-1 font-mono text-[10px] text-slate-400">
                                  {variant.sku}
                                </p>
                              </div>
                              {variant.isDefault && (
                                <span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-semibold text-violet-700">
                                  Default
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {(variant.selectedOptions || []).length ? (
                                variant.selectedOptions.map(
                                  (selected) => (
                                    <span
                                      key={`${selected.optionId}-${selected.valueId}`}
                                      className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-600"
                                    >
                                      {selected.optionName}:{" "}
                                      <strong>
                                        {selected.value}
                                      </strong>
                                    </span>
                                  )
                                )
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Default configuration
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-slate-950">
                              {formatPrice(variant.price)}
                            </p>
                            {variant.compareAtPrice >
                              variant.price && (
                              <p className="mt-1 text-[10px] text-slate-400 line-through">
                                {formatPrice(
                                  variant.compareAtPrice
                                )}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`text-sm font-semibold ${
                                Number(variant.stock) > 0
                                  ? "text-slate-900"
                                  : "text-red-500"
                              }`}
                            >
                              {variant.stock}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditVariant(variant)
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                              >
                                <FaEdit className="text-xs" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setArchiveTarget({
                                    type: "variant",
                                    id: variant._id,
                                    name:
                                      variant.title ||
                                      variant.sku,
                                    isDefault:
                                      variant.isDefault,
                                  })
                                }
                                disabled={variant.isDefault}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                                title={
                                  variant.isDefault
                                    ? "Assign another default variant first"
                                    : "Archive variant"
                                }
                              >
                                <FaArchive className="text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 lg:hidden">
                  {variants.map((variant) => (
                    <div key={variant._id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">
                              {variant.title ||
                                variant.sku ||
                                "Variant"}
                            </p>
                            {variant.isDefault && (
                              <span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-semibold text-violet-700">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="mt-1 font-mono text-[10px] text-slate-400">
                            {variant.sku}
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-slate-950">
                          {formatPrice(variant.price)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(variant.selectedOptions || []).map(
                          (selected) => (
                            <span
                              key={`${selected.optionId}-${selected.valueId}`}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-600"
                            >
                              {selected.optionName}:{" "}
                              {selected.value}
                            </span>
                          )
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-xs text-slate-500">
                          Stock{" "}
                          <strong className="text-slate-900">
                            {variant.stock}
                          </strong>
                        </span>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditVariant(variant)
                            }
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setArchiveTarget({
                                type: "variant",
                                id: variant._id,
                                name:
                                  variant.title ||
                                  variant.sku,
                                isDefault:
                                  variant.isDefault,
                              })
                            }
                            disabled={variant.isDefault}
                            className="rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-30"
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {optionModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-xl rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.24)]"
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-600">
                  Product option
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  {optionModal.mode === "edit"
                    ? "Edit option"
                    : "Add option"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOptionModal(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:text-slate-950"
              >
                <FaTimes />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Option name
              </label>
              <input
                value={optionModal.name}
                onChange={(event) =>
                  setOptionModal((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Color or Size"
                className={fieldClass()}
              />

              <div className="mt-6 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Values
                </label>
                <button
                  type="button"
                  onClick={addOptionValue}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600"
                >
                  <FaPlus className="text-[9px]" />
                  Add value
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {optionModal.values.map((item, index) => {
                  const value =
                    typeof item === "object"
                      ? item.value
                      : item;

                  return (
                    <div
                      key={
                        typeof item === "object"
                          ? item._id || index
                          : index
                      }
                      className="flex gap-2"
                    >
                      <input
                        value={value}
                        onChange={(event) =>
                          updateOptionValue(
                            index,
                            event.target.value
                          )
                        }
                        placeholder={`Value ${index + 1}`}
                        className={fieldClass()}
                      />
                      <button
                        type="button"
                        disabled={
                          optionModal.values.length === 1
                        }
                        onClick={() =>
                          removeOptionValue(index)
                        }
                        className="flex w-12 shrink-0 items-center justify-center rounded-2xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:opacity-30"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 p-5">
              <button
                type="button"
                onClick={() => setOptionModal(null)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveOption}
                disabled={optionSaving}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {optionSaving ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaSave />
                )}
                Save option
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {variantModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-2xl rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.24)]"
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Purchasable variant
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  {variantModal.mode === "edit"
                    ? "Edit variant"
                    : "Add variant"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setVariantModal(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:text-slate-950"
              >
                <FaTimes />
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    SKU
                  </label>
                  <input
                    value={variantModal.sku}
                    onChange={(event) =>
                      setVariantField(
                        "sku",
                        event.target.value.toUpperCase()
                      )
                    }
                    placeholder="SHOE-BLK-42"
                    className={fieldClass()}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Variant title
                  </label>
                  <input
                    value={variantModal.title}
                    onChange={(event) =>
                      setVariantField(
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="Black / 42"
                    className={fieldClass()}
                  />
                </div>

                {activeOptions.map((option) => {
                  const values = (option.values || []).filter(
                    (value) => value.isActive !== false
                  );

                  return (
                    <div key={option._id}>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        {option.name}
                      </label>
                      <select
                        value={
                          variantModal.selections[
                            option._id
                          ] || ""
                        }
                        onChange={(event) =>
                          setVariantSelection(
                            option._id,
                            event.target.value
                          )
                        }
                        className={fieldClass()}
                      >
                        <option value="">
                          Select {option.name}
                        </option>
                        {values.map((value) => (
                          <option
                            key={value._id}
                            value={value._id}
                          >
                            {value.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Price (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={variantModal.price}
                    onChange={(event) =>
                      setVariantField(
                        "price",
                        event.target.value
                      )
                    }
                    placeholder="5000"
                    className={fieldClass()}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Compare-at price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={variantModal.compareAtPrice}
                    onChange={(event) =>
                      setVariantField(
                        "compareAtPrice",
                        event.target.value
                      )
                    }
                    placeholder="Optional"
                    className={fieldClass()}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={variantModal.stock}
                    onChange={(event) =>
                      setVariantField(
                        "stock",
                        event.target.value
                      )
                    }
                    className={fieldClass()}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={variantModal.isDefault}
                    onChange={(event) =>
                      setVariantField(
                        "isDefault",
                        event.target.checked
                      )
                    }
                    className="mt-0.5 h-4 w-4"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Default variant
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Use this combination as the default storefront selection.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={variantModal.isActive}
                    onChange={(event) =>
                      setVariantField(
                        "isActive",
                        event.target.checked
                      )
                    }
                    className="mt-0.5 h-4 w-4"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Active
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Allow customers to select this variant.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 p-5">
              <button
                type="button"
                onClick={() => setVariantModal(null)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveVariant}
                disabled={variantSaving}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {variantSaving ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaSave />
                )}
                Save variant
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {archiveTarget && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.22)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <FaArchive />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              Archive {archiveTarget.type}?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              <strong className="text-slate-700">
                {archiveTarget.name}
              </strong>{" "}
              will no longer be available to customers.
            </p>

            {archiveTarget.isDefault && (
              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs leading-5 text-amber-700">
                The backend protects the default variant. Assign another default
                variant before archiving this one.
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                disabled={archiveBusy}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  archiveBusy || archiveTarget.isDefault
                }
                onClick={() =>
                  archiveTarget.type === "option"
                    ? archiveOption(archiveTarget.id)
                    : archiveVariant(archiveTarget.id)
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {archiveBusy ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaArchive />
                )}
                Archive
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
};

export default AdminProductForm;