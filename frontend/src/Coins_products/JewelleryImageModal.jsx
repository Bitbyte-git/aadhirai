import { useEffect, useState } from "react";
import { CloseIcon, CopyIcon, JewelryIcon, CheckIcon } from "../components/SvgIcons";

export default function JewelleryImageModal({ isOpen, onClose, product }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const imageSrc =
    product.images?.[0]?.image ||
    product.image ||
    (typeof product.images === "string" ? product.images : "");

  const handleCopyCode = (e) => {
    e.stopPropagation();
    if (!product.product_code) return;
    navigator.clipboard?.writeText(product.product_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
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
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "20px",
        animation: "fadeIn 200ms ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: "24px",
          maxWidth: "680px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(7, 59, 63, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          position: "relative",
          animation: "scaleUp 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleUp {
            from { transform: scale(0.92); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid #E1EBEA",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            color: "#073B3F",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <CloseIcon size={18} color="#073B3F" />
        </button>

        {/* Big Product Image Showcase */}
        <div
          style={{
            width: "100%",
            height: "380px",
            background: "radial-gradient(circle at center, #F7FAFA 0%, #E7EFEF 100%)",
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name || "Jewellery"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: "24px",
                transition: "transform 300ms ease",
              }}
            />
          ) : (
            <div style={{ textAlign: "center", color: "#7A8987" }}>
              <JewelryIcon size={64} color="#073B3F" style={{ opacity: 0.4 }} />
              <div style={{ marginTop: "8px", fontSize: "14px", fontWeight: 600 }}>
                No High-Resolution Photo Uploaded
              </div>
            </div>
          )}

          {/* Metal Badge Overlay */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "20px",
              background: "rgba(7, 59, 63, 0.9)",
              color: "#FFFFFF",
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 800,
              backdropFilter: "blur(4px)",
              letterSpacing: "0.5px",
            }}
          >
            {product.metal?.toUpperCase() || "GOLD"} {product.grade?.toUpperCase() || "22K"}
          </div>
        </div>

        {/* Product Details Section */}
        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#073B3F", margin: "0 0 6px" }}>
                {product.name || "Jewellery Piece"}
              </h2>
              <div style={{ fontSize: "13px", color: "#5C706E", textTransform: "capitalize" }}>
                Category: <strong>{product.category || "General"}</strong> • Occasion: <strong>{product.occasion || "Daily Wear"}</strong>
              </div>
            </div>

            {/* Product Code Tag with Copy */}
            {product.product_code && (
              <button
                type="button"
                onClick={handleCopyCode}
                title="Click to copy product code"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#F0F6F5",
                  border: "1px solid #C4DCDA",
                  borderRadius: "10px",
                  padding: "6px 12px",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  color: "#073B3F",
                  cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                {copied ? <CheckIcon size={14} color="#166534" /> : <CopyIcon size={14} color="#073B3F" />}
                <span>{product.product_code}</span>
              </button>
            )}
          </div>

          {/* Specs Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "12px",
              background: "#F8FAFA",
              border: "1px solid #E1EBEA",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: "#7A8987", fontWeight: 700, textTransform: "uppercase" }}>Net Weight</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#073B3F", marginTop: "2px" }}>
                {product.net_weight || product.cross_weight || "0.00"}g
              </div>
            </div>

            <div>
              <div style={{ fontSize: "11px", color: "#7A8987", fontWeight: 700, textTransform: "uppercase" }}>Gross Weight</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#073B3F", marginTop: "2px" }}>
                {product.cross_weight || product.net_weight || "0.00"}g
              </div>
            </div>

            <div>
              <div style={{ fontSize: "11px", color: "#7A8987", fontWeight: 700, textTransform: "uppercase" }}>Stone Weight</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#073B3F", marginTop: "2px" }}>
                {product.stone_weight || "0.00"}g
              </div>
            </div>

            <div>
              <div style={{ fontSize: "11px", color: "#7A8987", fontWeight: 700, textTransform: "uppercase" }}>Making Charge</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#073B3F", marginTop: "2px" }}>
                {product.making_charge || "0"}%
              </div>
            </div>
          </div>

          {product.description && (
            <div style={{ fontSize: "13px", color: "#455A64", lineHeight: "1.6", marginBottom: "18px" }}>
              {product.description}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 24px",
                background: "#073B3F",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
