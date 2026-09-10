import { useEffect } from "react";
import { CheckIcon, CloseIcon, SparkleIcon } from "../components/SvgIcons";

export default function ActionSuccessModal({
  isOpen,
  onClose,
  title = "Action Successful!",
  message = "Your operation has been processed successfully.",
  details = [], // Array of { label: string, value: string | number, highlight?: boolean }
  type = "success", // 'success' | 'info' | 'warning' | 'danger'
  buttonText = "Done, Great!",
}) {
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

  if (!isOpen) return null;

  const isSuccess = type === "success";
  const isDanger = type === "danger";

  const iconBg = isSuccess
    ? "linear-gradient(135deg, #10B981 0%, #047857 100%)"
    : isDanger
    ? "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)"
    : "linear-gradient(135deg, #073B3F 0%, #0F766E 100%)";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(7, 28, 30, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "20px",
        animation: "asmFadeIn 180ms ease-out",
      }}
    >
      <style>{`
        @keyframes asmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes asmPopScale {
          0% { transform: scale(0.92) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes asmBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: "24px",
          maxWidth: "480px",
          width: "100%",
          padding: "32px 28px 26px",
          boxShadow: "0 24px 60px rgba(7, 59, 63, 0.28)",
          textAlign: "center",
          position: "relative",
          animation: "asmPopScale 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Close ✕ Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#F0F4F4",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#5C706E",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#E1EBEA")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#F0F4F4")}
        >
          <CloseIcon size={16} />
        </button>

        {/* Animated Badge Icon */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            boxShadow: isSuccess
              ? "0 10px 25px rgba(16, 185, 129, 0.35)"
              : "0 10px 25px rgba(7, 59, 63, 0.25)",
            animation: "asmBounce 2s infinite ease-in-out",
          }}
        >
          {isSuccess ? (
            <CheckIcon size={36} color="#FFFFFF" />
          ) : isDanger ? (
            <CloseIcon size={34} color="#FFFFFF" />
          ) : (
            <SparkleIcon size={34} color="#FFFFFF" />
          )}
        </div>

        {/* Title & Message */}
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: "21px",
            fontWeight: 850,
            color: "#073B3F",
            lineHeight: 1.25,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: "14px",
            color: "#5C706E",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        {/* Details Pill Box (if any) */}
        {details && details.length > 0 && (
          <div
            style={{
              background: "#F8FAFA",
              border: "1px solid #E1EBEA",
              borderRadius: "16px",
              padding: "12px 16px",
              marginBottom: "22px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              textAlign: "left",
            }}
          >
            {details.map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "#7A8987", fontWeight: 600 }}>{d.label}</span>
                <strong
                  style={{
                    color: d.highlight ? "#047857" : "#073B3F",
                    fontFamily: d.isMonospace ? "monospace" : "inherit",
                    fontWeight: 800,
                  }}
                >
                  {d.value}
                </strong>
              </div>
            ))}
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            height: "46px",
            background: "linear-gradient(135deg, #073B3F 0%, #0C4E53 100%)",
            border: "none",
            borderRadius: "14px",
            color: "#FFFFFF",
            fontSize: "15px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(7, 59, 63, 0.22)",
            transition: "transform 140ms ease, box-shadow 140ms ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
