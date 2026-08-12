import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaBoxOpen,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaLock,
  FaMinus,
  FaPlus,
  FaShieldAlt,
  FaShoppingBag,
  FaTag,
  FaTruck,
} from 'react-icons/fa';
import EmailModal from '../components/EmailModal';

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || '').replace(/\/+$/, '');
const ASSET_BASE_URL = (
  import.meta.env.VITE_ASSET_URL || API_BASE_URL.replace(/\/api\/?$/, '')
).replace(/\/+$/, '');

const fallbackImage =
  'https://placehold.co/900x900/f8fafc/94a3b8?text=ShopEase';

const formatPrice = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getImagePath = (image) => {
  if (!image) return '';
  return typeof image === 'string' ? image : image.url || '';
};

const getImageAlt = (image, fallback) => {
  if (!image || typeof image === 'string') return fallback;
  return image.alt || fallback;
};

const getImageUrl = (image) => {
  const imagePath = getImagePath(image);

  if (!imagePath) return fallbackImage;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const cleanPath = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${ASSET_BASE_URL}/${cleanPath}`;
};

const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-[#f7f8fb] py-8 sm:py-12">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-7 h-5 w-36 animate-pulse rounded-full bg-slate-200" />
      <div className="grid gap-10 rounded-[32px] border border-slate-200/70 bg-white p-5 shadow-[0_24px_80px_-35px_rgba(15,23,42,0.22)] md:p-8 lg:grid-cols-[1.08fr_0.92fr] lg:p-10">
        <div className="aspect-square animate-pulse rounded-[28px] bg-slate-100" />
        <div className="space-y-6 py-2">
          <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100" />
          <div className="h-12 w-4/5 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-5 w-full animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 w-44 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [options, setOptions] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedValues, setSelectedValues] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectionError, setSelectionError] = useState('');

  useEffect(() => {
    let ignore = false;

    const fetchProductExperience = async () => {
      setLoading(true);
      setError('');

      try {
        const [productResponse, optionsResponse, variantsResponse] =
          await Promise.all([
            axios.get(`${API_BASE_URL}/products/${id}`),
            axios.get(`${API_BASE_URL}/products/${id}/options`),
            axios.get(`${API_BASE_URL}/products/${id}/variants`),
          ]);

        if (ignore) return;

        setProduct(productResponse.data);
        setOptions(optionsResponse.data?.options || []);
        setVariants(variantsResponse.data?.variants || []);
      } catch (requestError) {
        if (ignore) return;

        console.error('Product detail error:', requestError);
        setError(
          requestError.response?.data?.message ||
            'We could not load this product right now.'
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchProductExperience();

    return () => {
      ignore = true;
    };
  }, [id]);

  const activeOptions = useMemo(
    () =>
      options
        .filter((option) => option.isActive !== false)
        .map((option) => ({
          ...option,
          values: (option.values || []).filter(
            (value) => value.isActive !== false
          ),
        }))
        .filter((option) => option.values.length > 0),
    [options]
  );

  const activeVariants = useMemo(
    () => variants.filter((variant) => variant.isActive !== false),
    [variants]
  );

  useEffect(() => {
    if (!activeVariants.length) return;

    if (activeOptions.length === 0) {
      setSelectedValues({});
      return;
    }

    const preferredVariant =
      activeVariants.find(
        (variant) =>
          variant.isDefault &&
          Number(variant.stock) > 0 &&
          (variant.selectedOptions || []).length > 0
      ) ||
      activeVariants.find(
        (variant) =>
          Number(variant.stock) > 0 &&
          activeOptions.every((option) =>
            (variant.selectedOptions || []).some(
              (selected) => selected.optionId === option._id
            )
          )
      ) ||
      activeVariants.find((variant) =>
        activeOptions.every((option) =>
          (variant.selectedOptions || []).some(
            (selected) => selected.optionId === option._id
          )
        )
      );

    if (!preferredVariant) return;

    const initialSelection = {};

    preferredVariant.selectedOptions?.forEach((selected) => {
      const optionStillActive = activeOptions.some(
        (option) => option._id === selected.optionId
      );

      if (optionStillActive) {
        initialSelection[selected.optionId] = selected.valueId;
      }
    });

    setSelectedValues(initialSelection);
  }, [activeOptions, activeVariants]);

  const selectedVariant = useMemo(() => {
    if (!activeVariants.length) return null;

    if (activeOptions.length === 0) {
      return (
        activeVariants.find((variant) => variant.isDefault) ||
        activeVariants[0] ||
        null
      );
    }

    const allOptionsSelected = activeOptions.every(
      (option) => selectedValues[option._id]
    );

    if (!allOptionsSelected) return null;

    return (
      activeVariants.find((variant) =>
        activeOptions.every((option) =>
          (variant.selectedOptions || []).some(
            (selected) =>
              selected.optionId === option._id &&
              selected.valueId === selectedValues[option._id]
          )
        )
      ) || null
    );
  }, [activeOptions, activeVariants, selectedValues]);

  const galleryImages = useMemo(() => {
    if (selectedVariant?.images?.length) return selectedVariant.images;
    if (product?.images?.length) return product.images;
    return [];
  }, [product, selectedVariant]);

  useEffect(() => {
    setCurrentImageIndex(0);

    if (!selectedVariant) {
      setQuantity(1);
      return;
    }

    const availableStock = Number(selectedVariant.stock || 0);
    setQuantity((currentQuantity) =>
      availableStock > 0
        ? Math.min(Math.max(currentQuantity, 1), availableStock)
        : 1
    );
  }, [selectedVariant?._id]);

  const isValueAvailable = (optionId, valueId) => {
    return activeVariants.some((variant) => {
      if (Number(variant.stock || 0) <= 0) return false;

      const variantSelections = variant.selectedOptions || [];
      const hasCandidate = variantSelections.some(
        (selected) =>
          selected.optionId === optionId && selected.valueId === valueId
      );

      if (!hasCandidate) return false;

      return Object.entries(selectedValues).every(
        ([selectedOptionId, selectedValueId]) => {
          if (!selectedValueId || selectedOptionId === optionId) return true;

          return variantSelections.some(
            (selected) =>
              selected.optionId === selectedOptionId &&
              selected.valueId === selectedValueId
          );
        }
      );
    });
  };

  const handleOptionSelect = (optionId, valueId) => {
    setSelectionError('');
    setSelectedValues((current) => ({
      ...current,
      [optionId]: valueId,
    }));
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    if (!selectedVariant) return;

    setQuantity((current) =>
      Math.min(Number(selectedVariant.stock || 0), current + 1)
    );
  };

  const handleBuyNow = () => {
    if (activeOptions.length > 0 && !selectedVariant) {
      setSelectionError('Please select an available option combination.');
      return;
    }

    if (!selectedVariant) {
      setSelectionError('This product does not have an available variant yet.');
      return;
    }

    if (Number(selectedVariant.stock || 0) <= 0) {
      setSelectionError('This variant is currently out of stock.');
      return;
    }

    navigate(
      `/product/order/${product._id}?variantId=${selectedVariant._id}&quantity=${quantity}`,
      {
        state: {
          variantId: selectedVariant._id,
          quantity,
        },
      }
    );
  };

  const nextImage = () => {
    if (galleryImages.length <= 1) return;
    setCurrentImageIndex((current) => (current + 1) % galleryImages.length);
  };

  const previousImage = () => {
    if (galleryImages.length <= 1) return;
    setCurrentImageIndex(
      (current) => (current - 1 + galleryImages.length) % galleryImages.length
    );
  };

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="min-h-[75vh] bg-[#f7f8fb] px-4 py-20">
        <div className="mx-auto max-w-lg rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-[0_24px_80px_-35px_rgba(15,23,42,0.22)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <FaBoxOpen className="text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-950">Product unavailable</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error || 'We could not find the product you were looking for.'}
          </p>
          <Link
            to="/products"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <FaArrowLeft />
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const categoryName =
    typeof product.category === 'object'
      ? product.category?.name
      : product.category;

  const currentImage = galleryImages[currentImageIndex] || null;
  const stock = Number(selectedVariant?.stock || 0);
  const hasDiscount =
    selectedVariant?.compareAtPrice &&
    Number(selectedVariant.compareAtPrice) > Number(selectedVariant.price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(selectedVariant.compareAtPrice) - Number(selectedVariant.price)) /
          Number(selectedVariant.compareAtPrice)) *
          100
      )
    : 0;

  return (
    <>
      <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <nav className="mb-7 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="transition hover:text-slate-950">
              Home
            </Link>
            <span>/</span>
            <Link to="/products" className="transition hover:text-slate-950">
              Shop
            </Link>
            {categoryName && (
              <>
                <span>/</span>
                <span className="text-slate-700">{categoryName}</span>
              </>
            )}
          </nav>

          <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_30px_90px_-42px_rgba(15,23,42,0.28)] sm:rounded-[36px]">
            <div className="grid lg:grid-cols-[1.07fr_0.93fr]">
              <div className="border-b border-slate-200/80 p-4 sm:p-7 lg:border-b-0 lg:border-r lg:p-9">
                <motion.div
                  layout
                  className="group relative aspect-square overflow-hidden rounded-[24px] bg-[#f2f4f7] sm:rounded-[30px]"
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${selectedVariant?._id || 'product'}-${currentImageIndex}`}
                      src={getImageUrl(currentImage)}
                      alt={getImageAlt(currentImage, product.name)}
                      className="h-full w-full object-cover"
                      initial={{ opacity: 0, scale: 1.025 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      onError={(event) => {
                        event.currentTarget.src = fallbackImage;
                      }}
                    />
                  </AnimatePresence>

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {product.featured && (
                      <span className="rounded-full bg-slate-950/90 px-3 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur">
                        Featured
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-rose-600 shadow-sm backdrop-blur">
                        Save {discountPercent}%
                      </span>
                    )}
                  </div>

                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={previousImage}
                        aria-label="Previous product image"
                        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white"
                      >
                        <FaChevronLeft />
                      </button>
                      <button
                        type="button"
                        onClick={nextImage}
                        aria-label="Next product image"
                        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white"
                      >
                        <FaChevronRight />
                      </button>
                    </>
                  )}
                </motion.div>

                {galleryImages.length > 1 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                    {galleryImages.map((image, index) => (
                      <button
                        type="button"
                        key={`${getImagePath(image)}-${index}`}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-slate-100 transition sm:h-24 sm:w-24 ${
                          currentImageIndex === index
                            ? 'border-slate-950 ring-2 ring-slate-950/10'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                        aria-label={`View product image ${index + 1}`}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={getImageAlt(image, `${product.name} ${index + 1}`)}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 sm:p-8 lg:p-10 xl:p-12">
                <div className="lg:sticky lg:top-24">
                  <div className="flex flex-wrap items-center gap-2">
                    {categoryName && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                        <FaTag className="text-[10px]" />
                        {categoryName}
                      </span>
                    )}
                    {product.brand && (
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {product.brand}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-4xl xl:text-[46px]">
                    {product.name}
                  </h1>

                  {(product.shortDescription || product.description) && (
                    <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-500 sm:text-base">
                      {product.shortDescription || product.description}
                    </p>
                  )}

                  <div className="mt-7 flex flex-wrap items-end gap-x-3 gap-y-2 border-b border-slate-200 pb-7">
                    {selectedVariant ? (
                      <>
                        <span className="text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
                          {formatPrice(selectedVariant.price)}
                        </span>
                        {hasDiscount && (
                          <span className="pb-1 text-base font-medium text-slate-400 line-through">
                            {formatPrice(selectedVariant.compareAtPrice)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-lg font-semibold text-slate-500">
                        Select options to see price
                      </span>
                    )}
                  </div>

                  {activeOptions.length > 0 && (
                    <div className="space-y-7 py-7">
                      {activeOptions.map((option) => (
                        <div key={option._id}>
                          <div className="mb-3 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-slate-950">
                                {option.name}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                Choose your preferred {option.name.toLowerCase()}
                              </p>
                            </div>

                            {selectedValues[option._id] && (
                              <span className="text-xs font-semibold text-slate-500">
                                {
                                  option.values.find(
                                    (value) =>
                                      value._id === selectedValues[option._id]
                                  )?.value
                                }
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2.5">
                            {option.values.map((value) => {
                              const isSelected =
                                selectedValues[option._id] === value._id;
                              const available = isValueAvailable(
                                option._id,
                                value._id
                              );

                              return (
                                <button
                                  type="button"
                                  key={value._id}
                                  onClick={() =>
                                    handleOptionSelect(option._id, value._id)
                                  }
                                  disabled={!available && !isSelected}
                                  className={`relative min-w-16 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                                    isSelected
                                      ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/10'
                                      : available
                                        ? 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm'
                                        : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
                                  }`}
                                >
                                  {value.value}
                                  {isSelected && (
                                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[9px] text-white">
                                      <FaCheck />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-200 py-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              selectedVariant && stock > 0
                                ? stock <= 5
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          {!selectedVariant
                            ? 'Choose an available variant'
                            : stock <= 0
                              ? 'Out of stock'
                              : stock <= 5
                                ? `Only ${stock} left in stock`
                                : 'In stock and ready to order'}
                        </div>
                        {selectedVariant?.sku && (
                          <p className="mt-1 text-xs font-medium tracking-wide text-slate-400">
                            SKU {selectedVariant.sku}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={decreaseQuantity}
                          disabled={quantity <= 1}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Decrease quantity"
                        >
                          <FaMinus className="text-xs" />
                        </button>
                        <span className="w-11 text-center text-sm font-bold text-slate-950">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={increaseQuantity}
                          disabled={!selectedVariant || stock <= 0 || quantity >= stock}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectionError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                    >
                      {selectionError}
                    </motion.div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-[1.25fr_0.75fr]">
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={!selectedVariant || stock <= 0}
                      className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-[0_20px_44px_-16px_rgba(109,40,217,0.48)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      <FaShoppingBag className="transition group-hover:scale-110" />
                      Buy now
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowEmailModal(true)}
                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                    >
                      <FaEnvelope />
                      Email info
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <FaTruck className="text-violet-600" />
                      <p className="mt-3 text-sm font-bold text-slate-900">
                        Delivery ready
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Stock is checked before your order is placed.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <FaShieldAlt className="text-violet-600" />
                      <p className="mt-3 text-sm font-bold text-slate-900">
                        Secure ordering
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Your selected variant is validated by the server.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <FaLock className="text-violet-600" />
                      <p className="mt-3 text-sm font-bold text-slate-900">
                        Cash on delivery
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Complete your order with COD at checkout.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-7 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                Product details
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950">
                About this item
              </h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-[15px]">
                {product.description ||
                  'More product details will be available soon.'}
              </p>
            </div>

            <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.75)] sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
                ShopEase promise
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.025em]">
                Pick the exact variant you want.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Price and availability update with your selection so you know
                exactly what you are ordering before checkout.
              </p>
            </div>
          </section>
        </div>
      </main>

      {showEmailModal && (
        <EmailModal
          product={product}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  );
};

export default ProductDetail;