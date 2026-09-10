import { useNavigate, useLocation } from "react-router-dom";
import { PlusIcon, CoinIcon, InboxIcon, HistoryIcon, ArrowRightIcon } from "../components/SvgIcons";

export const COIN_TABS = [
  { label: "Add Coins", path: "/buy-coin", icon: PlusIcon },
  { label: "Available Coins", path: "/stored-coins", icon: CoinIcon },
  { label: "Requests Coins", path: "/coin-requests-page", icon: InboxIcon },
  { label: "Transaction Coins History", path: "/coin-transactions", icon: HistoryIcon },
];

export default function CoinTabs({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        background: "#FFFFFF",
        border: "1px solid #E1EBEA",
        borderRadius: "16px",
        padding: "8px 12px",
        marginBottom: "24px",
        boxShadow: "0 4px 16px rgba(7, 59, 63, 0.03)",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {COIN_TABS.map((tab) => {
        const isActive = activeTab ? activeTab === tab.label : currentPath === tab.path;
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
  );
}
