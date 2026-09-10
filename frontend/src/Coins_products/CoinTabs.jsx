import { useNavigate, useLocation } from "react-router-dom";
import { PlusIcon, CoinIcon, InboxIcon, HistoryIcon, ArrowRightIcon, JewelryIcon, SparkleIcon } from "../components/SvgIcons";

export const COIN_TABS = [
  { label: "Add Coins", path: "/buy-coin", icon: PlusIcon },
  { label: "Available Coins", path: "/available-coins", icon: CoinIcon },
  { label: "Requests Coins", path: "/coin-requests-page", icon: InboxIcon },
  { label: "Transaction Coins History", path: "/coin-transactions", icon: HistoryIcon },
];

export const JEWELLERY_TABS = [
  { label: "Add Jewellery", path: "/add-jewellery", icon: PlusIcon },
  { label: "Available Jewellery", path: "/available-jewellery", icon: JewelryIcon },
  { label: "Requests Jewellery", path: "/jewellery-requests", icon: InboxIcon },
  { label: "Jewellery Transactions", path: "/jewellery-transactions", icon: HistoryIcon },
];

export default function CoinTabs({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const role = localStorage.getItem("role") || "";
  const isSuperAdmin = role === "super_admin";
  const isPromotor = role === "promotor";

  const isJewelleryRoute =
    currentPath.startsWith("/add-jewellery") ||
    currentPath.startsWith("/buy-jewellery") ||
    currentPath.startsWith("/available-jewellery") ||
    currentPath.startsWith("/jewellery-requests") ||
    currentPath.startsWith("/jewellery-transactions") ||
    activeTab?.toLowerCase().includes("jewel");

  const currentHub = isJewelleryRoute ? "jewellery" : "coins";

  const dynamicCoinTabs = [
    { label: isSuperAdmin ? "Add Coins" : "Buy Coin", path: "/buy-coin", icon: PlusIcon },
    { label: "Available Coins", path: "/available-coins", icon: CoinIcon },
    { label: isPromotor ? "My Requests" : "Requests Coins", path: "/coin-requests-page", icon: InboxIcon },
    { label: isSuperAdmin ? "Transaction Coins History" : "My Coin Transactions", path: "/coin-transactions", icon: HistoryIcon },
  ];

  const dynamicJewelleryTabs = [
    { label: isSuperAdmin ? "Add Jewellery" : "Buy Jewellery", path: "/add-jewellery", icon: PlusIcon },
    { label: "Available Jewellery", path: "/available-jewellery", icon: JewelryIcon },
    { label: isPromotor ? "My Requests" : "Requests Jewellery", path: "/jewellery-requests", icon: InboxIcon },
    { label: isSuperAdmin ? "Jewellery Transactions" : "My Transactions", path: "/jewellery-transactions", icon: HistoryIcon },
  ];

  const activeTabsList = currentHub === "jewellery" ? dynamicJewelleryTabs : dynamicCoinTabs;

  const handleSwitchHub = (targetHub) => {
    if (targetHub === currentHub) return;
    if (targetHub === "jewellery") {
      // Switch to corresponding jewellery page
      if (currentPath === "/buy-coin") navigate(isSuperAdmin ? "/add-jewellery" : "/buy-jewellery");
      else if (currentPath === "/coin-requests-page") navigate("/jewellery-requests");
      else if (currentPath === "/coin-transactions") navigate("/jewellery-transactions");
      else navigate("/available-jewellery");
    } else {
      // Switch to corresponding coins page
      if (currentPath === "/add-jewellery" || currentPath === "/buy-jewellery") navigate("/buy-coin");
      else if (currentPath === "/jewellery-requests") navigate("/coin-requests-page");
      else if (currentPath === "/jewellery-transactions") navigate("/coin-transactions");
      else navigate("/available-coins");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: "24px",
      }}
    >
      {/* Top Hub Switcher: Coins vs Jewellery */}
      <div
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          background: "#EEF4F4",
          borderRadius: "14px",
          padding: "4px",
          border: "1px solid #D9E6E5",
          boxShadow: "0 2px 8px rgba(7, 59, 63, 0.04)",
        }}
      >
        <button
          type="button"
          onClick={() => handleSwitchHub("coins")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            borderRadius: "10px",
            border: "none",
            background: currentHub === "coins" ? "#073B3F" : "transparent",
            color: currentHub === "coins" ? "#FFFFFF" : "#455A64",
            fontSize: "13.5px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 180ms ease",
            boxShadow: currentHub === "coins" ? "0 4px 12px rgba(7, 59, 63, 0.2)" : "none",
          }}
        >
          <CoinIcon size={16} color={currentHub === "coins" ? "#FFFFFF" : "#073B3F"} />
          <span>Coins Hub</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchHub("jewellery")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            borderRadius: "10px",
            border: "none",
            background: currentHub === "jewellery" ? "#073B3F" : "transparent",
            color: currentHub === "jewellery" ? "#FFFFFF" : "#455A64",
            fontSize: "13.5px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 180ms ease",
            boxShadow: currentHub === "jewellery" ? "0 4px 12px rgba(7, 59, 63, 0.2)" : "none",
          }}
        >
          <JewelryIcon size={16} color={currentHub === "jewellery" ? "#FFFFFF" : "#073B3F"} />
          <span>Jewellery Hub</span>
        </button>
      </div>

      {/* 4 Feature Tabs */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          background: "#FFFFFF",
          border: "1px solid #E1EBEA",
          borderRadius: "16px",
          padding: "8px 12px",
          boxShadow: "0 4px 16px rgba(7, 59, 63, 0.03)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {activeTabsList.map((tab) => {
          const isActive = activeTab
            ? (activeTab === tab.label || (tab.path === "/add-jewellery" && (activeTab === "Add Jewellery" || activeTab === "Buy Jewellery")))
            : (currentPath === tab.path || (tab.path === "/add-jewellery" && currentPath === "/buy-jewellery"));
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "12px",
                border: isActive ? "1px solid #073B3F" : "1px solid transparent",
                background: isActive
                  ? "linear-gradient(135deg, #073B3F 0%, #0C4044 100%)"
                  : "#F8FAFA",
                color: isActive ? "#FFFFFF" : "#5C706E",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 180ms ease",
                boxShadow: isActive ? "0 4px 14px rgba(7, 59, 63, 0.22)" : "none",
              }}
            >
              <IconComponent size={16} color={isActive ? "#FFFFFF" : "#5C706E"} />
              <span>{tab.label}</span>
              <ArrowRightIcon size={12} color={isActive ? "#FFFFFF" : "#5C706E"} style={{ opacity: isActive ? 0.9 : 0.4 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
