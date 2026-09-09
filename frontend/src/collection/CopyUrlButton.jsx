import { useState } from "react";
import api from "../api";

export default function CopyUrlButton({ style, userId, publicId, label = "Copy URL" }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    setLoading(true);
    try {
      const res = await api.post("/generate-referral-link/", {
        user_id: userId,
        public_id: publicId,
      });
      const token = res.data.token;
      const url = `${window.location.origin}/register?ref=${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Failed to generate URL. Please try again.");
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={loading}
      className="bb-copy-url-btn"
      style={{
        padding: "10px 18px",
        background: copied ? "rgba(12,64,68,0.12)" : "#FDFDFC",
        border: `1px solid ${copied ? "rgba(12,64,68,0.4)" : "rgba(12,64,68,0.22)"}`,
        borderRadius: "999px",
        fontWeight: 800,
        color: "#0C4044",
        fontSize: "13px",
        cursor: loading ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        whiteSpace: "nowrap",
        boxShadow: "0 8px 20px rgba(7,59,63,0.06)",
        transition: "all 0.2s ease",
        maxWidth: "100%",
        ...style,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
      {copied ? "URL Copied!" : loading ? "Generating..." : label}
    </button>
  );
}