import { useState, useEffect } from "react";
import api from "../api";
import { CloseIcon, CheckIcon, JewelryIcon } from "../components/SvgIcons";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        category,
        metal,
        grade,
        gender,
        cross_weight: crossWeight,
        stone_weight: stoneWeight || "0",
        net_weight: netWeight || crossWeight,
        making_charge: makingCharge,
        wastage_charge: wastageCharge || "0",
        stone_value: stoneValue || "0",
        price,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        is_active: isActive,
      };

      const res = await api.patch(`/jewelry-products/${product.id}/`, payload);
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
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: "24px",
          maxWidth: "640px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(7, 59, 63, 0.35)",
          padding: "28px 32px",
          position: "relative",
          animation: "scaleUp 200ms ease-out",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#B45309", textTransform: "uppercase" }}>
              Super Admin Control
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#073B3F", margin: "2px 0 0" }}>
              Edit Jewellery Product
            </h2>
            {product.product_code && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: "4px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  color: "#073B3F",
                  background: "#EEF4F4",
                  padding: "2px 8px",
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
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <CloseIcon size={16} color="#073B3F" />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "10px",
              color: "#B91C1C",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "10px",
                border: "1px solid #D6E2E1",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          {/* Category & Gender */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #D6E2E1",
                  fontSize: "13px",
                  outline: "none",
                  background: "#FFFFFF",
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
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #D6E2E1",
                  fontSize: "13px",
                  outline: "none",
                  background: "#FFFFFF",
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
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
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #D6E2E1",
                  fontSize: "13px",
                  outline: "none",
                  background: "#FFFFFF",
                }}
              >
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
                Grade / Purity
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #D6E2E1",
                  fontSize: "13px",
                  outline: "none",
                  background: "#FFFFFF",
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
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
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1px solid #D6E2E1",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
                Stone Wt (g)
              </label>
              <input
                type="number"
                step="0.0001"
                value={stoneWeight}
                onChange={(e) => handleStoneChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1px solid #D6E2E1",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
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
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1px solid #D6E2E1",
                  fontSize: "13px",
                  outline: "none",
                  background: "#F8FAFA",
                }}
              />
            </div>
          </div>

          {/* Charges & Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
                Making Charge (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={makingCharge}
                onChange={(e) => setMakingCharge(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1px solid #D6E2E1",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
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
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1px solid #D6E2E1",
                  fontSize: "13px",
                  outline: "none",
                  fontWeight: 700,
                  color: "#073B3F",
                }}
              />
            </div>
          </div>

          {/* Stock Quantity & Low Threshold */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
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
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1px solid #D6E2E1",
                  fontSize: "13px",
                  outline: "none",
                  fontWeight: 700,
                  color: "#166534",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#2C3E3D", marginBottom: "5px" }}>
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1px solid #D6E2E1",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
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
              borderRadius: "12px",
              padding: "10px 14px",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#073B3F" }}>Active in Catalog</div>
              <div style={{ fontSize: "11.5px", color: "#7A8987" }}>
                {isActive ? "Visible to downlines for ordering" : "Hidden from downline catalog"}
              </div>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "#073B3F", cursor: "pointer" }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                background: "#F0F4F4",
                border: "none",
                borderRadius: "10px",
                fontSize: "13px",
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
                padding: "9px 22px",
                background: "#073B3F",
                border: "none",
                borderRadius: "10px",
                fontSize: "13px",
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
    </div>
  );
}
