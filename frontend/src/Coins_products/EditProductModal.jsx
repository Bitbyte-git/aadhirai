import { useState, useEffect, useRef } from "react";
import api from "../api";
import { CloseIcon, CheckIcon, JewelryIcon, PlusIcon, UploadIcon } from "../components/SvgIcons";

const PRODUCT_CATEGORIES = [
  { key: "rings", label: "Rings" },
  { key: "necklaces", label: "Necklaces" },
  { key: "bangles", label: "Bangles" },
  { key: "bracelets", label: "Bracelets" },
  { key: "earrings", label: "Earrings" },
  { key: "chains", label: "Chains" },
  { key: "pendants", label: "Pendants" },
  { key: "mangalsutra", label: "Mangalsutra" },
  { key: "anklets", label: "Anklets" },
  { key: "nosepin", label: "Nose Pins" },
  { key: "toerings", label: "Toe Rings" },
  { key: "cufflinks", label: "Cufflinks" },
  { key: "brooches", label: "Brooches" },
  { key: "tiepins", label: "Tie Pins" },
  { key: "coins", label: "Coins & Bars" },
];

const GENDERS = [
  { key: "all", label: "All (Unisex)" },
  { key: "women", label: "Women" },
  { key: "men", label: "Men" },
  { key: "kids", label: "Kids" },
];

