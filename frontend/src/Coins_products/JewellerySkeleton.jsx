// High-performance, rich shimmering skeleton loaders for Jewellery modules
export function JewelleryCardSkeletonGrid({ count = 8 }) {
  return (
    <div className="jsk-grid">
      <style>{`
        @keyframes jskShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .jsk-shimmer {
          background: linear-gradient(90deg, #EAEFEF 25%, #F5F8F8 50%, #EAEFEF 75%);
          background-size: 200% 100%;
          animation: jskShimmer 1.5s infinite ease-in-out;
          border-radius: 8px;
        }

        .jsk-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 22px;
          margin-bottom: 30px;
        }

        .jsk-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          overflow: hidden;
          padding-bottom: 16px;
          display: flex;
          flex-direction: column;
        }

        .jsk-img-box {
          height: 190px;
          width: 100%;
          border-radius: 0;
        }

        .jsk-body {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .jsk-line {
          height: 14px;
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="jsk-card">
          <div className="jsk-shimmer jsk-img-box" />
          <div className="jsk-body">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <div className="jsk-shimmer jsk-line" style={{ width: "35%", height: "12px" }} />
              <div className="jsk-shimmer jsk-line" style={{ width: "25%", height: "12px" }} />
            </div>
            <div className="jsk-shimmer jsk-line" style={{ width: "70%", height: "18px" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <div className="jsk-shimmer jsk-line" style={{ width: "30%", height: "12px" }} />
              <div className="jsk-shimmer jsk-line" style={{ width: "30%", height: "12px" }} />
              <div className="jsk-shimmer jsk-line" style={{ width: "30%", height: "12px" }} />
            </div>
            <div className="jsk-shimmer jsk-line" style={{ width: "50%", height: "22px", marginTop: "4px" }} />
            <div className="jsk-shimmer jsk-line" style={{ width: "100%", height: "40px", borderRadius: "10px", marginTop: "8px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function JewelleryRequestSkeletonList({ count = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <style>{`
        @keyframes jskShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .jsk-shimmer {
          background: linear-gradient(90deg, #EAEFEF 25%, #F5F8F8 50%, #EAEFEF 75%);
          background-size: 200% 100%;
          animation: jskShimmer 1.5s infinite ease-in-out;
          border-radius: 8px;
        }
        .jsk-req-card {
          background: #FFFFFF;
          border: 1px solid #E1EBEA;
          border-radius: 18px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="jsk-req-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="jsk-shimmer" style={{ width: "140px", height: "18px" }} />
            <div className="jsk-shimmer" style={{ width: "100px", height: "14px" }} />
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <div className="jsk-shimmer" style={{ width: "180px", height: "14px" }} />
            <div className="jsk-shimmer" style={{ width: "140px", height: "14px" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
            <div className="jsk-shimmer" style={{ height: "64px", borderRadius: "12px" }} />
            <div className="jsk-shimmer" style={{ height: "64px", borderRadius: "12px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
            <div className="jsk-shimmer" style={{ width: "120px", height: "36px", borderRadius: "10px" }} />
            <div className="jsk-shimmer" style={{ width: "100px", height: "36px", borderRadius: "10px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function JewelleryTransactionSkeletonList({ count = 4, viewMode = "cards" }) {
  if (viewMode === "table") {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E1EBEA", padding: "16px" }}>
        <style>{`
          @keyframes jskShimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .jsk-shimmer {
            background: linear-gradient(90deg, #EAEFEF 25%, #F5F8F8 50%, #EAEFEF 75%);
            background-size: 200% 100%;
            animation: jskShimmer 1.5s infinite ease-in-out;
            border-radius: 6px;
          }
        `}</style>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 8px",
              borderBottom: "1px solid #F0F4F4",
              gap: "16px",
            }}
          >
            <div className="jsk-shimmer" style={{ width: "60px", height: "16px" }} />
            <div className="jsk-shimmer" style={{ width: "100px", height: "18px" }} />
            <div className="jsk-shimmer" style={{ width: "140px", height: "16px" }} />
            <div className="jsk-shimmer" style={{ width: "120px", height: "16px" }} />
            <div className="jsk-shimmer" style={{ width: "180px", height: "16px" }} />
            <div className="jsk-shimmer" style={{ width: "80px", height: "18px" }} />
            <div className="jsk-shimmer" style={{ width: "90px", height: "14px" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
      <style>{`
        @keyframes jskShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .jsk-shimmer {
          background: linear-gradient(90deg, #EAEFEF 25%, #F5F8F8 50%, #EAEFEF 75%);
          background-size: 200% 100%;
          animation: jskShimmer 1.5s infinite ease-in-out;
          border-radius: 8px;
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E1EBEA",
            borderRadius: "18px",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="jsk-shimmer" style={{ width: "120px", height: "18px" }} />
            <div className="jsk-shimmer" style={{ width: "80px", height: "18px" }} />
          </div>
          <div className="jsk-shimmer" style={{ height: "46px", borderRadius: "10px" }} />
          <div className="jsk-shimmer" style={{ height: "60px", borderRadius: "10px" }} />
          <div className="jsk-shimmer" style={{ width: "140px", height: "12px", marginTop: "4px" }} />
        </div>
      ))}
    </div>
  );
}
