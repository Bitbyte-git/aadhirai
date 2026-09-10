// Progressive Batch Pagination Control
// Step progression: First 100 -> click loads +200 -> next click loads +500 -> next click loads +500...

export function getNextBatchStep(currentVisible) {
  if (currentVisible <= 100) return 200;
  return 500;
}

export default function LoadMoreControl({
  currentVisible,
  totalCount,
  onLoadMore,
  itemName = "items",
}) {
  if (totalCount <= 100) return null; // No load more needed if total is small

  const nextStep = getNextBatchStep(currentVisible);
  const remaining = Math.max(0, totalCount - currentVisible);
  const nextIncrement = Math.min(nextStep, remaining);
  const isAllLoaded = currentVisible >= totalCount;
  const progressPercent = Math.min(100, Math.round((currentVisible / totalCount) * 100));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: "32px auto 20px",
        padding: "18px 24px",
        background: "#FFFFFF",
        border: "1px solid #E1EBEA",
        borderRadius: "18px",
        maxWidth: "460px",
        boxShadow: "0 2px 12px rgba(7, 59, 63, 0.03)",
        gap: "12px",
      }}
    >
      {/* Progress Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          fontSize: "12.5px",
          color: "#5C706E",
          fontWeight: 700,
        }}
      >
        <span>
          Showing <strong style={{ color: "#073B3F" }}>{Math.min(currentVisible, totalCount)}</strong> of{" "}
          <strong style={{ color: "#073B3F" }}>{totalCount}</strong> {itemName}
        </span>
        <span style={{ color: "#047857" }}>{progressPercent}% loaded</span>
      </div>

      {/* Progress Track */}
      <div
        style={{
          width: "100%",
          height: "6px",
          background: "#EEF4F4",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            background: "linear-gradient(90deg, #073B3F 0%, #10B981 100%)",
            borderRadius: "999px",
            transition: "width 300ms ease-out",
          }}
        />
      </div>

      {/* Action Button or All Loaded Label */}
      {!isAllLoaded ? (
        <button
          type="button"
          onClick={() => onLoadMore(nextIncrement)}
          style={{
            marginTop: "4px",
            padding: "10px 24px",
            background: "#073B3F",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "12px",
            fontSize: "13.5px",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 14px rgba(7, 59, 63, 0.18)",
            transition: "transform 140ms ease, background 140ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0C4E53")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#073B3F")}
        >
          <span>⬇️ Load More (+{nextIncrement} {itemName})</span>
        </button>
      ) : (
        <div
          style={{
            fontSize: "12.5px",
            fontWeight: 750,
            color: "#047857",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "4px",
          }}
        >
          <span>✓ All {totalCount} {itemName} loaded</span>
        </div>
      )}
    </div>
  );
}
