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
  FaHeart,
  FaLock,
  FaMinus,
  FaPlus,
  FaShieldAlt,
  FaShoppingBag,
  FaStar,
  FaTag,
  FaTruck,
} from 'react-icons/fa';
import EmailModal from '../components/EmailModal';
import ProductCard from '../components/ProductCard';
import ProductReviews from '../components/ProductReviews';
import { useStore } from '../context/storeContext';

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
  <div className="min-h-screen bg-[#f5f6f8] py-5 sm:py-8 lg:py-10">
    <div className="mx-auto max-w-[1240px] px-3 sm:px-6 lg:px-8">
      <div className="mb-5 h-4 w-36 animate-pulse rounded-full bg-slate-200" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.06fr)_minmax(420px,0.94fr)]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-3 sm:p-5">
          <div className="aspect-square animate-pulse rounded-[22px] bg-slate-100" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 w-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 sm:p-7">
          <div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-5 h-10 w-4/5 animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-6 h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-5 h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-5 h-12 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isWishlisted, toggleWishlist } = useStore();

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
  const [cartMessage, setCartMessage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

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

  useEffect(() => {
    const categorySlug =
      typeof product?.category === 'object'
        ? product.category?.slug || ''
        : '';

    if (!product?._id || !categorySlug) {
      setRelatedProducts([]);
      setRelatedLoading(false);
      return undefined;
    }

    let ignore = false;

    const fetchRelatedProducts = async () => {
      try {
        setRelatedLoading(true);

        const response = await axios.get(`${API_BASE_URL}/products`, {
          params: {
            category: categorySlug,
            limit: 5,
            sort: 'featured',
          },
        });

        const productList = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.products)
            ? response.data.products
            : [];

        if (!ignore) {
          setRelatedProducts(
            productList
              .filter((item) => item?._id && item._id !== product._id)
              .slice(0, 4)
          );
        }
      } catch (requestError) {
        console.warn('Related products loading error:', requestError);

        if (!ignore) {
          setRelatedProducts([]);
        }
      } finally {
        if (!ignore) {
          setRelatedLoading(false);
        }
      }
    };

    fetchRelatedProducts();

    return () => {
      ignore = true;
    };
  }, [product?._id, product?.category?.slug]);

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
    if (!activeVariants.length) {
      setSelectedValues({});
      return;
    }

    if (activeOptions.length === 0) {
      setSelectedValues({});
      return;
    }

    const hasEveryActiveOption = (variant) =>
      activeOptions.every((option) =>
        (variant.selectedOptions || []).some(
          (selected) => selected.optionId === option._id
        )
      );

    const completeVariants = activeVariants.filter(hasEveryActiveOption);

    const preferredVariant =
      completeVariants.find(
        (variant) => variant.isDefault && Number(variant.stock || 0) > 0
      ) ||
      completeVariants.find((variant) => Number(variant.stock || 0) > 0) ||
      completeVariants.find((variant) => variant.isDefault) ||
      completeVariants[0] ||
      null;

    if (!preferredVariant) {
      setSelectedValues({});
      return;
    }

    const initialSelection = {};

    activeOptions.forEach((option) => {
      const selected = preferredVariant.selectedOptions?.find(
        (item) => item.optionId === option._id
      );

      if (selected?.valueId) {
        initialSelection[option._id] = selected.valueId;
      }
    });

    setSelectedValues(initialSelection);
  }, [activeOptions, activeVariants]);

  const selectedVariant = useMemo(() => {
    if (!activeVariants.length) return null;

    if (activeOptions.length === 0) {
      return (
        activeVariants.find(
          (variant) => variant.isDefault && Number(variant.stock || 0) > 0
        ) ||
        activeVariants.find((variant) => Number(variant.stock || 0) > 0) ||
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

      return (variant.selectedOptions || []).some(
        (selected) =>
          selected.optionId === optionId && selected.valueId === valueId
      );
    });
  };

  const handleOptionSelect = (optionId, valueId) => {
    setSelectionError('');

    const candidateVariants = activeVariants.filter(
      (variant) =>
        Number(variant.stock || 0) > 0 &&
        (variant.selectedOptions || []).some(
          (selected) =>
            selected.optionId === optionId && selected.valueId === valueId
        )
    );

    if (!candidateVariants.length) {
      setSelectionError('That option is currently unavailable.');
      return;
    }

    setSelectedValues((current) => {
      const requestedSelection = {
        ...current,
        [optionId]: valueId,
      };

      const compatibleVariant =
        candidateVariants.find((variant) =>
          activeOptions.every((option) => {
            const requestedValue = requestedSelection[option._id];

            if (!requestedValue) return true;

            return (variant.selectedOptions || []).some(
              (selected) =>
                selected.optionId === option._id &&
                selected.valueId === requestedValue
            );
          })
        ) ||
        candidateVariants.find((variant) => variant.isDefault) ||
        candidateVariants[0];

      const nextSelection = {};

      activeOptions.forEach((option) => {
        const selected = compatibleVariant.selectedOptions?.find(
          (item) => item.optionId === option._id
        );

        if (selected?.valueId) {
          nextSelection[option._id] = selected.valueId;
        }
      });

      return nextSelection;
    });
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

  const getWishlistSnapshot = () => ({
    productId: product?._id,
    name: product?.name || 'Product',
    brand: product?.brand || '',
    categoryName:
      typeof product?.category === 'object'
        ? product?.category?.name || ''
        : product?.category || '',
    image: selectedVariant?.images?.[0] || product?.images?.[0] || null,
    minPrice:
      selectedVariant?.price != null ? Number(selectedVariant.price) : null,
    maxPrice:
      selectedVariant?.price != null ? Number(selectedVariant.price) : null,
    inStock: activeVariants.some((variant) => Number(variant.stock || 0) > 0),
    variantCount: activeVariants.length,
  });

  const handleWishlist = () => {
    if (product?._id) toggleWishlist(getWishlistSnapshot());
  };

  const handleAddToCart = () => {
    setSelectionError('');
    setCartMessage('');

    if (activeOptions.length > 0 && !selectedVariant) {
      setSelectionError('Please select an available option combination.');
      return;
    }
    if (!selectedVariant || Number(selectedVariant.stock || 0) <= 0) {
      setSelectionError('This variant is currently unavailable.');
      return;
    }

    const result = addToCart({
      productId: product._id,
      variantId: selectedVariant._id,
      productName: product.name,
      brand: product.brand || '',
      categoryName:
        typeof product.category === 'object'
          ? product.category?.name || ''
          : product.category || '',
      image: selectedVariant.images?.[0] || product.images?.[0] || null,
      sku: selectedVariant.sku || '',
      variantTitle: selectedVariant.title || '',
      selectedOptions: Array.isArray(selectedVariant.selectedOptions)
        ? selectedVariant.selectedOptions.map((option) => ({
            optionId: option.optionId,
            optionName: option.optionName,
            valueId: option.valueId,
            value: option.value,
          }))
        : [],
      unitPrice: Number(selectedVariant.price),
      stock: Number(selectedVariant.stock),
      quantity,
    });

    if (result.ok) setCartMessage(result.message);
    else setSelectionError(result.message);
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
      <div className="min-h-[75vh] bg-[#f5f6f8] px-4 py-20">
        <div className="mx-auto max-w-lg rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <FaBoxOpen className="text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-950">Product unavailable</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error || 'We could not find the product you were looking for.'}
          </p>
          <Link
            to="/products"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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
  const categorySlug =
    typeof product.category === 'object' ? product.category?.slug || '' : '';

  const currentImage = galleryImages[currentImageIndex] || null;
  const stock = Number(selectedVariant?.stock || 0);
  const wishlisted = product?._id ? isWishlisted(product._id) : false;
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
      <main className="min-h-screen bg-[#f5f6f8] text-slate-950">
        <div className="mx-auto max-w-[1240px] px-3 py-4 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
          <nav className="mb-4 flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium text-slate-400 sm:mb-5 sm:text-sm">
            <Link to="/" className="transition hover:text-slate-900">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link to="/products" className="transition hover:text-slate-900">
              Shop
            </Link>
            {categoryName && (
              <>
                <span className="text-slate-300">/</span>
                {categorySlug ? (
                  <Link
                    to={`/products?category=${encodeURIComponent(categorySlug)}`}
                    className="truncate text-slate-600 transition hover:text-violet-700"
                  >
                    {categoryName}
                  </Link>
                ) : (
                  <span className="truncate text-slate-600">{categoryName}</span>
                )}
              </>
            )}
          </nav>

          <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.06fr)_minmax(420px,0.94fr)] xl:gap-6">
            <div className="min-w-0 rounded-[24px] border border-slate-200/90 bg-white p-3 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.28)] sm:rounded-[26px] sm:p-5 lg:p-6">
              <motion.div
                layout
                className="group relative aspect-square overflow-hidden rounded-[19px] bg-[#eef1f4] sm:rounded-[22px]"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${selectedVariant?._id || 'product'}-${currentImageIndex}`}
                    src={getImageUrl(currentImage)}
                    alt={getImageAlt(currentImage, product.name)}
                    className="h-full w-full object-cover"
                    initial={{ opacity: 0, scale: 1.018 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.24 }}
                    fetchPriority="high"
                    onError={(event) => {
                      event.currentTarget.src = fallbackImage;
                    }}
                  />
                </AnimatePresence>

                <div className="absolute left-3 top-3 flex flex-wrap gap-2 sm:left-4 sm:top-4">
                  {product.featured && (
                    <span className="rounded-full bg-slate-950/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur sm:text-xs">
                      Featured
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="rounded-full bg-white/92 px-3 py-1.5 text-[10px] font-bold text-rose-600 shadow-sm backdrop-blur sm:text-xs">
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
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white sm:left-4 sm:h-11 sm:w-11"
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      aria-label="Next product image"
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white sm:right-4 sm:h-11 sm:w-11"
                    >
                      <FaChevronRight />
                    </button>
                  </>
                )}
              </motion.div>

              {galleryImages.length > 1 && (
                <div className="mt-3 flex min-w-0 gap-2.5 overflow-x-auto pb-1 sm:mt-4">
                  {galleryImages.map((image, index) => (
                    <button
                      type="button"
                      key={`${getImagePath(image)}-${index}`}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-slate-100 transition sm:h-[72px] sm:w-[72px] ${
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
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <aside className="min-w-0 rounded-[24px] border border-slate-200/90 bg-white p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.28)] sm:rounded-[26px] sm:p-6 lg:p-7 xl:sticky xl:top-24">
              <div className="flex flex-wrap items-center gap-2">
                {categoryName && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700">
                    <FaTag className="text-[9px]" />
                    {categoryName}
                  </span>
                )}
                {product.brand && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {product.brand}
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-[30px] font-black leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-[36px] lg:text-[38px] xl:text-[40px]">
                {product.name}
              </h1>

              {(product.shortDescription || product.description) && (
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                  {product.shortDescription || product.description}
                </p>
              )}

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/75 p-4 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      {selectedVariant ? 'Your price' : 'Product price'}
                    </p>
                    {selectedVariant ? (
                      <div className="mt-1.5 flex flex-wrap items-baseline gap-2.5">
                        <span className="text-[28px] font-black tracking-[-0.035em] text-slate-950 sm:text-[32px]">
                          {formatPrice(selectedVariant.price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-sm font-semibold text-slate-400 line-through">
                            {formatPrice(selectedVariant.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-base font-bold text-slate-600">
                        Select an available option
                      </p>
                    )}
                  </div>

                  {hasDiscount && (
                    <span className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600">
                      {discountPercent}% off
                    </span>
                  )}
                </div>

                {selectedVariant && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500">
                    {selectedVariant.title && (
                      <span className="font-semibold text-slate-700">
                        {selectedVariant.title}
                      </span>
                    )}
                    {selectedVariant.sku && <span>SKU {selectedVariant.sku}</span>}
                  </div>
                )}
              </div>

              {activeOptions.length > 0 && (
                <div className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
                  {activeOptions.map((option) => (
                    <div key={option._id} className="py-5 first:pt-4 last:pb-5">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {option.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Select {option.name.toLowerCase()}
                          </p>
                        </div>

                        {selectedValues[option._id] && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                            {
                              option.values.find(
                                (value) => value._id === selectedValues[option._id]
                              )?.value
                            }
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {option.values.map((value) => {
                          const isSelected = selectedValues[option._id] === value._id;
                          const available = isValueAvailable(option._id, value._id);

                          return (
                            <button
                              type="button"
                              key={value._id}
                              onClick={() => handleOptionSelect(option._id, value._id)}
                              disabled={!available && !isSelected}
                              className={`relative min-h-11 min-w-14 rounded-xl border px-3.5 py-2 text-sm font-bold transition ${
                                isSelected
                                  ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                                  : available
                                    ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                                    : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
                              }`}
                            >
                              {value.value}
                              {isSelected && (
                                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[8px] text-white">
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

              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        selectedVariant && stock > 0
                          ? stock <= 5
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span className="truncate">
                      {!selectedVariant
                        ? 'Choose an available variant'
                        : stock <= 0
                          ? 'Out of stock'
                          : stock <= 5
                            ? `Only ${stock} left in stock`
                            : 'In stock and ready to order'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Quantity is limited by current stock.
                  </p>
                </div>

                <div className="flex shrink-0 items-center self-start rounded-xl border border-slate-200 bg-slate-50 p-1 sm:self-auto">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <FaMinus className="text-[10px]" />
                  </button>
                  <span className="w-10 text-center text-sm font-black text-slate-950">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={!selectedVariant || stock <= 0 || quantity >= stock}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <FaPlus className="text-[10px]" />
                  </button>
                </div>
              </div>

              {selectionError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                >
                  {selectionError}
                </motion.div>
              )}

              {cartMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                >
                  {cartMessage}
                </motion.div>
              )}

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || stock <= 0}
                  className="inline-flex min-h-[50px] items-center justify-center gap-2.5 rounded-xl bg-violet-600 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(124,58,237,0.2)] transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  <FaShoppingBag /> Add to cart
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!selectedVariant || stock <= 0}
                  className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Buy now
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  disabled={!selectedVariant}
                  className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-300"
                  aria-label="Email product information"
                >
                  <FaEnvelope className="shrink-0" />
                  <span className="truncate">Email</span>
                </button>
                <button
                  type="button"
                  onClick={handleWishlist}
                  className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition ${
                    wishlisted
                      ? 'border-rose-200 bg-rose-50 text-rose-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'
                  }`}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <FaHeart className="shrink-0" />
                  <span className="truncate">{wishlisted ? 'Saved' : 'Save'}</span>
                </button>
                <a
                  href="#write-review"
                  className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2 text-xs font-bold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                  aria-label="Write a product review"
                >
                  <FaStar className="shrink-0" />
                  <span className="truncate">Review</span>
                </a>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                {[
                  { icon: FaTruck, label: 'Delivery checked' },
                  { icon: FaShieldAlt, label: 'Secure order' },
                  { icon: FaLock, label: 'Cash on delivery' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-xl bg-slate-50 px-2 py-3 text-center"
                  >
                    <Icon className="mx-auto text-xs text-violet-600" />
                    <p className="mt-1.5 text-[10px] font-bold leading-4 text-slate-600 sm:text-[11px]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
            <div className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">
                Product details
              </p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.025em] text-slate-950 sm:text-2xl">
                About this item
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-[15px]">
                {product.description ||
                  'More product details will be available soon.'}
              </p>
            </div>

            <div className="min-w-0 rounded-[22px] bg-slate-950 p-5 text-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.75)] sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">
                ShopEase promise
              </p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.025em] sm:text-2xl">
                Know what you are ordering.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Your selected variant controls the price, availability and stock shown before checkout.
              </p>

              <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                {[
                  'Variant-specific pricing',
                  'Live stock validation',
                  'Selection checked before checkout',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs font-semibold text-white/75">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[8px] text-violet-300">
                      <FaCheck />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <ProductReviews productId={product._id} />

          {(relatedLoading || relatedProducts.length > 0) && (
            <section className="mt-8 sm:mt-9">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">
                    You may also like
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-[28px]">
                    More from {categoryName || 'this collection'}
                  </h2>
                  <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
                    A small selection from the same category.
                  </p>
                </div>

                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-violet-700"
                >
                  Explore shop
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {relatedLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-[22px] border border-slate-200 bg-white"
                    >
                      <div className="aspect-[4/4.3] animate-pulse bg-slate-100" />
                      <div className="space-y-3 p-4">
                        <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
                        <div className="h-5 w-4/5 animate-pulse rounded-full bg-slate-100" />
                        <div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,285px))] lg:justify-start">
                  {relatedProducts.map((relatedProduct) => (
                    <ProductCard
                      key={relatedProduct._id}
                      product={relatedProduct}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {showEmailModal && (
        <EmailModal
          product={product}
          variant={selectedVariant}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  );
};

export default ProductDetail;