export default function EditProductModal({ isOpen, onClose, product, onUpdated }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("rings");
  const [metal, setMetal] = useState("gold");
  const [grade, setGrade] = useState("22k");
  const [gender, setGender] = useState("all");
  const [crossWeight, setCrossWeight] = useState("");
  const [stoneWeight, setStoneWeight] = useState("0");
  const [netWeight, setNetWeight] = useState("");
  const [makingCharge, setMakingCharge] = useState("8");
  const [wastageCharge, setWastageCharge] = useState("0");
  const [stoneValue, setStoneValue] = useState("0");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Product Images State
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategory(product.category || "rings");
      setMetal(product.metal || "gold");
      setGrade(product.grade || "22k");
      setGender(product.gender || "all");
      setCrossWeight(product.cross_weight || "");
      setStoneWeight(product.stone_weight || "0");
      setNetWeight(product.net_weight || product.cross_weight || "");
      setMakingCharge(product.making_charge || "8");
      setWastageCharge(product.wastage_charge || "0");
      setStoneValue(product.stone_value || "0");
      setPrice(product.price || "");
      setStockQuantity(String(product.stock_quantity ?? 0));
      setLowStockThreshold(String(product.low_stock_threshold ?? 5));
      setIsActive(product.is_active ?? true);
      setExistingImages(product.images || []);
      setImagesToDelete([]);
      setNewFiles([]);
      setNewPreviews([]);
      setPreviewModalImage(null);
      setError("");
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Auto calculate net weight
  const handleGrossChange = (val) => {
    setCrossWeight(val);
    const g = parseFloat(val) || 0;
    const s = parseFloat(stoneWeight) || 0;
    setNetWeight(Math.max(0, g - s).toFixed(4));
  };

  const handleStoneChange = (val) => {
    setStoneWeight(val);
    const g = parseFloat(crossWeight) || 0;
    const s = parseFloat(val) || 0;
    setNetWeight(Math.max(0, g - s).toFixed(4));
  };

  // Image actions
  const handleRemoveExistingImage = (imgId) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imgId));
    setImagesToDelete((prev) => [...prev, imgId]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewFiles((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...urls]);
    e.target.value = "";
  };

  const handleRemoveNewFile = (idx) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => {
      try {
        URL.revokeObjectURL(prev[idx]);
      } catch {
        /* ignore */
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // 1. Delete removed existing images
      for (const imgId of imagesToDelete) {
        try {
          await api.delete(`/jewelry-product-images/${imgId}/`);
        } catch (delErr) {
          console.error("Failed to delete image", imgId, delErr);
        }
      }

      // 2. Prepare FormData payload
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category);
      formData.append("metal", metal);
      formData.append("grade", grade);
      formData.append("gender", gender);
      formData.append("cross_weight", crossWeight);
      formData.append("stone_weight", stoneWeight || "0");
      formData.append("net_weight", netWeight || crossWeight);
      formData.append("making_charge", makingCharge);
      formData.append("wastage_charge", wastageCharge || "0");
      formData.append("stone_value", stoneValue || "0");
      formData.append("price", price);
      formData.append("stock_quantity", parseInt(stockQuantity, 10) || 0);
      formData.append("low_stock_threshold", parseInt(lowStockThreshold, 10) || 5);
      formData.append("is_active", isActive);

      newFiles.forEach((file) => {
        formData.append("uploaded_images", file);
      });

      const res = await api.patch(`/jewelry-products/${product.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (onUpdated) onUpdated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update product.");
    }
    setSubmitting(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(7, 28, 30, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: "20px",
          maxWidth: "680px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(7, 59, 63, 0.35)",
          padding: "16px 24px",
          position: "relative",
          animation: "scaleUp 200ms ease-out",
          scrollbarWidth: "thin",
          scrollbarColor: "#CBD5E1 transparent",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#073B3F", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Super Admin Control
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#073B3F", margin: "1px 0 0" }}>
              Edit Jewellery Product
            </h2>
            {product.product_code && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: "3px",
                  fontSize: "11.5px",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  color: "#073B3F",
                  background: "#EEF4F4",
                  padding: "1px 7px",
                  borderRadius: "6px",
                  border: "1px solid #D6E2E1",
                }}
              >
                Code: {product.product_code}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#F0F4F4",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <CloseIcon size={15} color="#073B3F" />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              color: "#B91C1C",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "10px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: "8px",
                border: "1px solid #D6E2E1",
                fontSize: "12.5px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Category & Gender */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid #D6E2E1",
                  fontSize: "12.5px",
                  outline: "none",
                  background: "#FFFFFF",
                  boxSizing: "border-box",
                }}
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid #D6E2E1",
                  fontSize: "12.5px",
                  outline: "none",
                  background: "#FFFFFF",
                  boxSizing: "border-box",
                }}
              >
                {GENDERS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metal & Grade */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
                Metal
              </label>
              <select
                value={metal}
                onChange={(e) => {
                  setMetal(e.target.value);
                  if (e.target.value === "silver") setGrade("999");
                  else setGrade("22k");
                }}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid #D6E2E1",
                  fontSize: "12.5px",
                  outline: "none",
                  background: "#FFFFFF",
                  boxSizing: "border-box",
                }}
              >
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
                Grade / Purity
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid #D6E2E1",
                  fontSize: "12.5px",
                  outline: "none",
                  background: "#FFFFFF",
                  boxSizing: "border-box",
                }}
              >
                {metal === "gold" ? (
                  <>
                    <option value="22k">22K (916 Hallmarked)</option>
                    <option value="24k">24K (999 Fine Gold)</option>
                  </>
                ) : (
                  <option value="999">999 (Fine Silver)</option>
                )}
              </select>
            </div>
          </div>

          {/* Weights */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
                Gross Wt (g) *
              </label>
              <input
                type="number"
                step="0.0001"
                value={crossWeight}
                onChange={(e) => handleGrossChange(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "7px 9px",
                  borderRadius: "8px",
                  border: "1px solid #D6E2E1",
                  fontSize: "12.5px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
                Stone Wt (g)
              </label>
              <input
                type="number"
                step="0.0001"
                value={stoneWeight}
                onChange={(e) => handleStoneChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 9px",
                  borderRadius: "8px",
                  border: "1px solid #D6E2E1",
                  fontSize: "12.5px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
                Net Metal (g)
              </label>
              <input
                type="number"
                step="0.0001"
                value={netWeight}
                onChange={(e) => setNetWeight(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "7px 9px",
                  borderRadius: "8px",
                  border: "1px solid #D6E2E1",
                  fontSize: "12.5px",
                  outline: "none",
                  background: "#F8FAFA",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Charges & Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
                Making Charge (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={makingCharge}
                onChange={(e) => setMakingCharge(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid #D6E2E1",
                  fontSize: "12.5px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
                Retail Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid #D6E2E1",
                  fontSize: "12.5px",
                  outline: "none",
                  fontWeight: 700,
                  color: "#073B3F",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Stock Quantity & Low Threshold */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
                Stock Quantity (pcs) *
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid #D6E2E1",
                  fontSize: "12.5px",
                  outline: "none",
                  fontWeight: 700,
                  color: "#166534",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "3px" }}>
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid #D6E2E1",
                  fontSize: "12.5px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Product Photos Section */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#2C3E3D" }}>
                Product Photos ({existingImages.length + newFiles.length})
              </label>
              <span style={{ fontSize: "11px", color: "#7A8987" }}>
                Click photo to enlarge
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                background: "#F8FAFA",
                border: "1px solid #E1EBEA",
                borderRadius: "10px",
                minHeight: "56px",
              }}
            >
              {/* Existing Images */}
              {existingImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setPreviewModalImage(img.image)}
                  title="Click to view enlarged photo"
                  style={{
                    position: "relative",
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1.5px solid #D6E2E1",
                    background: "#FFFFFF",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "transform 150ms ease, box-shadow 150ms ease",
                  }}
                >
                  <img
                    src={img.image}
                    alt="Product"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveExistingImage(img.id);
                    }}
                    title="Remove photo"
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "rgba(220, 38, 38, 0.95)",
                      border: "none",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <CloseIcon size={10} color="#FFFFFF" />
                  </button>
                </div>
              ))}

              {/* Newly Added Images */}
              {newPreviews.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setPreviewModalImage(url)}
                  title="New photo (Click to enlarge)"
                  style={{
                    position: "relative",
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1.5px solid #073B3F",
                    background: "#FFFFFF",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={url}
                    alt={`New ${idx + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "1px",
                      left: "1px",
                      background: "#073B3F",
                      color: "#FFFFFF",
                      fontSize: "8px",
                      fontWeight: 800,
                      padding: "0 3px",
                      borderRadius: "3px",
                    }}
                  >
                    NEW
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveNewFile(idx);
                    }}
                    title="Remove photo"
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "rgba(220, 38, 38, 0.95)",
                      border: "none",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <CloseIcon size={10} color="#FFFFFF" />
                  </button>
                </div>
              ))}

              {/* Add Photo Button Tile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  border: "1.5px dashed #073B3F",
                  background: "#EFF6F6",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                  cursor: "pointer",
                  color: "#073B3F",
                  flexShrink: 0,
                }}
                title="Add product photo"
              >
                <PlusIcon size={16} color="#073B3F" />
                <span style={{ fontSize: "8.5px", fontWeight: 800 }}>ADD</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/*"
                style={{ display: "none" }}
              />

              {existingImages.length === 0 && newPreviews.length === 0 && (
                <span style={{ fontSize: "11.5px", color: "#7A8987", marginLeft: "4px" }}>
                  No photos attached yet. Click ADD to upload.
                </span>
              )}
            </div>
          </div>

          {/* Active Status Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#F8FAFA",
              border: "1px solid #E1EBEA",
              borderRadius: "10px",
              padding: "7px 12px",
            }}
          >
            <div>
              <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#073B3F" }}>Active in Catalog</div>
              <div style={{ fontSize: "11px", color: "#7A8987" }}>
                {isActive ? "Visible to downlines for ordering" : "Hidden from downline catalog"}
              </div>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "#073B3F", cursor: "pointer" }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                background: "#F0F4F4",
                border: "none",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 700,
                color: "#5C706E",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "8px 20px",
                background: "#073B3F",
                border: "none",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 700,
                color: "#FFFFFF",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(7, 59, 63, 0.2)",
              }}
            >
              {submitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Enlarged Photo Lightbox Modal */}
      {previewModalImage && (
        <div
          onClick={() => setPreviewModalImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(7, 28, 30, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000000,
            padding: "20px",
            animation: "fadeIn 200ms ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "85vw",
              maxHeight: "85vh",
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "16px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setPreviewModalImage(null)}
              style={{
                position: "absolute",
                top: "-14px",
                right: "-14px",
                background: "#073B3F",
                color: "#FFFFFF",
                border: "2px solid #FFFFFF",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
              title="Close Preview"
            >
              <CloseIcon size={16} color="#FFFFFF" />
            </button>
            <img
              src={previewModalImage}
              alt="Enlarged Product"
              style={{
                maxWidth: "100%",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: "12px",
              }}
            />
            <div style={{ marginTop: "10px", fontSize: "13px", fontWeight: 700, color: "#073B3F" }}>
              {name ? `${name} - Photo Preview` : "Product Photo Preview"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
