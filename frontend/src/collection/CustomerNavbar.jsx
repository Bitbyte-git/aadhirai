import {
  Heart as DrawerHeart, ShoppingBag as DrawerBag,
  Store as DrawerStore, UserRound as DrawerUser, ReceiptText as DrawerReceipt,
  UserRoundPlus as DrawerUserPlus, Network as DrawerNetwork,
  ArrowRightLeft as DrawerSwitch, LogOut as DrawerLogout,
  ShieldCheck as DrawerShield, X as DrawerClose, ChevronRight as DrawerChevron,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import { getCartCountDB } from "../collection/card_section";
import { getSubcategories } from "../config/categoryConfig";
import digiGoldCoinsIcon from "../assets/digi-gold-icon.png";

const API_ORIGIN = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

function Icon({ name, size = 20, filled = false }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: filled ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const paths = {
    truck: (
      <>
        <path d="M3 7h11v10H3z" />
        <path d="M14 11h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="1.7" />
        <circle cx="17" cy="18" r="1.7" />
      </>
    ),
    hallmark: (
      <path d="M12 3 20 6v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3Z" />
    ),
    refresh: (
      <>
        <path d="M20 6v5h-5" />
        <path d="M4 18v-5h5" />
        <path d="M18.2 9A7 7 0 0 0 6 7.8" />
        <path d="M5.8 15A7 7 0 0 0 18 16.2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.8-3.8" />
      </>
    ),
    shop: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
    coin: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="6" strokeDasharray="1.5 1.5" />
        <path d="M12 8v8M9.5 10.5h5" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M4 10h16" />
      </>
    ),
    star: (
      <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6-4.3-4.2 6-.9L12 3Z" />
    ),
    heart: (
      <path d="M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.2a5.1 5.1 0 0 0 0-7.2Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.6-4.2 4.3-6 8-6s6.4 1.8 8 6" />
      </>
    ),
    cart: (
      <>
        <path d="M4 4h2l2.4 11.5h9.8L21 7H7" />
        <circle cx="10" cy="20" r="1.6" />
        <circle cx="18" cy="20" r="1.6" />
      </>
    ),
    userPlus: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21c1.3-4.4 3.7-6.4 7-6.4s5.7 2 7 6.4" />
        <path d="M18 8v6" />
        <path d="M15 11h6" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
        <path d="M15 7l5 5-5 5" />
        <path d="M20 12H8" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    mic: (
      <>
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
        <path d="M19 11a7 7 0 0 1-14 0" />
        <path d="M12 18v3" />
        <path d="M8 21h8" />
      </>
    ),
    gift: (
      <>
        <rect x="3" y="8" width="18" height="13" rx="1.5" />
        <path d="M3 8h18v4H3z" />
        <path d="M12 8v13" />
        <path d="M12 8c-1.2-3.4-6-3.2-6-.3C6 9.2 8 8.6 12 8Z" />
        <path d="M12 8c1.2-3.4 6-3.2 6-.3 0 1.5-2 .9-6 .3Z" />
      </>
    ),
    percent: (
      <>
        <circle cx="7.5" cy="7.5" r="2.5" />
        <circle cx="16.5" cy="16.5" r="2.5" />
        <path d="M18 6 6 18" />
      </>
    ),
    ring: (
      <>
        <circle cx="12" cy="14.5" r="6" />
        <path d="M9 8.5 12 4l3 4.5" />
      </>
    ),
    role: (
      <>
        <path d="M7 7h11l-3-3" />
        <path d="M18 7l-3 3" />
        <path d="M17 17H6l3 3" />
        <path d="M6 17l3-3" />
      </>
    ),
    receipt: (
      <>
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
        <path d="M8 7h8M8 11h8M8 15h4" />
      </>
    ),
    chevronRight: (
      <path d="m9 18 6-6-6-6" />
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function productImage(product) {
  const image = product?.images?.[0]?.image;
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${API_ORIGIN}/${image.replace(/^\/+/, "")}`;
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "...";
  return `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/-`;
}

const menuItems = [
  { label: "All Jewellery", route: "/collection/all", icon: "hallmark" },
  { label: "Gold", route: "/collection/all?metal=gold", icon: "star" },
  // { label: "Diamond", route: "/collection/all?metal=diamond" },
  // { label: "Platinum", route: "/collection/all?metal=platinum" },
  { label: "Silver", route: "/collection/all?metal=silver", icon: "coin" },
  { label: "Coins", route: "/collection/coins", icon: "coin" },
  { label: "Offers", route: "/collection/offers", icon: "percent" },
  { label: "Team369-Live", route: "/bj-live", icon: "mic" },
  { label: "Wedding", route: "/collection/all?wedding=true", icon: "ring" },
  { label: "Gifting", route: "/collection/gifting", icon: "gift" },
  { label: "Nearby Shop", route: "/nearby-shop", icon: "shop" },
];

const allJewelleryMega = [
  {
    title: "Gold Jewellery",
    icon: "◌",
    viewAll: ["View All Gold", "/collection/all?metal=gold"],
    links: [
      ["Gold Rings", "/collection/all?metal=gold&category=rings"],
      ["Gold Bangles", "/collection/all?metal=gold&category=bangles"],
      ["Gold Bracelets", "/collection/all?metal=gold&category=bracelets"],
      ["Gold Earrings", "/collection/all?metal=gold&category=earrings"],
      ["Gold Pendants", "/collection/all?metal=gold&category=pendants"],
      ["Gold Chains", "/collection/all?metal=gold&category=chains"],
      ["Gold Necklaces", "/collection/all?metal=gold&category=necklaces"],
      ["Gold Mangalsutra", "/collection/all?metal=gold&category=mangalsutra"],
      ["Gold Anklets", "/collection/all?metal=gold&category=anklets"],
      ["Gold Maang Tikka", "/collection/all?metal=gold&category=maangtikka"],
      ["Gold Kada", "/collection/all?metal=gold&category=kada"],
      ["Gold Nose Pins", "/collection/all?metal=gold&category=nosepin"],
      ["Gold Tie Pins", "/collection/all?metal=gold&category=tiepins"],
      ["Gold Ear Chains", "/collection/all?metal=gold&category=earchains"],
      ["Gold Toe Rings", "/collection/all?metal=gold&category=toerings"],
      ["Gold Armlets", "/collection/all?metal=gold&category=armlets"],
    ],
  },
  // Diamond Jewellery section — hidden — future use ku vachurukom
  // Platinum Jewellery section — hidden — future use ku vachurukom
  {
    title: "Silver Jewellery",
    icon: "◒",
    viewAll: ["View All Silver", "/collection/all?metal=silver"],
    links: [
      ["Silver Anklets", "/collection/all?metal=silver&category=anklets"],
      ["Silver Rings", "/collection/all?metal=silver&category=rings"],
      ["Silver Earrings", "/collection/all?metal=silver&category=earrings"],
      ["Silver Bracelets", "/collection/all?metal=silver&category=bracelets"],
      ["Silver Bangles", "/collection/all?metal=silver&category=bangles"],
      ["Silver Pendants", "/collection/all?metal=silver&category=pendants"],
      ["Silver Chains", "/collection/all?metal=silver&category=chains"],
      ["Silver Necklaces", "/collection/all?metal=silver&category=necklaces"],
      ["Silver Toe Rings", "/collection/all?metal=silver&category=toerings"],
      ["Silver Nose Pins", "/collection/all?metal=silver&category=nosepin"],
      ["Silver Articles", "/collection/all?metal=silver&category=articles"],
      ["Silver Coins & Items", "/collection/coins?metal=silver"],
    ],
  },
  {
    title: "Coins & Bars",
    icon: "◎",
    viewAll: ["View All Coins", "/collection/coins"],
    links: [
      ["Gold Coins", "/collection/coins?metal=gold"],
      ["Silver Coins", "/collection/coins?metal=silver"],
      ["Gold Bars", "/collection/coins?metal=gold"],
      ["Silver Bars", "/collection/coins?metal=silver"],
      ["Collectible Coins", "/collection/coins"],
      ["Gift Coins", "/collection/gifting"],
      ["Temple Coins", "/collection/coins?search=temple"],
    ],
  },
  {
    title: "Daily Wear",
    icon: "✣",
    viewAll: ["View All Daily Wear", "/collection/all?dailywear=true"],
    links: [
      ["Daily Wear Rings", "/collection/all?dailywear=true&category=rings"],
      [
        "Daily Wear Earrings",
        "/collection/all?dailywear=true&category=earrings",
      ],
      [
        "Daily Wear Pendants",
        "/collection/all?dailywear=true&category=pendants",
      ],
      ["Daily Wear Chains", "/collection/all?dailywear=true&category=chains"],
      ["Light Weight Jewellery", "/collection/all?dailywear=true&search=light"],
      ["Minimal Collection", "/collection/all?dailywear=true&search=minimal"],
    ],
  },
  {
    title: "Wedding Jewellery",
    icon: "◡",
    viewAll: ["View All Wedding", "/collection/all?wedding=true"],
    links: [
      ["Bridal Sets", "/collection/all?wedding=true&search=bridal"],
      ["Temple Jewellery", "/collection/all?wedding=true&search=temple"],
      ["Kundan Jewellery", "/collection/all?wedding=true&search=kundan"],
      ["Polki Jewellery", "/collection/all?wedding=true&search=polki"],
      ["Antique Jewellery", "/collection/all?wedding=true&search=antique"],
      ["Wedding Bangles", "/collection/all?wedding=true&category=bangles"],
    ],
  },

  {
    title: "Gifting Collection",
    icon: "□",
    viewAll: ["View All Gifting", "/collection/gifting"],
    links: [
      ["Gift For Her", "/collection/gifting?gift_tag=Her"],
      ["Gift For Him", "/collection/gifting?gift_tag=Him"],
      ["Kids Jewellery", "/collection/gifting?gift_tag=Kids"],
      ["Corporate Gifts", "/collection/gifting?gift_tag=Corporate"],
      ["Anniversary Gifts", "/collection/gifting?gift_tag=Occasion&gift_type=Anniversary%20Gifts"],
      ["Birthday Gifts", "/collection/gifting?gift_tag=Occasion&gift_type=Birthday%20Gifts"],
    ],
  },
  {
    title: "Mangalsutra",
    icon: "♧",
    viewAll: ["View All Mangalsutra", "/collection/all?category=mangalsutra"],
    links: [
      [
        "Traditional Mangalsutra",
        "/collection/all?category=mangalsutra&search=traditional",
      ],
      [
        "Beaded Mangalsutra",
        "/collection/all?category=mangalsutra&search=beaded",
      ],
      [
        "Short Mangalsutra",
        "/collection/all?category=mangalsutra&search=short",
      ],
      ["Gold Mangalsutra", "/collection/all?category=mangalsutra&metal=gold"],
      [
        "Black Bead Mangalsutra",
        "/collection/all?category=mangalsutra&search=black",
      ],
    ],
  },
  {
    title: "Other Jewellery",
    icon: "☆",
    viewAll: ["View All Others", "/collection/all"],
    links: [
      ["Nose Pins", "/collection/all?category=nosepin"],
      ["Anklets", "/collection/all?category=anklets"],
      ["Toe Rings", "/collection/all?search=toe"],
      ["Cufflinks", "/collection/all?search=cufflinks"],
      ["Brooches", "/collection/all?search=brooch"],
      ["Tie Pins", "/collection/all?search=tie"],
    ],
  },
];

const metalMega = {
  Gold: [
    [
      "Gold Coins",
      "◎",
      "/collection/coins?metal=gold",
      [
        "50mg Gold Coins",
        "100mg Gold Coins",
        "200mg Gold Coins",
        "250mg Gold Coins",
        "500mg Gold Coins",
        "1g Gold Coins",
        "2g Gold Coins",
        "4g Gold Coins",
        "8g Gold Coins",
        "16g Gold Coins",
      ],
    ],
    [
      "Gold Rings",
      "◌",
      "/collection/all?metal=gold&category=rings",
      getSubcategories("rings", "gold"),
    ],
    [
      "Gold Bangles",
      "◯",
      "/collection/all?metal=gold&category=bangles",
      getSubcategories("bangles", "gold"),
    ],
    [
      "Gold Bracelets",
      "◌",
      "/collection/all?metal=gold&category=bracelets",
      getSubcategories("bracelets", "gold"),
    ],
    [
      "Gold Earrings",
      "♢",
      "/collection/all?metal=gold&category=earrings",
      getSubcategories("earrings", "gold"),
    ],
    [
      "Gold Pendants",
      "♤",
      "/collection/all?metal=gold&category=pendants",
      getSubcategories("pendants", "gold"),
    ],
    [
      "Gold Chains",
      "⌁",
      "/collection/all?metal=gold&category=chains",
      getSubcategories("chains", "gold"),
    ],
    [
      "Gold Necklaces",
      "♧",
      "/collection/all?metal=gold&category=necklaces",
      getSubcategories("necklaces", "gold"),
    ],
    [
      "Gold Mangalsutra",
      "♧",
      "/collection/all?metal=gold&category=mangalsutra",
      getSubcategories("mangalsutra", "gold"),
    ],
    [
      "Gold Anklets",
      "⌁",
      "/collection/all?metal=gold&category=anklets",
      getSubcategories("anklets", "gold"),
    ],
    [
      "Gold Maang Tikka",
      "♢",
      "/collection/all?metal=gold&category=maangtikka",
      getSubcategories("maangtikka", "gold"),
    ],
    [
      "Gold Kada",
      "◯",
      "/collection/all?metal=gold&category=kada",
      getSubcategories("kada", "gold"),
    ],
    [
      "Gold Nose Pins",
      "✦",
      "/collection/all?metal=gold&category=nosepin",
      getSubcategories("nosepin", "gold"),
    ],
    [
      "Gold Tie Pins",
      "―",
      "/collection/all?metal=gold&category=tiepins",
      getSubcategories("tiepins", "gold"),
    ],
    [
      "Gold Ear Chains",
      "⌁",
      "/collection/all?metal=gold&category=earchains",
      getSubcategories("earchains", "gold"),
    ],
    [
      "Gold Toe Rings",
      "◌",
      "/collection/all?metal=gold&category=toerings",
      getSubcategories("toerings", "gold"),
    ],
    [
      "Gold Armlets",
      "◯",
      "/collection/all?metal=gold&category=armlets",
      getSubcategories("armlets", "gold"),
    ],
    [
      "Gold Bars",
      "▣",
      "/collection/coins?metal=gold",
      [
        "1g Gold Bar",
        "2g Gold Bar",
        "5g Gold Bar",
        "10g Gold Bar",
        "20g Gold Bar",
        "50g Gold Bar",
        "100g Gold Bar",
      ],
    ],
  ],

  Silver: [
    [
      "Silver Coins",
      "◎",
      "/collection/coins?metal=silver",
      [
        "250mg Silver Coins",
        "500mg Silver Coins",
        "1g Silver Coins",
        "2g Silver Coins",
        "5g Silver Coins",
        "10g Silver Coins",
        "20g Silver Coins",
        "50g Silver Coins",
        "100g Silver Coins",
      ],
    ],
    [
      "Silver Anklets",
      "⌁",
      "/collection/all?metal=silver&category=anklets",
      getSubcategories("anklets", "silver"),
    ],
    [
      "Silver Rings",
      "◌",
      "/collection/all?metal=silver&category=rings",
      getSubcategories("rings", "silver"),
    ],
    [
      "Silver Earrings",
      "♢",
      "/collection/all?metal=silver&category=earrings",
      getSubcategories("earrings", "silver"),
    ],
    [
      "Silver Bracelets",
      "◌",
      "/collection/all?metal=silver&category=bracelets",
      getSubcategories("bracelets", "silver"),
    ],
    [
      "Silver Bangles",
      "◯",
      "/collection/all?metal=silver&category=bangles",
      getSubcategories("bangles", "silver"),
    ],
    [
      "Silver Pendants",
      "♤",
      "/collection/all?metal=silver&category=pendants",
      getSubcategories("pendants", "silver"),
    ],
    [
      "Silver Chains",
      "⌁",
      "/collection/all?metal=silver&category=chains",
      getSubcategories("chains", "silver"),
    ],
    [
      "Silver Necklaces",
      "♧",
      "/collection/all?metal=silver&category=necklaces",
      getSubcategories("necklaces", "silver"),
    ],
    [
      "Silver Toe Rings",
      "◌",
      "/collection/all?metal=silver&category=toerings",
      getSubcategories("toerings", "silver"),
    ],
    [
      "Silver Nose Pins",
      "✦",
      "/collection/all?metal=silver&category=nosepin",
      getSubcategories("nosepin", "silver"),
    ],
    [
      "Silver Articles",
      "♙",
      "/collection/all?metal=silver&category=articles",
      getSubcategories("articles", "silver"),
    ],
    [
      "Silver Bars",
      "▣",
      "/collection/coins?metal=silver",
      [
        "10g Silver Bar",
        "20g Silver Bar",
        "50g Silver Bar",
        "100g Silver Bar",
        "250g Silver Bar",
        "500g Silver Bar",
        "1kg Silver Bar",
      ],
    ],
  ],
};

const specialMega = {
  Coins: [
    [
      "Gold Coins",
      "◎",
      "/collection/coins?metal=gold",
      [
        "50mg Gold Coins",
        "100mg Gold Coins",
        "200mg Gold Coins",
        "250mg Gold Coins",
        "500mg Gold Coins",
        "1g Gold Coins",
        "2g Gold Coins",
        "4g Gold Coins",
        "8g Gold Coins",
        "16g Gold Coins",
      ],
    ],
    [
      "Gold Bars",
      "▣",
      "/collection/coins?metal=gold",
      [
        "1g Gold Bars",
        "2g Gold Bars",
        "5g Gold Bars",
        "10g Gold Bars",
        "20g Gold Bars",
        "50g Gold Bars",
        "100g Gold Bars",
        "500g Gold Bars",
      ],
    ],
    [
      "Silver Coins",
      "◎",
      "/collection/coins?metal=silver",
      [
        "250mg Silver Coins",
        "500mg Silver Coins",
        "1g Silver Coins",
        "2g Silver Coins",
        "5g Silver Coins",
        "10g Silver Coins",
        "20g Silver Coins",
        "50g Silver Coins",
        "100g Silver Coins",
      ],
    ],
    [
      "Silver Bars",
      "▣",
      "/collection/coins?metal=silver",
      [
        "10g Silver Bars",
        "20g Silver Bars",
        "50g Silver Bars",
        "100g Silver Bars",
        "250g Silver Bars",
        "500g Silver Bars",
        "1kg Silver Bars",
        "5kg Silver Bars",
      ],
    ],
    [
      "Collectible Coins",
      "◎",
      "/collection/coins",
      [
        "Lakshmi Coins",
        "Ganesha Coins",
        "Krishna Coins",
        "Rama Coins",
        "Hanuman Coins",
        "Swami Coins",
        "Religious Coins",
        "Limited Edition Coins",
      ],
    ],
    [
      "Festival Coins",
      "◉",
      "/collection/coins?occasion=Festival",
      [
        "Diwali Coins",
        "Dhanteras Coins",
        "Akshaya Tritiya Coins",
        "Navratri Coins",
        "Pongal Coins",
        "Ganesh Chaturthi Coins",
        "Birthday Coins",
      ],
    ],
    [
      "Gift Coins",
      "□",
      "/collection/gifting",
      [
        "Baby Gift Coins",
        "Wedding Gift Coins",
        "Anniversary Coins",
        "Corporate Gift Coins",
        "Return Gift Coins",
        "Naming Ceremony Coins",
        "Housewarming Coins",
      ],
    ],
    [
      "Investment Coins",
      "↗",
      "/collection/coins?search=investment",
      [
        "Low Premium Coins",
        "High Resale Coins",
        "Popular Investment Coins",
        "Certified Investment Coins",
      ],
    ],
  ],
  Wedding: [
    [
      "Mangalsutra",
      "♧",
      "/collection/all?wedding=true&category=mangalsutra",
      [
        "Traditional Mangalsutra",
        "Beaded Mangalsutra",
        "Pendant Mangalsutra",
        "Short Mangalsutra",
        "Gold Mangalsutra",
        "Black Bead Mangalsutra",
        "Mangalsutra Sets",
      ],
    ],
    [
      "Bridal Rings",
      "◌",
      "/collection/all?wedding=true&category=rings",
      [
        "Engagement Rings",
        "Wedding Rings",
        "Kundan Rings",
        "Temple Rings",
        "Couple Rings",
        "Antique Rings",
        "Polki Rings",
      ],
    ],
    [
      "Bridal Earrings",
      "♢",
      "/collection/all?wedding=true&category=earrings",
      [
        "Jhumka Earrings",
        "Kundan Earrings",
        "Temple Earrings",
        "Chandbali Earrings",
        "Polki Earrings",
        "Long Earrings",
        "Stud Earrings",
        "Drop Earrings",
      ],
    ],
    [
      "Bridal Necklaces",
      "♧",
      "/collection/all?wedding=true&category=necklaces",
      [
        "Temple Necklaces",
        "Kundan Necklaces",
        "Antique Necklaces",
        "Polki Necklaces",
        "Traditional Necklaces",
        "Long Haaram",
        "Choker Necklaces",
        "Rani Haar",
      ],
    ],
    [
      "Bridal Bangles",
      "◯",
      "/collection/all?wedding=true&category=bangles",
      [
        "Gold Bangles",
        "Kundan Bangles",
        "Antique Bangles",
        "Polki Bangles",
        "Kada Bangles",
        "Temple Bangles",
        "Designer Bangles",
        "Bangle Sets",
      ],
    ],
    [
      "Bridal Sets",
      "♕",
      "/collection/all?wedding=true",
      [
        "Necklace Sets",
        "Earring Sets",
        "Bangle Sets",
        "Complete Bridal Sets",
        "Kundan Sets",
        "Temple Sets",
        "Polki Sets",
        "Antique Sets",
      ],
    ],
    [
      "Maang Tikka",
      "♙",
      "/collection/all?wedding=true&search=maang",
      [
        "Kundan Maang Tikka",
        "Polki Maang Tikka",
        "Temple Maang Tikka",
        "Antique Maang Tikka",
        "Pearl Maang Tikka",
      ],
    ],
    [
      "Groom Jewellery",
      "♔",
      "/collection/all?wedding=true&gender=men",
      [
        "Chains for Men",
        "Bracelets for Men",
        "Rings for Men",
        "Pendants for Men",
        "Cufflinks",
        "Brooches",
      ],
    ],
  ],
  Gifting: [
    [
      "Gifts For Her",
      "□",
      "/collection/gifting?gift_tag=Her",
      [
        "Necklaces",
        "Earrings",
        "Rings",
        "Bracelets",
        "Pendants",
        "Bangles",
        "Mangalsutra",
        "Nose Pins",
      ],
    ],
    [
      "Gifts For Him",
      "♙",
      "/collection/gifting?gift_tag=Him",
      [
        "Chains",
        "Bracelets",
        "Rings",
        "Pendants",
        "Cufflinks",
        "Tie Pins",
        "Men's Kada",
        "Coins & Bars",
      ],
    ],
    [
      "Gifts For Kids",
      "☻",
      "/collection/gifting?gift_tag=Kids",
      [
        "Baby Jewellery",
        "Chains",
        "Earrings",
        "Bracelets",
        "Nazariya",
        "Anklets",
        "Pendants",
        "ID Bracelets",
      ],
    ],
    [
      "Gifts For Couple",
      "♡",
      "/collection/gifting?gift_tag=Couple",
      [
        "Couple Rings",
        "Couple Pendants",
        "Matching Bracelets",
        "His & Her Sets",
        "Engagement Gifts",
        "Anniversary Gifts",
        "Personalised Gifts",
      ],
    ],
    [
      "Gifts For Parents",
      "♚",
      "/collection/gifting?gift_tag=Parents",
      [
        "Gold Coins",
        "Religious Pendants",
        "Chains",
        "Bracelets",
        "Rings",
        "Pooja Articles",
        "Silver Articles",
        "Health Pendants",
      ],
    ],
    [
      "Occasion Gifts",
      "▣",
      "/collection/gifting?gift_tag=Occasion",
      [
        "Birthday Gifts",
        "Anniversary Gifts",
        "Wedding Gifts",
        "Housewarming Gifts",
        "Festive Gifts",
        "Graduation Gifts",
        "Promotion Gifts",
        "Baby Shower Gifts",
      ],
    ],
    [
      "Corporate Gifts",
      "▤",
      "/collection/gifting?gift_tag=Corporate",
      [
        "Gold Coins",
        "Silver Coins",
        "Desk Accessories",
        "Pen Sets",
        "Customized Coins",
        "Mementos",
        "Trophies",
        "Premium Sets",
      ],
    ],
    [
      "Religious Gifts",
      "♙",
      "/collection/gifting?gift_tag=Religious",
      [
        "Gold Idols",
        "Silver Idols",
        "Pooja Items",
        "Religious Pendants",
        "Yantra Pendants",
        "Mala & Chains",
        "Temple Jewellery",
        "Spiritual Coins",
      ],
    ],
  ],
};

// ── FIXED: Gold/Silver category links (Rings/Earrings/Bangles/Pendants/
// Chains/Necklaces/Mangalsutra/Anklets/Bracelets) now use ?subcategory=
// instead of ?search= so AllCollection.jsx's accordion highlight + scroll
// sections actually pick them up. Non-category routes (Gold Coins, Silver
// Articles etc) keep using ?search= — untouched, so they don't break. ──
const buildSections = (list, useSubcategoryParam = false) =>
  list.map(([title, icon, route, links]) => {
    const applySubParam =
      useSubcategoryParam &&
      route.includes("/collection/all") &&
      route.includes("category=");
    return {
      title,
      icon,
      viewAll: [
        `View All ${title.replace(/^Gold |^Diamond |^Platinum |^Silver /, "")}`,
        route,
      ],
      links: links.map((label) => [
        label,
        `${route}${route.includes("?") ? "&" : "?"}${applySubParam ? "subcategory" : "search"}=${encodeURIComponent(label)}`,
      ]),
    };
  });

// Gifting mega-menu mattum thani logic — search= illa, gift_type= param
// use pannும் (namba gift_tags/gift_subcategory backend fields ku matching).
const buildGiftingSections = (list) =>
  list.map(([title, icon, route, links]) => ({
    title,
    icon,
    viewAll: [`View All ${title}`, route],
    links: links.map((label) => [
      label,
      `${route}&gift_type=${encodeURIComponent(label)}`,
    ]),
  }));

const megaByLabel = {
  "All Jewellery": allJewelleryMega,
  Gold: buildSections(metalMega.Gold, true),
  Silver: buildSections(metalMega.Silver, true),
  Coins: buildSections(specialMega.Coins),
  Wedding: buildSections(specialMega.Wedding),
  Gifting: buildGiftingSections(specialMega.Gifting),
};

const megaIconFor = (title) => {
  if (title.includes("Gold")) return "G";
  if (title.includes("Diamond")) return "D";
  if (title.includes("Platinum")) return "P";
  if (title.includes("Silver")) return "S";
  if (title.includes("Coin")) return "C";
  if (title.includes("Wedding") || title.includes("Bridal")) return "W";
  if (title.includes("Gift")) return "G";
  if (title.includes("Mangalsutra")) return "M";
  return title.charAt(0);
};

const ROLE_SWITCH_LABELS = {
  promotor: { label: "Retailer", path: "/promotor" },
  sub_dealer: { label: "Wholesale Dealer", path: "/sub-dealer" },
  dealer: { label: "Distributor", path: "/dealer" },
  admin: { label: "Super Stockist", path: "/admin" },
};

function AugMenuCoin() {
  return <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="14" fill="#f5ca55" stroke="#b98421" strokeWidth="1.2" />
    <circle cx="16" cy="16" r="11.5" fill="#eeb83f" stroke="#fff0ac" strokeWidth="1.2" />
    <circle cx="16" cy="16" r="9.5" fill="none" stroke="#c68e24" strokeWidth=".7" strokeDasharray="1 1.5" />
    <path d="M8 9a11 11 0 0 1 14-2" fill="none" stroke="#fff6c9" strokeWidth="1.5" strokeLinecap="round" />
    <text x="16" y="19" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="8" fontWeight="800" fill="#69450c">AUG</text>
  </svg>;
}

function MobileCategoryIcon({ label }) {
  const artwork = {
    'All Jewellery': <><path d="M6 7c0 8 3 14 10 14S26 15 26 7" /><path d="m12 17 4-4 4 4-4 6z" fill="currentColor" fillOpacity=".18" /><circle cx="6" cy="7" r="2" /><circle cx="26" cy="7" r="2" /><path d="m10 13 2 2m10-2-2 2" /></>,
    Gold: <><ellipse cx="16" cy="21" rx="9" ry="8" /><path d="m10 9 3-4h6l3 4-6 7z" fill="currentColor" fillOpacity=".2" /><path d="M10 9h12m-9-4 3 11 3-11" /></>,
    Silver: <><path d="M7 7c-1 3-1 6 0 9 2 7 16 8 18-1 1-3 1-5-1-8" /><path d="M7 8c4 4 13 4 17 0M9 18l-1 4m7-1v5m7-8 2 4" /><circle cx="8" cy="24" r="2" fill="currentColor" fillOpacity=".18" /><circle cx="15" cy="28" r="2" fill="currentColor" fillOpacity=".18" /><circle cx="25" cy="24" r="2" fill="currentColor" fillOpacity=".18" /></>,
    Coins: <><ellipse cx="12" cy="10" rx="8" ry="4" fill="currentColor" fillOpacity=".18" /><path d="M4 10v6c0 5 16 5 16 0v-6M4 15c3 4 13 4 16 0" /><circle cx="23" cy="21" r="7" fill="var(--category-surface)" /><path d="M23 17v8m-2-6h4m-4 3h4" /></>,
    Offers: <><path d="M5 6h12l10 10-11 11L5 16z" fill="currentColor" fillOpacity=".1" /><circle cx="10" cy="11" r="1.5" /><path d="m15 13 5 8" /><circle cx="20" cy="15" r="1.5" /><circle cx="15" cy="21" r="1.5" /></>,
    'Team369-Live': <><rect x="4" y="8" width="24" height="18" rx="5" fill="currentColor" fillOpacity=".1" /><path d="m13 13 8 5-8 5z" fill="currentColor" stroke="none" /><path d="M11 4h10" /></>,
    Wedding: <><circle cx="11" cy="21" r="7" /><circle cx="22" cy="18" r="7" /><path d="m7 11 4-5 4 5-4 4zm11-3 4-5 4 5-4 4z" fill="currentColor" fillOpacity=".18" /></>,
    Gifting: <><rect x="6" y="15" width="21" height="13" rx="2" fill="currentColor" fillOpacity=".1" /><rect x="4" y="10" width="25" height="6" rx="2" /><path d="M16 10v18m0-18c-8 0-10-7-5-7 3 0 5 7 5 7zm0 0c8 0 10-7 5-7-3 0-5 7-5 7z" /></>,
    'Nearby Shop': <><path d="M5 13v15h22V13M3 12l4-8h18l4 8" /><path d="M3 12c0 5 7 5 7 0 0 5 6 5 6 0 0 5 6 5 6 0 0 5 7 5 7 0" fill="currentColor" fillOpacity=".12" /><path d="M13 28v-9h7v9m-10-9H8" /></>,
  };
  return <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{artwork[label] || artwork['All Jewellery']}</svg>;
}

export default function CustomerNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const navbarRef = useRef(null);
  const navbarSpacerRef = useRef(null);
  useLayoutEffect(() => {
    const header = navbarRef.current;
    const spacer = navbarSpacerRef.current;
    if (!header || !spacer) return;
    const measure = () => {
      const height = `${Math.ceil(header.getBoundingClientRect().height)}px`;
      if (spacer.style.height !== height) spacer.style.setProperty('height', height, 'important');
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(header);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  const role = localStorage.getItem("role");
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  // AUG Revive pill, coin-shop icon, and the menu drawer are hidden for
  // guests (not logged in) on any page — they show up as soon as the
  // person logs in, regardless of which route they're on.
  const isLandingPage = !isLoggedIn;
  const roleSwitchCfg = ROLE_SWITCH_LABELS[role];
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [rates, setRates] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);

  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("ready"); // 'ready' | 'listening' | 'processing' | 'error'
  const [voiceErrorMsg, setVoiceErrorMsg] = useState("");
  const [voiceVolume, setVoiceVolume] = useState(0);
  const audioContextRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioAnimFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const [ratesOpen, setRatesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    mobileMenuRef.current?.querySelector('.mobile-menu-close')?.focus({ preventScroll: true });
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); setMobileOpen(false); }
      if (event.key === 'Tab') {
        const controls = [...(mobileMenuRef.current?.querySelectorAll('button:not(:disabled), a[href]') || [])].filter(element => element.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const resize = () => { if (window.matchMedia('(min-width:1181px)').matches) setMobileOpen(false); };
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', resize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', resize);
      if (opener?.isConnected && (document.activeElement === document.body || mobileMenuRef.current?.contains(document.activeElement))) opener.focus({ preventScroll: true });
    };
  }, [mobileOpen]);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const roleDrawerRef = useRef(null);
  useEffect(() => {
    if (!roleDrawerOpen) return;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    roleDrawerRef.current?.querySelector('.role-drawer-close')?.focus({ preventScroll: true });
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); setRoleDrawerOpen(false); }
      if (event.key === 'Tab') {
        const controls = [...(roleDrawerRef.current?.querySelectorAll('button:not(:disabled), a[href]') || [])].filter(element => element.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [roleDrawerOpen]);
  const [activeMega, setActiveMega] = useState(null);
  const megaRefs = useRef({});
  const megaHoverTimer = useRef(null);
  const megaCloseTimer = useRef(null);
  const cancelMegaTimers = () => {
    clearTimeout(megaHoverTimer.current);
    clearTimeout(megaCloseTimer.current);
  };
  const closeMega = () => { cancelMegaTimers(); setActiveMega(null); };
  const scheduleCloseMega = () => {
    cancelMegaTimers();
    megaCloseTimer.current = setTimeout(() => setActiveMega(null), 180);
  };
  const openMegaAfterHover = (label) => {
    cancelMegaTimers();
    if (!label) { setActiveMega(null); return; }
    if (activeMega === label) return;
    megaHoverTimer.current = setTimeout(() => setActiveMega(label), activeMega ? 140 : 250);
  };
  useEffect(() => () => {
    clearTimeout(megaHoverTimer.current);
    clearTimeout(megaCloseTimer.current);
  }, []);
  useEffect(() => {
    clearTimeout(megaHoverTimer.current);
    clearTimeout(megaCloseTimer.current);
    setActiveMega(null);
  }, [location.pathname, location.search]);
  useEffect(() => {
    const panel = megaRefs.current[activeMega];
    if (!panel) return;
    let frame;
    const update = () => {
      frame = undefined;
      panel.querySelectorAll('.exact-mega-links').forEach(list => {
        list.parentElement.dataset.moreAbove = String(list.scrollTop > 2);
        list.parentElement.dataset.moreBelow = String(list.scrollHeight - list.clientHeight - list.scrollTop > 2);
      });
      const left = panel.parentElement.querySelector('.exact-mega-scroll-btn.left');
      const right = panel.parentElement.querySelector('.exact-mega-scroll-btn.right');
      if (left) left.disabled = panel.scrollLeft <= 2;
      if (right) right.disabled = panel.scrollWidth - panel.clientWidth - panel.scrollLeft <= 2;
    };
    const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(update); };
    update();
    panel.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    observer?.observe(panel);
    panel.querySelectorAll('.exact-mega-links, .exact-mega-link').forEach(element => observer?.observe(element));
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      panel.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, [activeMega]);
  const recognitionRef = useRef(null);
  const [loginDropOpen, setLoginDropOpen] = useState(false);
  const loginHideTimerRef = useRef(null);
  // Flipkart-style compact mobile/tablet header — only for the 3 pages the
  // user asked for; desktop and every other page keep the full navbar as-is.
  // Exact match only — "/collection/all/filter" is its own dedicated
  // full-page view with its own back header, so it's deliberately excluded.
  const isCompactRoute = ["/collection/all", "/collection/coins", "/product-display"].includes(location.pathname);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchScreenRef = useRef(null);
  const searchOpenerRef = useRef(null);
  const restoringSearchFocus = useRef(false);
  const openSearchScreen = () => {
    searchOpenerRef.current = document.activeElement;
    setShowSearchDrop(false);
    closeMega();
    setMobileOpen(false);
    setRoleDrawerOpen(false);
    setMobileSearchOpen(true);
  };
  const closeSearchScreen = () => {
    setMobileSearchOpen(false);
    requestAnimationFrame(() => { restoringSearchFocus.current = true; searchOpenerRef.current?.focus({ preventScroll: true }); restoringSearchFocus.current = false; });
  };
  useEffect(() => {
    if (!mobileSearchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = event => {
      if (showVoiceModal) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileSearchOpen(false);
        requestAnimationFrame(() => { restoringSearchFocus.current = true; searchOpenerRef.current?.focus({ preventScroll: true }); restoringSearchFocus.current = false; });
      }
      if (event.key === 'Tab') {
        const controls = [...(searchScreenRef.current?.querySelectorAll('button:not(:disabled), input, a[href]') || [])].filter(element => element.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const handleResize = () => { if (window.matchMedia('(min-width: 1181px)').matches) setMobileSearchOpen(false); };
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileSearchOpen, showVoiceModal]);
  useEffect(() => { setMobileSearchOpen(false); }, [location.pathname, location.search]);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bb_recent_searches") || "[]");
    } catch {
      return [];
    }
  });
  const saveRecentSearch = (query) => {
    setRecentSearches(prev => {
      const next = [query, ...prev.filter(q => q.toLowerCase() !== query.toLowerCase())].slice(0, 8);
      try { localStorage.setItem("bb_recent_searches", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const removeRecentSearch = (query) => {
    setRecentSearches(prev => {
      const next = prev.filter(q => q !== query);
      try { localStorage.setItem("bb_recent_searches", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const openLoginDrop = () => {
    if (loginHideTimerRef.current) {
      clearTimeout(loginHideTimerRef.current);
      loginHideTimerRef.current = null;
    }
    setLoginDropOpen(true);
  };
  const scheduleCloseLoginDrop = () => {
    if (loginHideTimerRef.current) clearTimeout(loginHideTimerRef.current);
    loginHideTimerRef.current = setTimeout(() => setLoginDropOpen(false), 2000);
  };
  useEffect(() => () => {
    if (loginHideTimerRef.current) clearTimeout(loginHideTimerRef.current);
  }, []);
  const goLogin = () => navigate("/login");

  const requireLogin = (route) => {
    if (!isLoggedIn) {
      navigate(route ? `/register?redirect=${encodeURIComponent(route)}` : "/register");
      return;
    }
    navigate(route);
  };

  const scrollMega = (label, dir) => {
    const el = megaRefs.current[label];
    if (el) el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  useEffect(() => {
    const updateCount = async () => {
      if (!localStorage.getItem("token")) {
        setCartCount(0);
        return;
      }
      setCartCount(await getCartCountDB());
    };
    updateCount();
    window.addEventListener("bb_cart_update", updateCount);
    return () => window.removeEventListener("bb_cart_update", updateCount);
  }, []);

  useEffect(() => {
    const updateWishCount = async () => {
      if (!localStorage.getItem("token")) {
        setWishlistCount(0);
        return;
      }
      try {
        const res = await api.get("/wishlist/");
        setWishlistCount(res.data.count || 0);
      } catch {
        setWishlistCount(0);
      }
    };
    updateWishCount();
    window.addEventListener("bb_wishlist_update", updateWishCount);
    return () =>
      window.removeEventListener("bb_wishlist_update", updateWishCount);
  }, []);

  useEffect(() => {
    api
      .get("/metal-rates/")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        setRates(data || null);
      })
      .catch(() => setRates(null));
  }, []);

  // ── GOOGLE / YOUTUBE SMART TAMIL & ENGLISH VOICE INTELLIGENCE MAP ──
  const SMART_VOICE_KEYWORD_MAP = [
    { keywords: ['தங்க வளையல்', 'வளையல்', 'valayal', 'valaiyal', 'bangle', 'bangles', 'gold bangle', 'gold bangles', 'bracelets', 'காப்பு', 'kaapu'], query: 'bangles' },
    { keywords: ['தங்க நெக்லஸ்', 'நெக்லஸ்', 'necklace', 'necklaces', 'gold necklace', 'choker', 'சோக்கர்'], query: 'necklaces' },
    { keywords: ['தங்க ஆரம்', 'ஹாரம்', 'ஆரம்', 'haram', 'long haram', 'bridal haram', 'kasu malai', 'காசு மாலை', 'மாலை'], query: 'haram' },
    { keywords: ['தங்க செயின்', 'செயின்', 'chain', 'chains', 'gold chain', 'thali chain', 'தாலி செயின்'], query: 'chains' },
    { keywords: ['மங்களசூத்திரம்', 'தாலி', 'mangalsutra', 'thali', 'thaali', 'mangalyam'], query: 'mangalsutra' },
    { keywords: ['தங்க நாணயம்', 'நாணயம்', 'gold coin', 'gold coins', 'coin', 'coins', 'kaasu', 'காசு'], query: 'gold coin' },
    { keywords: ['வெள்ளி நாணயம்', 'silver coin', 'silver coins'], query: 'silver coin' },
    { keywords: ['தங்க மோதிரம்', 'மோதிரம்', 'mothiram', 'ring', 'rings', 'gold ring', 'diamond ring', 'couple ring'], query: 'rings' },
    { keywords: ['கம்மல்', 'ஜிமிக்கி', 'jhumka', 'jimiki', 'kammal', 'earring', 'earrings', 'studs', 'தோடுகள்'], query: 'earrings' },
    { keywords: ['வெள்ளி கொலுசு', 'கொலுசு', 'kolusu', 'anklet', 'anklets', 'silver anklets', 'paayal'], query: 'silver anklets' },
    { keywords: ['வெள்ளி விளக்கு', 'விளக்கு', 'vilakku', 'silver lamp', 'pooja', 'silver pooja', 'silver articles', 'வெள்ளி பாத்திரம்'], query: 'silver' },
    { keywords: ['பெண்டன்ட்', 'டாலர்', 'dollar', 'pendant', 'pendants', 'locket'], query: 'pendants' },
    { keywords: ['பிரேஸ்லெட்', 'bracelet', 'bracelets', 'hand chain'], query: 'bracelets' },
    { keywords: ['தங்கம்', 'gold', '22k', '24k', 'pure gold'], query: 'gold' },
    { keywords: ['வெள்ளி', 'silver', '925 silver'], query: 'silver' },
    { keywords: ['வைரம்', 'diamond', 'diamonds'], query: 'diamond' },
    { keywords: ['பிளாட்டினம்', 'platinum'], query: 'platinum' }
  ];

  // ── GOOGLE / YOUTUBE SYNTH AUDIO CHIME ──
  const playVoiceChime = (type = 'start') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // safely ignored if blocked by autoplay policy
    }
  };

  const stopAudioAnalyser = () => {
    if (audioAnimFrameRef.current) {
      cancelAnimationFrame(audioAnimFrameRef.current);
      audioAnimFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setVoiceVolume(0);
  };

  const stopVoiceRecognition = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    stopAudioAnalyser();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    setVoiceListening(false);
  };

  const handleCloseVoiceModal = () => {
    stopVoiceRecognition();
    setShowVoiceModal(false);
    setVoiceInterim("");
    setVoiceStatus("ready");
    setVoiceErrorMsg("");
  };

  const executeVoiceSearch = (rawText) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    const text = (rawText || "").trim();
    if (!text) return;

    setVoiceStatus('processing');
    playVoiceChime('success');
    stopAudioAnalyser();

    let mappedQuery = text;
    const lowerFinal = text.toLowerCase();
    for (const item of SMART_VOICE_KEYWORD_MAP) {
      if (item.keywords.some((kw) => lowerFinal.includes(kw.toLowerCase()))) {
        mappedQuery = item.query;
        break;
      }
    }

    setTimeout(() => {
      setShowVoiceModal(false);
      setVoiceListening(false);
      setSearchQuery(mappedQuery);
      submitSearch(mappedQuery);
    }, 450);
  };

  const startVoiceModal = () => {
    setShowVoiceModal(true);
    setVoiceInterim("");
    setVoiceErrorMsg("");
    setVoiceStatus("listening");
    startSpeechRecognition();
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setVoiceStatus('error');
      setVoiceErrorMsg('Voice search is not supported in this browser. Please use Chrome, Edge or Safari.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    playVoiceChime('start');

    // Real-time audio volume visualizer (Google / YouTube grade)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        audioStreamRef.current = stream;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setVoiceVolume(Math.min(100, Math.round((avg / 128) * 100)));
            audioAnimFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      }).catch(() => {
        // Fallback: graceful silent fallback
      });
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setVoiceListening(true);
      setVoiceStatus('listening');
      setVoiceErrorMsg('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const currentText = (finalTranscript || interim).trim();
      setVoiceInterim(currentText);

      if (finalTranscript) {
        executeVoiceSearch(finalTranscript);
      } else if (interim && interim.trim().length > 1) {
        // Google / YouTube intelligent auto-submit after speech pause
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          executeVoiceSearch(interim);
        }, 1250);
      }
    };

    recognition.onerror = (event) => {
      stopAudioAnalyser();
      setVoiceListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceStatus('error');
        setVoiceErrorMsg('Microphone access blocked. Click the lock/site settings icon in your address bar and allow microphone access.');
      } else if (event.error === 'no-speech') {
        setVoiceStatus('error');
        setVoiceErrorMsg('No speech detected. Tap microphone and speak again.');
      } else {
        setVoiceStatus('error');
        setVoiceErrorMsg(`Voice error (${event.error}). Please try again.`);
      }
    };

    recognition.onend = () => {
      stopAudioAnalyser();
      setVoiceListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setVoiceStatus('error');
      setVoiceErrorMsg('Failed to initialize microphone. Please check permissions.');
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
    }
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioAnimFrameRef.current) cancelAnimationFrame(audioAnimFrameRef.current);
      if (audioStreamRef.current) {
        try { audioStreamRef.current.getTracks().forEach((track) => track.stop()); } catch {}
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    setSearchResults([]);
    if (query.length < 2 || (!mobileSearchOpen && !showSearchDrop)) { setSearchLoading(false); return; }
    let active = true;
    const controller = new AbortController();
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/jewelry-products/?search=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!active) return;
        const results = Array.isArray(res.data) ? res.data : res.data.results || [];
        setSearchResults(results.filter(product => product.metal !== 'diamond' && product.metal !== 'platinum').slice(0, 6));
      } catch { if (active) setSearchResults([]); }
      finally { if (active) setSearchLoading(false); }
    }, 260);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [searchQuery, mobileSearchOpen, showSearchDrop]);

  const submitSearch = (queryOverride) => {
    const query = (queryOverride ?? searchQuery).trim();
    if (!query) return;
    setShowSearchDrop(false);
    setMobileSearchOpen(false);
    saveRecentSearch(query);
    navigate(`/collection/all?search=${encodeURIComponent(query)}`);
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <style>{`
        .exact-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          background: var(--bb-bg);
          color: var(--bb-ink);
          box-shadow: 0 8px 28px rgba(7,59,63,0.08);
        }

        .exact-nav-spacer {
          height: 176px;
        }

        .exact-strip {
          height: 38px;
          background: var(--bb-soft-aqua);
          color: var(--bb-teal-dark);
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.03em;
          overflow: hidden;
          border-bottom: 1px solid rgba(7,59,63,0.06);
        }

        .exact-strip-track {
          display: flex;
          align-items: center;
          height: 100%;
          width: max-content;
          animation: marquee-scroll 28s linear infinite;
        }

        .exact-strip:hover .exact-strip-track {
          animation-play-state: paused;
        }

        .exact-strip-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          padding: 0 48px;
        }

        .exact-strip-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--bb-teal-dark);
          opacity: 0.4;
          flex-shrink: 0;
        }

        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .exact-inner {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding-left: clamp(24px, 3.5vw, 60px);
          padding-right: clamp(24px, 3.5vw, 60px);
        }

        .exact-main {
          position: relative;
          z-index: 4;
          height: 90px;
          border-bottom: 1px solid rgba(7,59,63,0.07);
          background: var(--bb-bg);
        }

        .exact-main .exact-inner {
          height: 100%;
          display: grid;
          grid-template-columns: auto 1fr auto auto auto;
          gap: clamp(12px, 1.8vw, 24px);
          align-items: center;
        }

        .team-brand {
          border: 0;
          background: transparent;
          display: inline-flex;
          align-items: center;
          gap: 0;
          cursor: pointer;
          color: var(--bb-ruby);
          min-width: 0;
          padding: 0;
        }

        .team-mark-frame {
          width: auto;
          height: 82px;
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          overflow: visible;
          flex: 0 0 auto;
        }

        .team-mark {
          width: auto;
          height: 80px;
          border-radius: 0;
          object-fit: contain;
          display: block;
          background: transparent;
          box-shadow: none;
          flex: 0 0 auto;
        }

        .team-brand strong {
          display: none;
        }

        .exact-search-wrap {
          position: relative;
          z-index: 10020;
          width: 100%;
          min-width: 0;
        }

        .exact-digi-gold-btn {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          height: 46px;
          padding: 0 9px 0 7px;
          border-radius: 999px;
          background: radial-gradient(ellipse at 20% 0%, #216960 0%, transparent 65%), linear-gradient(120deg, #0A4545, #062F34);
          border: 1px solid #2C6A60;
          color: #FFFFFF;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(7,62,64,.18), inset 0 1px 0 rgba(255,255,255,.14);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }

        .exact-digi-gold-btn:hover {
          transform: translateY(-2px);
          border-color: #C5A567;
          box-shadow: 0 7px 20px rgba(7,62,64,.24), 0 0 0 3px rgba(198,146,75,.1);
        }
        .exact-digi-gold-btn:active { transform: translateY(0); }
        .exact-digi-gold-btn:focus-visible { outline: 3px solid #073E40; outline-offset: 3px; }
        .exact-digi-gold-btn::before { content: ''; position: absolute; inset: -30% auto -30% -60%; width: 35%; background: linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent); transform: skewX(-20deg); transition: left 550ms ease; pointer-events: none; }
        .exact-digi-gold-btn:hover::before { left: 130%; }

        .exact-digi-gold-coin {
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 25%,#FFF0B9,#E4BA69 58%,#B88535);
          color: #72501B;
          border: 1px solid #F1D494;
          box-shadow: 0 2px 5px rgba(0,0,0,.14), inset 0 0 0 3px rgba(255,246,205,.38);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .exact-digi-gold-label {
          letter-spacing: .01em;
          font-size: 14px;
          font-weight: 800;
        }
        .exact-digi-gold-coin,
        .mobile-digi-gold .mobile-service-icon { overflow: hidden; background: transparent; border: 0; box-shadow: none; }
        .exact-digi-gold-coin img,
        .mobile-digi-gold .mobile-service-icon img { width: 100%; height: 100%; object-fit: contain; display: block; transform: scale(1.28); filter: drop-shadow(0 2px 2px rgba(0,0,0,.18)); }
        .exact-digi-gold-mobile { display: none; }
        .exact-digi-gold-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; line-height: 1; }
        .exact-digi-gold-subtitle { font-size: 10px; color: #BCD4C9; font-weight: 500; letter-spacing: .03em; }
        .exact-digi-gold-arrow { display: grid; place-items: center; width: 25px; height: 25px; color: #E9C887; background: rgba(255,255,255,.06); border: 1px solid rgba(233,200,135,.22); border-radius: 50%; margin-left: 2px; }
        .exact-digi-gold-arrow svg { transition: transform 180ms ease; }
        .exact-digi-gold-btn:hover .exact-digi-gold-arrow svg { transform: translateX(2px); }
        .mobile-service-item.mobile-digi-gold { background: linear-gradient(110deg,#14564F,#07383D); border: 1px solid #2C6A60; border-radius: 16px; margin: 8px 0; padding: 13px 14px; box-shadow: 0 4px 12px rgba(7,62,64,.12); }
        .mobile-digi-gold .mobile-service-label { color: #fff; }
        .mobile-digi-gold .mobile-service-icon { background: transparent; border: 0; border-radius: 50%; }
        @media (prefers-reduced-motion: reduce) { .exact-digi-gold-btn, .exact-digi-gold-btn::before { transition: none; } .exact-digi-gold-btn:hover { transform: none; } }

        .exact-search {
          height: 46px;
          border-radius: 999px;
          border: 1.5px solid var(--bb-soft-aqua);
          background: #f9fafa;
          display: grid;
          grid-template-columns: 46px 1fr 46px;
          align-items: center;
          color: var(--bb-muted);
          box-shadow: 0 2px 8px rgba(7,59,63,0.06);
          transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .exact-search:focus-within {
          border-color: var(--bb-teal);
          background: #fff;
          box-shadow: 0 4px 20px rgba(7,59,63,0.14);
        }

        .exact-search input {
          width: 100%;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--bb-ink);
          font-size: 14.5px;
          padding-right: 8px;
        }

        .exact-search input::placeholder {
          color: var(--bb-muted);
          font-size: 14px;
        }

        .exact-search svg {
          margin: 0 auto;
          color: var(--bb-teal-dark);
        }

        .exact-voice-btn {
          width: 36px;
          height: 36px;
          margin-right: 5px;
          border: 1.5px solid #D1DFDE;
          border-radius: 999px;
          background: #FFFFFF;
          color: #073B3F;
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(7, 59, 63, 0.06);
          transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .exact-voice-btn:hover {
          background: #F4F8F7;
          border-color: #073B3F;
          color: #073B3F;
          transform: scale(1.06);
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.16);
        }

        .exact-voice-btn.is-listening {
          background: linear-gradient(135deg, #E11D48, #BE123C);
          color: #FFFFFF;
          border-color: #E11D48;
          box-shadow: 0 0 0 6px rgba(225, 29, 72, 0.18);
          animation: voice-pulse 900ms ease-in-out infinite alternate;
        }

        .exact-voice-btn:disabled {
          cursor: not-allowed;
          opacity: 0.45;
          transform: none;
          box-shadow: none;
        }

        @keyframes voice-pulse {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }

        /* ── YOUTUBE / GOOGLE ULTRA-POWERFUL VOICE SEARCH MODAL ── */
        .cn-voice-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 25, 30, 0.68);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 100050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: cnVoiceFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes cnVoiceFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .cn-voice-card {
          background: #FFFFFF;
          border-radius: 28px;
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(7, 59, 63, 0.08);
          width: 100%;
          max-width: 400px;
          padding: 24px 24px 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          position: relative;
          animation: cnVoiceSlideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes cnVoiceSlideUp {
          from { transform: translateY(22px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .cn-voice-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cn-voice-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(234, 67, 53, 0.08);
          color: #EA4335;
          border: 1px solid rgba(234, 67, 53, 0.22);
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .cn-voice-badge.is-processing {
          background: rgba(5, 150, 105, 0.08);
          color: #059669;
          border-color: rgba(5, 150, 105, 0.22);
        }

        .cn-voice-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #EA4335;
          box-shadow: 0 0 0 3px rgba(234, 67, 53, 0.25);
          animation: cnBadgePulse 1.4s infinite;
        }
        .cn-voice-badge.is-processing .cn-voice-badge-dot {
          background: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.25);
        }
        @keyframes cnBadgePulse {
          0% { box-shadow: 0 0 0 0 rgba(234, 67, 53, 0.6); }
          70% { box-shadow: 0 0 0 6px rgba(234, 67, 53, 0); }
          100% { box-shadow: 0 0 0 0 rgba(234, 67, 53, 0); }
        }

        .cn-voice-close-btn {
          width: 36px;
          height: 36px;
          background: transparent;
          border: 0;
          color: #5F6368;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.16s ease;
        }
        .cn-voice-close-btn:hover {
          background: #F1F3F4;
          color: #202124;
          transform: rotate(90deg);
        }

        .cn-voice-transcript-box {
          min-height: 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
          padding: 0 12px;
        }

        .cn-voice-transcript-active {
          font-size: 26px;
          font-weight: 800;
          color: #073B3F;
          line-height: 1.35;
          word-break: break-word;
          letter-spacing: -0.01em;
          animation: cnTextPop 0.18s ease-out;
        }
        @keyframes cnTextPop {
          from { transform: scale(0.97); opacity: 0.8; }
          to { transform: scale(1); opacity: 1; }
        }

        .cn-voice-error-text {
          font-size: 14px;
          font-weight: 600;
          color: #DC2626;
          line-height: 1.45;
          max-width: 360px;
        }

        .cn-voice-mic-wrap {
          position: relative;
          width: 130px;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 6px 0;
        }

        .cn-voice-ripple {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2.5px solid rgba(234, 67, 53, 0.4);
          animation: cnVoicePulse 2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
          pointer-events: none;
        }
        .cn-voice-ripple.ripple-2 {
          animation-delay: 0.65s;
          border-color: rgba(234, 67, 53, 0.24);
        }
        .cn-voice-ripple.ripple-3 {
          animation-delay: 1.3s;
          border-color: rgba(66, 133, 244, 0.28);
        }
        @keyframes cnVoicePulse {
          0% { transform: scale(0.9); opacity: 0.95; }
          100% { transform: scale(2.05); opacity: 0; }
        }

        .cn-voice-mic-main {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          border: 0;
          background: linear-gradient(135deg, #EA4335, #D93025);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 14px 34px rgba(234, 67, 53, 0.42);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 2;
        }
        .cn-voice-mic-main:hover {
          transform: scale(1.06);
          box-shadow: 0 18px 40px rgba(234, 67, 53, 0.52);
        }
        .cn-voice-mic-main:not(.is-active) {
          background: linear-gradient(135deg, #073B3F, #0E585E);
          box-shadow: 0 10px 28px rgba(7, 59, 63, 0.28);
        }
        .cn-voice-mic-main.is-processing {
          background: linear-gradient(135deg, #059669, #047857);
          box-shadow: 0 12px 32px rgba(5, 150, 105, 0.42);
        }

        /* Google signature 4-color dancing soundwave equalizer */
        .cn-voice-waves {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6.5px;
          height: 32px;
          margin-top: -2px;
        }
        .cn-wave-bar {
          width: 4.5px;
          border-radius: 999px;
          transition: height 0.1s ease;
          animation: cnWaveDance 0.85s ease-in-out infinite alternate;
        }
        .cn-wave-bar.bar-1 { height: 16px; background: #4285F4; animation-delay: 0s; }
        .cn-wave-bar.bar-2 { height: 28px; background: #EA4335; animation-delay: 0.18s; }
        .cn-wave-bar.bar-3 { height: 20px; background: #FBBC05; animation-delay: 0.36s; }
        .cn-wave-bar.bar-4 { height: 26px; background: #34A853; animation-delay: 0.14s; }
        .cn-wave-bar.bar-5 { height: 14px; background: #073B3F; animation-delay: 0.32s; }
        @keyframes cnWaveDance {
          0% { transform: scaleY(0.4); opacity: 0.7; }
          100% { transform: scaleY(1.4); opacity: 1; }
        }



        .exact-results {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          right: 0;
          z-index: 10030;
          border-radius: 18px;
          border: 1px solid var(--bb-soft-aqua);
          background: rgba(253,253,252,0.99);
          box-shadow: 0 26px 70px rgba(7,59,63,0.22);
          padding: 8px;
          max-height: 360px;
          overflow: auto;
        }

        .exact-result {
          width: 100%;
          border: 0;
          border-radius: 14px;
          background: transparent;
          display: grid;
          grid-template-columns: 52px 1fr;
          gap: 12px;
          padding: 9px;
          cursor: pointer;
          text-align: left;
        }

        .exact-result:hover {
          background: var(--bb-mist-aqua);
        }

        .exact-result img,
        .exact-fallback {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          object-fit: cover;
          background: var(--bb-champagne);
        }

        .exact-result strong {
          display: block;
          color: var(--bb-ink);
          font-size: 14px;
        }

        .exact-result span span {
          display: block;
          color: var(--bb-muted);
          font-size: 12px;
          margin-top: 4px;
          font-weight: 800;
        }

        .rate-pill,
        .summary-pill {
          height: 42px;
          border-radius: 999px;
          border: 1px solid var(--bb-soft-aqua);
          background: var(--bb-bg);
          color: var(--bb-teal-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(7,59,63,0.10);
        }

        .rate-dropdown-toggle:hover {
          border-color: #C5A567;
          box-shadow: 0 7px 20px rgba(7,62,64,.24), 0 0 0 3px rgba(198,146,75,.1);
          transform: translateY(-2px);
        }
        .rate-dropdown-toggle:active, .login-pill:active { transform: translateY(0); }
        .rate-dropdown-toggle:focus-visible, .login-pill:focus-visible {
          outline: 3px solid #073E40;
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .rate-dropdown-toggle, .login-pill { transition: none; }
          .rate-dropdown-toggle:hover, .login-pill:hover { transform: none; }
        }

        .rate-dropdown {
          position: relative;
          display: flex;
          align-items: center;
          justify-self: end;
          min-width: 0;
        }

                .rate-dropdown-toggle {
          height: 42px;
          border-radius: 999px;
          border: 1px solid #2C6A60;
          background: radial-gradient(ellipse at 20% 0%, #216960 0%, transparent 65%), linear-gradient(120deg, #0A4545, #062F34);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 900;
          padding: 0 16px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(7,62,64,.18), inset 0 1px 0 rgba(255,255,255,.14);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          max-width: clamp(220px, 26vw, 340px);
          min-width: 0;
          overflow: hidden;
        }

        .rate-label {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rate-dropdown-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 260px;
          border-radius: 22px;
          background: var(--bb-bg);
          border: 1px solid rgba(31, 23, 18, 0.08);
          box-shadow: 0 28px 60px rgba(31, 23, 18, 0.12);
          z-index: 20;
          overflow: hidden;
        }

        .rate-dropdown-panel::before {
          content: '';
          position: absolute;
          top: -6px;
          right: 18px;
          width: 12px;
          height: 12px;
          background: var(--bb-bg);
          transform: rotate(45deg);
          border-left: 1px solid rgba(31, 23, 18, 0.08);
          border-top: 1px solid rgba(31, 23, 18, 0.08);
        }

        .rate-item {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid rgba(31, 23, 18, 0.06);
          transition: background 150ms ease;
        }

        .rate-item:last-child {
          border-bottom: none;
        }

        .rate-item:hover {
          background: rgba(204, 168, 129, 0.16);
        }

        .rate-item-title {
          color: var(--bb-ink);
          font-weight: 800;
          font-size: 12px;
        }

        .rate-item-value {
          color: var(--bb-gold-deep);
          font-weight: 900;
          font-size: 12px;
          white-space: nowrap;
        }

        .summary-pill {
          border: 1px solid #073B3F;
          padding: 0 15px;
          cursor: pointer;
          background: rgba(255,255,255,0.7);
          color: #073B3F;
          box-shadow: none;
        }
        .login-pill {
          height: 42px;
          border-radius: 999px;
          border: 1px solid #2C6A60;
          background: radial-gradient(ellipse at 20% 0%, #216960 0%, transparent 65%), linear-gradient(120deg, #0A4545, #062F34);
          box-shadow: 0 4px 12px rgba(7,62,64,.18), inset 0 1px 0 rgba(255,255,255,.14);
          color: #fff;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .login-pill:hover {
          transform: translateY(-2px);
          border-color: #C5A567;
          box-shadow: 0 7px 20px rgba(7,62,64,.24), 0 0 0 3px rgba(198,146,75,.1);
        }

        .exact-login-popover-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .exact-login-popover {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 190px;
          background: #FFFFFF;
          border: 1px solid #D6E4E3;
          border-radius: 12px;
          box-shadow: 0 16px 40px rgba(7, 59, 63, 0.20);
          z-index: 10040;
          padding: 14px 16px;
          animation: popoverFadeIn 180ms ease;
        }

        @keyframes popoverFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-popover-arrow {
          position: absolute;
          top: -6px;
          right: 28px;
          width: 12px;
          height: 12px;
          background: #FFFFFF;
          border-left: 1px solid #D6E4E3;
          border-top: 1px solid #D6E4E3;
          transform: rotate(45deg);
        }

        .login-popover-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .login-popover-btn {
          width: 100%;
          padding: 10px 14px;
          background: #073B3F;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-weight: 800;
          font-size: 13.5px;
          cursor: pointer;
          transition: all 150ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(7, 59, 63, 0.22);
        }

        .login-popover-btn:hover {
          background: #0C4E53;
          transform: translateY(-1px);
        }

        .login-popover-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          color: #5C706E;
        }

        .login-popover-link {
          background: none;
          border: none;
          color: #073B3F;
          font-weight: 800;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }

        .exact-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          justify-self: end;
          gap: clamp(10px, 1vw, 16px);
          min-width: 0;
        }

        .exact-icon {
          position: relative;
          border: 0;
          background: transparent;
          color: var(--bb-ink);
          width: 32px;
          height: 36px;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: color 160ms ease, transform 160ms ease;
        }

        .exact-icon:hover {
          color: var(--bb-teal);
          transform: translateY(-2px);
        }

        .exact-coin-icon-btn {
          border: 0;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          width: 34px;
          height: 36px;
          position: relative;
        }

        .exact-coin-disc {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          box-shadow: 0 2px 7px rgba(181, 132, 47, 0.28);
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .exact-coin-disc:hover {
          transform: scale(1.08);
          box-shadow: 0 3px 10px rgba(181, 132, 47, 0.4);
        }

        .exact-badge {
          position: absolute;
          top: -2px;
          right: -6px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 999px;
          background: #C92035;
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 9.5px;
          font-weight: 900;
          line-height: 1;
          border: 1.5px solid #ffffff;
          box-shadow: 0 2px 5px rgba(0,0,0,0.18);
        }

        .exact-menu {
          position: relative;
          z-index: 2;
          height: 46px;
          border-bottom: 1px solid var(--bb-mist-aqua);
          background: var(--bb-bg);
        }

        .exact-menu .exact-inner {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: clamp(12px, 1.7vw, 30px);
          overflow-x: auto;
          scrollbar-width: none;
        }

        .exact-menu .exact-inner::-webkit-scrollbar { display: none; }

        .exact-menu-item {
          height: 100%;
          display: flex;
          align-items: center;
          position: static;
        }

        .exact-menu-button {
          border: 0;
          background: transparent;
          color: var(--bb-ink);
          height: 100%;
          cursor: pointer;
          font-size: clamp(12px, 0.8vw, 13px);
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
          line-height: 1;
          position: relative;
        }

        .exact-menu-button::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          border-radius: 999px;
          background: var(--bb-teal);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 180ms ease;
        }

        .exact-menu-button:hover::after,
        .exact-menu-item:hover .exact-menu-button::after {
          transform: scaleX(1);
        }

        .exact-mega {
          position: relative;
          top: unset;
          left: unset;
          right: unset;
          z-index: 9998;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: #cca881 #f3ede7;
          width: 100%;
          min-width: 0;
          height: min(43dvh, 400px);
          gap: 0;
          padding: 18px 44px 14px;
          border: 1px solid #e6ded5;
          border-top: 0;
          border-radius: 0 0 12px 12px;
          background: rgba(253,253,252,0.99);
          box-shadow: 0 24px 60px rgba(7,59,63,0.14);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px);
          pointer-events: none;
          transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
          -webkit-overflow-scrolling: touch;
          box-sizing: border-box;
        }

        .exact-mega::-webkit-scrollbar {
          height: 5px;
        }

        .exact-mega::-webkit-scrollbar-track {
          background: #f3ede7;
          border-radius: 999px;
        }

        .exact-mega::-webkit-scrollbar-thumb {
          background: #cca881;
          border-radius: 999px;
        }

        .exact-menu-item.is-open .exact-mega {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
          pointer-events: auto;
        }

        .exact-menu-item.is-open .exact-mega-wrap {
          pointer-events: auto;
        }

        .exact-mega-section {
          flex: 0 0 200px;
          min-width: max-content;
          min-height: 0;
          height: 100%;
          padding: 0 22px 0 16px;
          border-right: 1px solid #e6ded5;
          display: flex;
          flex-direction: column;
        }

        .exact-mega-links-wrap { position: relative; flex: 1; min-height: 0; }
        .exact-mega-links-wrap::before, .exact-mega-links-wrap::after {
          content: ''; position: absolute; left: 0; right: 6px; height: 24px;
          pointer-events: none; z-index: 1; opacity: 0; transition: opacity 150ms ease;
        }
        .exact-mega-links-wrap::before { top: 0; background: linear-gradient(#fdfdfc, transparent); }
        .exact-mega-links-wrap::after { bottom: 0; height: 32px; background: linear-gradient(transparent, #fdfdfc 90%); }
        .exact-mega-links-wrap[data-more-above="true"]::before,
        .exact-mega-links-wrap[data-more-below="true"]::after { opacity: 1; }
        .exact-mega-links {
          box-sizing: border-box;
          height: 100%;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: #cca881 #f3ede7;
          scrollbar-gutter: stable;
          overscroll-behavior-y: contain;
          scroll-behavior: smooth;
          padding: 0 6px 0 0;
        }

        .exact-mega-links::-webkit-scrollbar { width: 4px; }
        .exact-mega-links::-webkit-scrollbar-track { background: #f3ede7; border-radius: 999px; }
        .exact-mega-links::-webkit-scrollbar-thumb { background: #cca881; border-radius: 999px; }
        .exact-mega-title, .exact-mega-view { flex-shrink: 0; }
        .exact-mega-link:focus-visible, .exact-mega-title:focus-visible, .exact-mega-view:focus-visible {
          outline: 2px solid #b57720;
          outline-offset: -2px;
          border-radius: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .exact-mega, .exact-mega-links { scroll-behavior: auto; transition: none; }
        }

        .exact-mega-section:last-child {
          border-right: 0;
        }

        /* remove old nth-child rules — last-child handles it now */
        .exact-mega-section:nth-child(5n) {
          border-right: 1px solid #e6ded5;
        }

        .exact-mega-section:nth-child(n + 6) {
          padding-top: 0;
        }

        .exact-mega-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          color: #073B3F;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.2;
          text-decoration: none;
          cursor: pointer;
          transition: color 160ms ease;
        }

        .exact-mega-title:hover {
          color: #9F6130;
        }

        .exact-mega-title span {
          color: #b57720;
          font-family: Inter, system-ui, sans-serif;
          font-size: 24px;
          line-height: 1;
        }

        .exact-mega-link {
          border: 0;
          background: transparent;
          width: 100%;
          min-height: 30px;
          padding: 6px 8px;
          border-radius: 6px;
          line-height: 1.35;
          color: var(--bb-ink);
          display: block;
          text-align: left;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0;
          text-transform: none;
          cursor: pointer;
          transition: color 160ms ease, background 160ms ease, box-shadow 160ms ease;
        }

        .exact-mega-link:hover, .exact-mega-link:focus-visible {
          color: #073b3f;
          background: #eaf2ee;
          box-shadow: inset 2px 0 #b99059;
        }

        .exact-mega-view {
          border: 0;
          background: transparent;
          margin-top: auto;
          padding: 12px 0 0;
          min-height: 34px;
          color: #073B3F;
          display: inline-flex;
          white-space: nowrap;
          flex-wrap: nowrap;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          text-transform: none;
          letter-spacing: 0;
          cursor: pointer;
        }

        .exact-mega-view:hover {
          color: #9F6130;
        }

        .exact-mega-scroll-btn {
          position: absolute;
          top: 0;
          bottom: 5px;
          width: 44px;
          border: none;
          cursor: pointer;
          display: none;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 900;
          z-index: 3;
          transition: opacity 150ms ease;
        }

        .exact-mega-scroll-btn.left {
          left: 0;
          background: linear-gradient(to right, rgba(253,253,252,1) 55%, rgba(253,253,252,0));
          color: #073B3F;
          border-radius: 0 0 0 12px;
        }

        .exact-mega-scroll-btn.right {
          right: 0;
          background: linear-gradient(to left, rgba(253,253,252,1) 55%, rgba(253,253,252,0));
          color: #073B3F;
          border-radius: 0 0 12px 0;
        }

        .exact-mega-scroll-btn:hover { opacity: 0.7; }
        .exact-mega-scroll-btn:disabled { opacity: 0; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) {
          .exact-mega-link, .exact-mega-links-wrap::before,
          .exact-mega-links-wrap::after { transition: none; }
        }

        .exact-menu-item.is-open .exact-mega-scroll-btn {
          display: flex;
        }

        .exact-mega-wrap {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 1600px;
          z-index: 9998;
          pointer-events: none;
        }

        .exact-mobile-toggle {
          display: none;
        }

        .exact-mobile-menu {
          display: none;
        }

        @media (max-width: 1180px) {
          .exact-nav-spacer {
            height: 136px;
          }

          .exact-inner {
            padding-left: 18px;
            padding-right: 18px;
          }

          .exact-main {
            height: 94px;
          }

          .exact-main .exact-inner {
            grid-template-columns: minmax(110px, auto) minmax(0, 1fr) auto;
            grid-template-areas:
              "brand search actions"
              "brand search actions";
            gap: 10px;
          }

          .team-brand { grid-area: brand; }
          .exact-search-wrap { grid-area: search; min-width: 0; }
          .exact-actions { grid-area: actions; }
          .exact-digi-gold-btn { display: none; }
          .rate-dropdown { display: none; }
          .exact-menu { display: none; }
          .exact-desktop-menu-toggle { display: none !important; }
          .exact-mobile-toggle { display: grid; }

          .mobile-drawer-overlay {
            position: fixed;
            inset: 0;
            background: rgba(7, 31, 34, 0.48);
            backdrop-filter: blur(3px);
            z-index: 1000;
            animation: mobileOverlayFade 0.22s ease-out;
          }

          @keyframes mobileOverlayFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .exact-mobile-menu {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: min(320px, 86vw);
            height: 100vh;
            background: #ffffff;
            z-index: 1001;
            display: flex;
            flex-direction: column;
            box-shadow: 10px 0 40px rgba(7, 31, 34, 0.22);
            transform: translateX(-100%);
            transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1);
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 0;
          }

          .exact-mobile-menu.open {
            transform: translateX(0);
          }

          .mobile-menu-header {
            background: linear-gradient(135deg, #073B3F 0%, #0E4B46 100%);
            color: #fff;
            padding: 22px 18px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 4px 14px rgba(7, 31, 34, 0.12);
          }

          .mobile-user-info {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .mobile-user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.18);
            border: 1.5px solid rgba(255, 255, 255, 0.35);
            color: #fff;
            display: grid;
            place-items: center;
            flex-shrink: 0;
          }

          .mobile-user-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }

          .mobile-user-text strong {
            font-size: 15px;
            font-weight: 800;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .mobile-user-text span {
            font-size: 11.5px;
            color: rgba(255, 255, 255, 0.78);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .mobile-menu-close {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 0;
            background: rgba(255, 255, 255, 0.16);
            color: #fff;
            display: grid;
            place-items: center;
            cursor: pointer;
            flex-shrink: 0;
            transition: background 150ms ease;
          }

          .mobile-menu-close:active {
            background: rgba(255, 255, 255, 0.3);
          }

          .mobile-menu-rates {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 10px 16px;
            background: #F4F9F8;
            border-bottom: 1px solid #E2ECEB;
          }

          .mobile-menu-rates span {
            background: #073B3F;
            color: #fff;
            border-radius: 999px;
            padding: 4px 10px;
            font-size: 10.5px;
            font-weight: 800;
            white-space: nowrap;
          }

          .mobile-menu-divider-label {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #8C7B65;
            padding: 14px 18px 6px;
            background: #FAFAF8;
            border-top: 1px solid #F0ECE6;
          }

          .mobile-menu-services-list {
            display: flex;
            flex-direction: column;
            padding: 4px 12px;
          }

          .mobile-service-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 11px 10px;
            border: 0;
            border-bottom: 1px solid #F4EFEB;
            background: transparent;
            color: #1A2826;
            cursor: pointer;
            border-radius: 8px;
            transition: background 140ms ease;
            width: 100%;
            text-align: left;
          }

          .mobile-service-item:active {
            background: #F3F7F6;
          }

          .mobile-service-item:last-child {
            border-bottom: 0;
          }

          .mobile-service-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .mobile-service-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: #EDF5F4;
            color: #073B3F;
            display: grid;
            place-items: center;
            flex-shrink: 0;
          }

          .mobile-service-icon.heart-icon {
            color: #C92035;
            background: #FDF2F4;
          }

          .mobile-service-icon.cart-icon {
            color: #073B3F;
            background: #EDF5F4;
          }

          .mobile-service-icon.coin-icon {
            color: #B5842F;
            background: #FDF7E7;
          }

          .mobile-service-icon.shop-icon {
            color: #15803D;
            background: #F0FDF4;
          }

          .mobile-service-icon.user-icon {
            color: #073B3F;
            background: #EDF5F4;
          }

          .mobile-service-icon.truck-icon {
            color: #2563EB;
            background: #EFF6FF;
          }

          .mobile-service-icon.add-user-icon {
            color: #7C3AED;
            background: #F5F3FF;
          }

          .mobile-service-icon.switch-icon {
            color: #D97706;
            background: #FFFBEB;
          }

          .mobile-service-label {
            font-size: 13.5px;
            font-weight: 700;
            color: #1E293B;
          }

          .mobile-service-badge {
            background: #C92035;
            color: #fff;
            border-radius: 999px;
            padding: 2px 8px;
            font-size: 10.5px;
            font-weight: 800;
          }

          .mobile-service-tag {
            background: #FEF3C7;
            color: #92400E;
            border-radius: 999px;
            padding: 2px 8px;
            font-size: 10.5px;
            font-weight: 800;
          }

          .mobile-service-arrow {
            color: #94A3B8;
            font-size: 18px;
            font-weight: 300;
          }

          .mobile-menu-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            padding: 8px 14px 16px;
          }

          .exact-mobile-menu button.mobile-cat-btn {
            display: flex;
            align-items: center;
            gap: 9px;
            border: 1px solid var(--bb-soft-aqua);
            border-radius: 12px;
            background: linear-gradient(160deg, #FFFFFF 0%, var(--bb-surface) 100%);
            color: var(--bb-teal-dark);
            padding: 11px 12px;
            font-weight: 800;
            text-align: left;
            font-size: 12.5px;
            width: 100%;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(7,59,63,.04);
            transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background 140ms ease;
          }

          .exact-mobile-menu button.mobile-cat-btn:active {
            transform: scale(0.97);
            background: var(--bb-mist-aqua);
            border-color: var(--bb-teal);
            box-shadow: 0 1px 2px rgba(7,59,63,.06) inset;
          }

          .mobile-cat-icon {
            flex-shrink: 0;
            width: 30px;
            height: 30px;
            border-radius: 9px;
            display: grid;
            place-items: center;
            background: linear-gradient(150deg, rgba(204,168,129,.22), rgba(204,168,129,.08));
            color: var(--bb-gold-strong);
          }

          .mobile-cat-label {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .mobile-menu-bottom {
            margin-top: auto;
            padding: 14px 16px 24px;
            border-top: 1px solid #ECE7DF;
            background: #FAF8F5;
          }

          .mobile-logout-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px 16px;
            border-radius: 10px;
            font-size: 13.5px;
            font-weight: 800;
            cursor: pointer;
            transition: all 140ms ease;
          }

          .mobile-logout-btn.is-logout {
            border: 1px solid #FCA5A5;
            background: #FEF2F2;
            color: #DC2626;
          }

          .mobile-logout-btn.is-logout:active {
            background: #FEE2E2;
          }

          .mobile-logout-btn.is-login {
            border: 1px solid #2C6A60;
            background: radial-gradient(ellipse at 20% 0%, #216960 0%, transparent 65%), linear-gradient(120deg, #0A4545, #062F34);
            box-shadow: inset 0 1px 0 rgba(255,255,255,.14);
            color: #FFFFFF;
          }

          .mobile-logout-btn.is-login:active {
            filter: brightness(1.08);
          }
        }

        /* Customer account drawer: one calm teal palette with warm gold accents. */
        .role-drawer-overlay{position:fixed;inset:0;z-index:10050;display:flex;justify-content:flex-end;background:#102b2e70;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:role-drawer-fade 180ms ease both}
        @keyframes role-drawer-fade{from{opacity:0}to{opacity:1}}
        @keyframes role-drawer-slide{from{transform:translateX(100%)}to{transform:translateX(0)}}
        .role-drawer{--drawer-ink:#123f3e;--drawer-muted:#657b75;width:380px;max-width:calc(100vw - 20px);height:100%;height:100dvh;display:flex;flex-direction:column;position:relative;overflow:hidden;box-sizing:border-box;background:#f6f8f5;box-shadow:-16px 0 60px #092b2b26;animation:role-drawer-slide 260ms cubic-bezier(.2,.8,.2,1) both;font-family:inherit}
        .role-drawer *{box-sizing:border-box}
        .role-drawer-top-accent{height:3px;flex-shrink:0;background:linear-gradient(90deg,#a67b42,#e6cf9c,#a67b42)}
        .role-drawer-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:17px 22px;background:#fff;border-bottom:1px solid #e3eae3;flex-shrink:0}
        .role-drawer-brand{display:flex;align-items:center;gap:12px;min-width:0}
        .role-drawer-logo-mark{display:flex;align-items:center;justify-content:center;width:44px;height:48px;flex-shrink:0}
        .role-drawer-logo-mark img{display:block;max-width:100%;max-height:100%;object-fit:contain}
        .role-drawer-brand-title{font-family:Georgia,serif;font-size:19px;font-weight:700;letter-spacing:.12em;color:var(--drawer-ink);margin:0}
        .role-drawer-brand-sub{display:block;margin-top:5px;font-size:10px;line-height:1.5;color:var(--drawer-muted);letter-spacing:.025em}
        .role-drawer-close{display:grid;place-items:center;width:36px;height:36px;flex-shrink:0;border:1px solid #dee7e0;border-radius:50%;background:#f5f8f5;color:#43635b;cursor:pointer;transition:background 160ms,color 160ms}
        .role-drawer-close:hover{background:#e5efea;color:#0e4741}
        .role-drawer-user-card{display:flex;align-items:center;gap:14px;position:relative;isolation:isolate;overflow:hidden;margin:16px 18px 4px;padding:20px;border-radius:17px;background:linear-gradient(120deg,#103e40,#1e5b50);color:#fff;flex-shrink:0;box-shadow:0 8px 22px #103e4012}
        .role-drawer-user-card::after{content:'';position:absolute;z-index:-1;right:-36px;top:-52px;width:170px;height:170px;border:1px solid #d4bc8129;border-radius:50%;box-shadow:0 0 0 24px #d4bc8109,0 0 0 48px #d4bc8107;pointer-events:none}
        .role-drawer-avatar{display:grid;place-items:center;width:48px;height:48px;flex-shrink:0;border:1px solid #d9c59380;border-radius:14px;background:#ffffff12;color:#f6e8c8;font-size:23px;font-family:Georgia,serif;font-weight:700}
        .role-drawer-user-meta{min-width:0;flex:1}.role-drawer-welcome{display:block;color:#c6dcd4;font-size:10px;letter-spacing:.04em;margin-bottom:5px}
        .role-drawer-user-name{display:block;color:#fff;font-size:16px;font-weight:700;line-height:1.4;overflow-wrap:anywhere}
        .role-drawer-user-role{display:inline-flex;align-items:center;gap:5px;margin-top:8px;padding:3px 9px;border:1px solid #d3bc833d;border-radius:20px;color:#f1dfb4;background:#ffffff0a;font-size:9px;font-weight:650;letter-spacing:.09em;text-transform:uppercase}
        .role-drawer-user-role.is-guest{text-transform:none;letter-spacing:0;font-size:11px;border:0;padding:0;background:transparent;color:#c6dcd4}
        .role-drawer-nav{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#a9c0b6 transparent;padding:12px 18px 18px;display:flex;flex-direction:column;gap:7px}
        .role-drawer-section-label{display:flex;align-items:center;gap:10px;padding:6px 3px 7px;color:#6a7d72;font-size:10px;font-weight:650;letter-spacing:.1em;text-transform:uppercase}
        .role-drawer-section-label::after{content:'';height:1px;flex:1;background:#dfe7dc}
        .role-drawer-item{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;min-height:66px;width:100%;padding:12px;border:1px solid #e1e8e1;border-radius:13px;background:#fff;text-align:left;text-decoration:none;cursor:pointer;box-shadow:none;transition:background 160ms,border-color 160ms,box-shadow 160ms}
        .role-drawer-item:hover{background:#f1f6ef;border-color:#b9ccba;box-shadow:0 3px 12px #173e4006;transform:none}
        .role-drawer-item:active{background:#e8f0e4}
        .role-drawer-item-left{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
        .role-drawer-icon-box{display:grid;place-items:center;width:38px;height:38px;flex-shrink:0;border:1px solid #dfe8dc;border-radius:11px;background:#f0f5ec;color:#386650;transition:background 160ms}
        .role-drawer-icon-box.icon-gold{background:#faf4e7;border-color:#eee1c6;color:#99703c}
        .role-drawer-icon-box svg{display:block;stroke-width:1.7}
        .role-drawer-item:hover .role-drawer-icon-box{background:#e3eedc;transform:none}.role-drawer-item:hover .role-drawer-icon-box.icon-gold{background:#f4e9d1}
        .role-drawer-item-labels{display:flex;flex-direction:column;min-width:0;gap:4px}
        .role-drawer-item-title{font-weight:650;font-size:13px;line-height:1.35;color:#173f36}
        .role-drawer-item-desc{font-size:10.5px;line-height:1.5;color:#6b8077;white-space:normal}
        .role-drawer-item-badge{display:grid;place-items:center;flex-shrink:0;min-width:25px;min-height:25px;padding:3px 7px;border:1px solid #cbdcc4;border-radius:9px;background:#edf4e7;color:#365f3e;font-size:11px;font-weight:700}
        .role-drawer-chevron{display:grid;place-items:center;color:#94aa9b;flex-shrink:0;transition:color 160ms}.role-drawer-item:hover .role-drawer-chevron{color:#50765b;transform:none}
        .role-drawer-footer{flex-shrink:0;padding:12px 18px max(14px,env(safe-area-inset-bottom));border-top:1px solid #e1e8df;background:#fff;display:flex;flex-direction:column;gap:12px}
        .role-drawer-logout-btn,.role-drawer-login-btn{display:flex;align-items:center;justify-content:center;gap:9px;min-height:45px;width:100%;padding:11px 14px;border:1px solid #e4d8d0;border-radius:11px;background:#faf7f4;color:#90564a;font-family:inherit;font-size:13px;font-weight:650;cursor:pointer;transition:background 160ms,border-color 160ms}
        .role-drawer-logout-btn:hover{background:#f4e9e3;border-color:#d8bfb2;box-shadow:none}
        .role-drawer-login-btn{border-color:#2C6A60;background:radial-gradient(ellipse at 20% 0%, #216960 0%, transparent 65%), linear-gradient(120deg, #0A4545, #062F34);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.14)}.role-drawer-login-btn:hover{border-color:#C5A567;filter:brightness(1.08)}
        .role-drawer-tagline{display:flex;align-items:center;justify-content:center;gap:7px;color:#75856d;font-size:9px;letter-spacing:.035em;line-height:1.5;text-align:center}
        .role-drawer button:focus-visible{outline:2px solid #ac8245;outline-offset:2px}
        @media(max-width:380px){.role-drawer{max-width:calc(100vw - 12px)}.role-drawer-head{padding:15px 17px}.role-drawer-user-card{padding:17px;margin-inline:14px}.role-drawer-nav{padding-inline:14px}.role-drawer-footer{padding-inline:14px}}
        @media(prefers-reduced-motion:reduce){.role-drawer-overlay,.role-drawer,.role-drawer *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
        @media (max-width: 1020px) and (min-width: 901px) {
          .summary-pill {
            width: 42px;
            padding: 0;
          }

          .summary-pill .summary-text {
            display: none;
          }

          .exact-actions {
            gap: 8px;
          }
        }

        @media (max-width: 900px) {
          .exact-nav-spacer {
            height: 160px;
          }

          .exact-main {
            height: auto !important;
            min-height: unset !important;
            padding: 10px 0 12px;
          }

          .exact-main .exact-inner {
            height: auto;
            display: grid;
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "brand actions"
              "search search";
            row-gap: 10px;
            column-gap: 12px;
            justify-content: space-between;
            align-items: center;
          }

          .team-brand {
            grid-area: brand;
            align-self: center;
          }

          .team-mark-frame {
            height: 50px;
            width: auto;
          }

          .team-mark {
            height: 48px;
            width: auto;
          }

          .exact-search-wrap {
            grid-area: search;
            min-width: 0;
            width: 100%;
          }

          .exact-search {
            height: 44px;
          }

          .exact-actions {
            grid-area: actions;
            display: flex;
            align-items: center;
            gap: 8px;
            align-self: center;
          }

          .mobile-menu-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .exact-inner {
            width: 100%;
            padding-left: 12px;
            padding-right: 12px;
          }

          .exact-strip {
            height: 34px;
            font-size: 10.5px;
          }

          .exact-strip-item {
            padding: 0 20px;
          }

          .exact-nav-spacer {
            height: 152px;
          }

          .exact-main {
            height: auto !important;
            min-height: unset !important;
            padding: 8px 0 10px;
          }

          .exact-main .exact-inner {
            row-gap: 8px;
          }

          .team-mark {
            width: auto;
            height: 44px;
          }

          .team-mark-frame {
            width: auto;
            height: 46px;
            overflow: visible;
          }

          .exact-actions {
            gap: 5px;
            align-items: center;
            flex-shrink: 0;
          }

          .login-pill {
            height: 34px;
            padding: 0 10px;
            font-size: 11px;
            font-weight: 800;
          }

          .exact-icon {
            width: 30px;
            height: 30px;
          }

          .exact-search {
            height: 42px;
          }
        }

        @media (max-width: 400px) {
          .exact-nav-spacer {
            height: 146px;
          }

          .exact-main {
            height: auto !important;
            min-height: unset !important;
            padding: 6px 0 8px;
          }

          .exact-main .exact-inner {
            row-gap: 6px;
            padding-left: 8px;
            padding-right: 8px;
          }

          .team-mark {
            height: 36px;
          }

          .team-mark-frame {
            height: 38px;
            max-width: 90px;
          }

          .login-pill {
            height: 30px;
            padding: 0 8px;
            font-size: 10px;
          }

          .exact-search {
            height: 38px;
          }

          .exact-search input {
            font-size: 13px;
          }

          .exact-inner {
            padding-left: 8px;
            padding-right: 8px;
          }

          .exact-actions {
            gap: 4px;
          }

          .mobile-menu-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── Flipkart-style compact header — All Collection, Coins
           Collection, Product Display only, mobile/tablet only. Desktop
           and every other page keep the full navbar untouched. ── */
        .cn-compact-bar {
          display: none;
        }

          .cn-search-overlay {
            display: flex;
            flex-direction: column;
            position: fixed;
            inset: 0;
            z-index: 3000;
            background: #fff;
          }

          .cn-search-overlay-bar {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            border-bottom: 1px solid #f0e6d8;
          }

          .cn-search-overlay-back {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border: 0;
            background: transparent;
            color: #453b30;
            padding: 0;
            cursor: pointer;
          }

          .cn-search-overlay-back:active {
            opacity: 0.6;
          }

          .cn-search-overlay-input {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f5f1ea;
            border-radius: 10px;
            padding: 0 12px;
          }

          .cn-search-overlay-input input {
            flex: 1;
            min-width: 0;
            border: 0;
            background: transparent;
            padding: 11px 0;
            font-size: 14px;
            color: #211a12;
            outline: none;
          }

          .cn-search-overlay-voice {
            flex: 0 0 auto;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #D1DFDE;
            background: #FFFFFF;
            color: #073B3F;
            cursor: pointer;
            padding: 0;
            transition: all 0.16s ease;
          }

          .cn-search-overlay-voice:hover {
            border-color: #073B3F;
            transform: scale(1.05);
          }

          .cn-search-overlay-voice.is-listening {
            background: #E11D48;
            color: #FFFFFF;
            border-color: #E11D48;
          }

          .cn-search-overlay-body {
            flex: 1;
            overflow-y: auto;
          }

          .cn-search-recent-title {
            padding: 14px 16px 6px;
            font-size: 12px;
            font-weight: 800;
            color: #9a8f80;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .cn-search-recent-row {
            display: flex;
            align-items: center;
            border-bottom: 1px solid #f5f1ea;
          }

          .cn-search-recent-item {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 4px 12px 16px;
            border: 0;
            background: transparent;
            text-align: left;
            font-size: 14px;
            font-weight: 600;
            color: #453b30;
            cursor: pointer;
          }

          .cn-search-recent-remove {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border: 0;
            background: transparent;
            color: #9a8f80;
            cursor: pointer;
          }

          .cn-search-recent-remove:active {
            color: #C92035;
          }

          .cn-search-recent-item svg {
            flex: 0 0 auto;
            color: #9a8f80;
          }

          .cn-search-status {
            padding: 16px;
            color: #9a8f80;
            font-weight: 700;
          }

          .cn-search-result {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            border: 0;
            border-bottom: 1px solid #f5f1ea;
            background: transparent;
            text-align: left;
            cursor: pointer;
          }

          .cn-search-result img,
          .cn-search-result .exact-fallback {
            flex: 0 0 auto;
            width: 44px;
            height: 44px;
            border-radius: 8px;
            object-fit: cover;
            background: #f5f1ea;
          }

          .cn-search-result strong {
            display: block;
            font-size: 13px;
            color: #211a12;
          }

          .cn-search-result > span > span {
            display: block;
            font-size: 12px;
            color: #9a8f80;
            margin-top: 2px;
          }

        @media (max-width: 1180px) {
          .cn-hide-mobile {
            display: none !important;
          }

          .exact-nav-spacer.cn-compact-spacer-height {
            height: 50px !important;
          }

          .cn-compact-bar {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 12px;
            background: #fff;
            border-bottom: 1px solid #f0e6d8;
          }

          .cn-compact-back,
          .cn-compact-icon {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 26px;
            height: 26px;
            border: 0;
            background: transparent;
            color: #453b30;
            padding: 0;
            cursor: pointer;
          }

          .cn-compact-back:active,
          .cn-compact-icon:active {
            opacity: 0.6;
          }

          .cn-compact-aug-pill {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            gap: 3px;
            height: 26px;
            padding: 0 7px;
            border: 1px solid #E5C378;
            border-radius: 999px;
            background: #FFF9EC;
            color: #8b551e;
            font-size: 10.5px;
            font-weight: 800;
            cursor: pointer;
          }

          .cn-compact-aug-pill:active {
            opacity: 0.6;
          }

          .cn-compact-logo {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            border: 0;
            background: transparent;
            padding: 0;
            cursor: pointer;
          }

          .cn-compact-logo img {
            height: 30px;
            width: auto;
            display: block;
          }

          .cn-compact-spacer {
            flex: 1;
          }

          .cn-compact-badge {
            position: absolute;
            top: -4px;
            right: -6px;
            min-width: 15px;
            height: 15px;
            padding: 0 3px;
            border-radius: 999px;
            background: #C92035;
            color: #fff;
            font-size: 9px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
          }


        }
        @media (max-width: 1180px) {
          .exact-actions .exact-digi-gold-mobile,
          .cn-compact-bar .exact-digi-gold-mobile { display: inline-flex; height: 34px; gap: 5px; padding: 0 8px 0 4px; border-radius: 999px; box-shadow: 0 3px 9px rgba(7,62,64,.14); }
          .exact-digi-gold-mobile .exact-digi-gold-coin { width: 27px; height: 27px; }
          .exact-digi-gold-mobile .exact-digi-gold-label { font-size: 10.5px; letter-spacing: 0; }
          .exact-actions .exact-coin-icon-btn,
          .cn-compact-bar .cn-compact-aug-shop { display: none; }
        }
        @media (max-width: 640px) {
          .exact-actions { gap: 4px; }
          .exact-actions .summary-pill { width: auto; height: 34px; padding: 0 7px; gap: 4px; font-size: 10px; flex-shrink: 0; }
          .exact-actions .summary-pill .summary-text { display: inline; }
          .exact-actions .summary-pill > svg { width: 12px; height: 12px; }
          .cn-compact-bar { gap: 4px; padding: 10px 8px; }
          .cn-compact-aug-pill { height: 32px; padding: 0 5px; font-size: 9.5px; }
          .cn-compact-spacer { min-width: 0; }
        }
        @media (max-width: 360px) {
          .exact-main .exact-inner { padding-left: 8px; padding-right: 8px; column-gap: 5px; }
          .exact-actions .exact-icon { width: 26px; height: 28px; }
          .exact-actions .summary-pill .summary-text,
          .cn-compact-aug-pill > span { max-width: 34px; white-space: normal; text-align: left; line-height: 10px; }
          .exact-digi-gold-mobile .exact-digi-gold-label { font-size: 10px; }
          .exact-digi-gold-mobile .exact-digi-gold-coin { width: 25px; height: 25px; }
          .cn-compact-back { width: 22px; }
          .cn-compact-icon { width: 24px; }
          .cn-compact-logo img { height: 26px; }
        }

        .cn-search-overlay{height:100dvh;z-index:10040;color:#073b3f}
        .cn-search-overlay-body{min-height:0;overscroll-behavior:contain}
        .cn-search-clear{display:grid;place-items:center;width:32px;height:32px;border:0;background:transparent;color:#627773;cursor:pointer;flex-shrink:0}
        .cn-search-all{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:17px 16px;border:0;border-bottom:1px solid #e0e9e4;background:#f3f7f3;color:#164c45;font:inherit;font-size:14px;font-weight:650;text-align:left;cursor:pointer}
        .cn-search-discover{padding:26px 16px}.cn-search-discover h2{font-family:Georgia,serif;font-size:25px;margin:0 0 10px;color:#073b3f}.cn-search-discover p{font-size:13px;color:#71837a;line-height:1.7}.cn-search-discover>div{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.cn-search-discover button{display:flex;align-items:center;gap:8px;border:1px solid #d9e4da;border-radius:24px;padding:10px 18px;background:#f5f8f2;color:#375d4c;font:inherit;font-size:13px;cursor:pointer}
        .cn-search-result:hover,.cn-search-recent-item:hover{background:#f0f6f1}.cn-search-overlay button:focus-visible{outline:2px solid #bb8958;outline-offset:-3px}.cn-search-overlay-input:focus-within{box-shadow:0 0 0 2px #c2d6ca}
        @media(min-width:1181px){
          .exact-main{height:98px}.exact-menu{height:50px}.exact-nav-spacer{height:188px}.exact-search{height:50px}
          .cn-search-overlay{display:none}
        }

        /* Comfortable mobile shopping header with all existing actions. */
        @media(max-width:640px){
          .exact-main{background:linear-gradient(180deg,#fff 0%,#f5f8f5 100%);padding:10px 0 12px;border-bottom:1px solid #dfe8df}
          .exact-main .exact-inner{grid-template-columns:36px minmax(0,1fr);column-gap:8px;row-gap:11px;padding-inline:12px}
          .exact-main .team-brand{width:36px;min-height:42px;justify-content:center}
          .exact-main .team-mark-frame{height:40px;max-width:36px;justify-content:center}
          .exact-main .team-mark{height:auto;max-height:40px;max-width:36px;object-fit:contain}
          .exact-main .exact-actions{gap:4px;min-width:0;max-width:100%;justify-content:flex-end}
          .exact-main .exact-actions .summary-pill{height:36px;padding:0 7px;gap:4px;border:1px solid #c8d9cf;border-radius:12px;background:#f1f6ed;color:#245341;box-shadow:none;font-size:10px;font-weight:700;white-space:nowrap;width:auto}
          .exact-main .exact-actions .summary-pill>svg{width:12px;height:12px;color:#7d683f}
          .exact-main .exact-actions .summary-pill .summary-text{display:inline;max-width:none;white-space:nowrap;line-height:1.2}
          .exact-main .exact-actions .exact-digi-gold-mobile{height:36px;gap:4px;padding:0 7px 0 4px;border-radius:12px;box-shadow:0 3px 8px #123e4014;border-color:#356d5f}
          .exact-main .exact-digi-gold-mobile .exact-digi-gold-coin{width:26px;height:26px}
          .exact-main .exact-digi-gold-mobile .exact-digi-gold-label{font-size:10px;font-weight:700;white-space:nowrap}
          .exact-main .exact-actions .exact-icon{width:34px;height:38px;flex-shrink:0;border-radius:11px;color:#244d42;background:#ffffffa6;border:1px solid #e3eae2;box-shadow:none}
          .exact-main .exact-actions .exact-icon>svg{width:19px;height:19px}
          .exact-main .exact-actions .exact-icon:hover{transform:none;background:#edf4e9}
          .exact-main .exact-actions .exact-icon:active{background:#e0eddc}
          .exact-main .exact-actions .exact-desktop-menu-toggle{display:none!important}
          .exact-main .exact-icon .exact-badge{top:-4px;right:-3px;min-width:16px;height:16px;font-size:9px;border:2px solid #fff;box-shadow:none}
          .exact-main .exact-search{height:47px;grid-template-columns:42px minmax(0,1fr) 43px;border:1px solid #cdded2;border-radius:15px;background:#fff;box-shadow:0 3px 12px #163f3606}
          .exact-main .exact-search:focus-within{border-color:#6c9b7c;box-shadow:0 0 0 3px #6c9b7c16}
          .exact-main .exact-search input{font-size:16px;color:#21473c;min-width:0;padding-right:6px}
          .exact-main .exact-search input::placeholder{font-size:13px;color:#84958a}
          .exact-main .exact-voice-btn{width:34px;height:34px;background:#f3f7ef;border:1px solid #dce6d6;box-shadow:none;color:#3c6b4d}
          .exact-main .exact-voice-btn.is-listening{background:#e11d48;color:#fff}
          .exact-main button:focus-visible,.cn-compact-bar button:focus-visible{outline:2px solid #ac8245;outline-offset:2px}
          .cn-compact-bar{background:#fafcf8;border-bottom:1px solid #e1e9de;gap:5px;padding-block:11px}
          .cn-compact-bar .cn-compact-icon{border-radius:9px;color:#244d42}
          .cn-compact-bar .cn-compact-aug-pill{border-color:#c8d9cf;background:#f1f6ed;color:#245341;border-radius:10px}
          .cn-compact-bar .exact-digi-gold-mobile{border-radius:10px;box-shadow:none}
        }
        @media(max-width:359px){
          .exact-main .exact-inner{grid-template-columns:32px minmax(0,1fr);padding-inline:10px;column-gap:8px}
          .exact-main .team-brand,.exact-main .team-mark-frame{width:32px;max-width:32px}
          .exact-main .exact-actions{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;width:100%}
          .exact-main .exact-actions .summary-pill,.exact-main .exact-actions .exact-digi-gold-mobile{grid-column:span 3;justify-content:center;width:100%}
          .exact-main .exact-actions .exact-icon,.exact-main .exact-actions .login-dropdown{grid-column:span 2;width:100%}
          .exact-main .exact-actions .exact-coin-icon-btn{display:none}
        }

        /* Mobile menu: fixed greeting/footer, calm service cards and compact categories. */
        @media(max-width:1180px){
          .exact-mobile-menu{width:min(370px,92vw);height:100dvh;max-height:100dvh;overflow:hidden;background:#f6f8f3;border-right:1px solid #dce6d9;box-sizing:border-box}
          .exact-mobile-menu *{box-sizing:border-box}
          .mobile-menu-header{flex-shrink:0;padding:20px 16px;background:linear-gradient(115deg,#103e40,#205a4e);box-shadow:none;border-bottom:2px solid #c6a872}
          .mobile-user-avatar{width:43px;height:43px;border-radius:13px;border:1px solid #d9c59380;background:#ffffff12;color:#f7e5bb}
          .mobile-user-text strong{font-size:14px;font-weight:650;white-space:normal;overflow-wrap:anywhere;line-height:1.5}
          .mobile-user-text span{font-size:11px;color:#cbdfd2;line-height:1.5}
          .mobile-menu-close{width:36px;height:36px;background:#ffffff12;border:1px solid #ffffff25}
          .mobile-menu-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#a9c0b0 transparent;padding-bottom:14px}
          .mobile-menu-rates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px 14px;background:transparent;border-bottom:0}
          .mobile-menu-rates span{display:block;text-align:center;white-space:normal;font-size:10px;line-height:1.6;padding:7px 5px;border:1px solid #e5dec9;border-radius:9px;background:#faf6eb;color:#80653b;font-weight:650}
          .mobile-menu-divider-label{display:flex;align-items:center;gap:10px;padding:12px 16px 9px;background:transparent;border:0;color:#73816c;font-size:10px;font-weight:650;letter-spacing:.09em}
          .mobile-menu-divider-label::after{content:'';height:1px;background:#dde6d6;flex:1}
          .mobile-menu-services-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:0 14px 4px}
          .mobile-service-item{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:9px;min-height:57px;margin:0;padding:10px 12px;border:1px solid #e0e7dc;border-radius:12px;background:#fff;box-shadow:none;color:#244b3d;transition:background 150ms,border-color 150ms}
          .mobile-service-item:active{background:#eaf2e3;transform:none;border-color:#bdcfb2}
          .mobile-service-left{display:flex;align-items:center;gap:11px;min-width:0}
          .mobile-service-icon{display:grid;place-items:center;flex-shrink:0;width:35px;height:35px;border-radius:10px;background:#eff5e9!important;color:#426a45!important}
          .mobile-service-icon svg{stroke-width:1.7}
          .mobile-service-label{font-size:12px;line-height:1.45;font-weight:650;color:#204a39;white-space:normal}
          .mobile-service-badge{display:grid;place-items:center;min-width:24px;height:24px;padding:2px 6px;border:1px solid #d2e1c8;border-radius:8px;background:#eef5e7;color:#426a45;font-size:11px;font-weight:700;flex-shrink:0}
          .mobile-service-arrow{display:grid;place-items:center;color:#97ac8f;flex-shrink:0}
          .mobile-service-tag{background:#faf2de;border:1px solid #eee0bd;color:#96743c;font-size:9px;font-weight:650;padding:4px 8px;border-radius:20px}
          .mobile-service-item:nth-child(-n+2){grid-column:span 1;position:relative;min-height:90px;padding:12px;align-items:flex-start}
          .mobile-service-item:nth-child(-n+2) .mobile-service-left{flex-direction:column;align-items:flex-start;gap:8px}
          .mobile-service-item:nth-child(-n+2) .mobile-service-badge,.mobile-service-item:nth-child(-n+2) .mobile-service-arrow{position:absolute;right:11px;top:12px}
          .mobile-service-item.mobile-digi-gold{margin:2px 0;padding:13px 12px;border-radius:13px;background:linear-gradient(115deg,#134c46,#0b383d);border-color:#397361;box-shadow:0 4px 12px #153f3510}
          .mobile-digi-gold .mobile-service-label{color:#fff;font-size:13px}.mobile-digi-gold .mobile-service-icon{background:transparent!important;border:0;box-shadow:none}.mobile-digi-gold .exact-digi-gold-subtitle{color:#cadfcd;font-size:10px;line-height:1.5}.mobile-digi-gold .exact-digi-gold-arrow{color:#ead5a8;border-color:#d7bf7c44}
          .mobile-menu-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0 14px 4px}
          .exact-mobile-menu button.mobile-cat-btn{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:9px;width:100%;min-height:84px;padding:13px 12px;border:1px solid #dfe7d8;border-radius:12px;background:#fff;box-shadow:none;color:#30573f;font:inherit;text-align:left}
          .exact-mobile-menu button.mobile-cat-btn:active{transform:none;background:#eaf2e3;border-color:#b7cca9;box-shadow:none}
          .mobile-cat-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#f8f2e6;color:#a37c40;flex-shrink:0}
          .mobile-cat-label{font-size:11px;font-weight:650;line-height:1.5;white-space:normal;overflow:visible;text-overflow:clip}
          .mobile-menu-grid .mobile-cat-btn:last-child:nth-child(odd){grid-column:1/-1;flex-direction:row;align-items:center;justify-content:flex-start;min-height:52px}
          .mobile-menu-bottom{flex-shrink:0;margin:0;padding:12px 14px max(12px,env(safe-area-inset-bottom));background:#fff;border-top:1px solid #e1e8dd}
          .mobile-logout-btn{min-height:45px;border-radius:11px;font-size:12px;font-weight:650;box-shadow:none}
          .mobile-logout-btn.is-logout{background:#faf7f3;border-color:#e4d7cb;color:#986349}.mobile-logout-btn.is-logout:active{background:#f4eade}
          .mobile-logout-btn.is-login{background:#174b40;color:#fff;border-color:#174b40}
          .exact-mobile-menu button:focus-visible{outline:2px solid #a37c40;outline-offset:2px}
        }
        @media(prefers-reduced-motion:reduce){.exact-mobile-menu,.exact-mobile-menu *,.mobile-drawer-overlay{transition:none!important;animation:none!important;scroll-behavior:auto!important}}

        @media(max-width:1180px){
          .mobile-cat-icon{--category-surface:#edf5ef;width:43px;height:43px;border-radius:13px;color:#245f50;background:var(--category-surface);border:1px solid #d7e7da}
          .mobile-cat-icon[data-category="Gold"],.mobile-cat-icon[data-category="Coins"],.mobile-cat-icon[data-category="Wedding"]{--category-surface:#fcf3e1;color:#ac7829;border-color:#efdfbb}
          .mobile-cat-icon[data-category="Silver"]{--category-surface:#eef3f7;color:#61788a;border-color:#d9e3eb}
          .mobile-cat-icon[data-category="Offers"]{--category-surface:#fcf0e8;color:#a56d46;border-color:#edddd0}
          .mobile-cat-label{font-size:12px;color:#244d3b;font-weight:650}
          .exact-mobile-menu button.mobile-cat-btn{min-height:102px;gap:11px;background:linear-gradient(155deg,#fff,#fcfdf9);border-color:#dce6d7}
        }

        @media(max-width:1180px){
          .mobile-menu-rates{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
          .mobile-menu-rates>span{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:9px 3px;min-width:0}
          .mobile-menu-rates small{font-size:9px;font-weight:550;color:#8c7956;line-height:1.4}
          .mobile-menu-rates strong{font-size:10px;font-weight:700;line-height:1.4;overflow-wrap:anywhere}
          .mobile-menu-rates>span:last-child{background:#f0f4f7;border-color:#dde5ea;color:#5a7284}
          .mobile-menu-rates>span:last-child small{color:#6d8391}
        }
      `}</style>

      <header ref={navbarRef} className="exact-nav">
        {isCompactRoute && (
          <div className="cn-compact-bar">
            <button type="button" className="cn-compact-back" onClick={() => navigate(-1)} aria-label="Back">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <button type="button" className="cn-compact-logo" onClick={() => navigate("/customer")} aria-label="Home">
              <img src="/Aadhirai-Logo.png" alt="Aadhirai" />
            </button>
            <div className="cn-compact-spacer" />
            <button type="button" className="cn-compact-icon" onClick={openSearchScreen} aria-label="Search">
              <Icon name="search" size={19} />
            </button>
            {isLoggedIn && (
              <>
                <button type="button" className="cn-compact-aug-pill" onClick={() => requireLogin("/recharge")} title="AUG Revive Wallet">
                  <Icon name="star" size={12} />
                  <span>AUG Revive</span>
                </button>
                <button type="button" className="exact-digi-gold-btn exact-digi-gold-mobile" onClick={() => requireLogin('/digi-gold')} aria-label="Open Digi Gold">
                  <span className="exact-digi-gold-coin" aria-hidden="true"><img src={digiGoldCoinsIcon} alt="" /></span>
                  <span className="exact-digi-gold-label">Digi Gold</span>
                </button>
                <button type="button" className="cn-compact-icon cn-compact-aug-shop" onClick={() => requireLogin("/aug-products")} aria-label="AUG Revive" title="Shop with Revive">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="url(#cnCompactGoldGrad)" stroke="#B5842F" strokeWidth="1.2"/>
                    <circle cx="12" cy="12" r="7.5" stroke="#FDE08D" strokeWidth="0.8" strokeDasharray="2 1.5"/>
                    <circle cx="12" cy="12" r="5.2" fill="#E5A630" />
                    <text x="12" y="14.8" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#583101" fontFamily="Inter, sans-serif">AUG</text>
                    <defs>
                      <linearGradient id="cnCompactGoldGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFF2A8"/>
                        <stop offset="0.45" stopColor="#F5BF46"/>
                        <stop offset="1" stopColor="#C98B1B"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </button>
              </>
            )}
            {!isLoggedIn && (
                <button type="button" className="exact-digi-gold-btn exact-digi-gold-mobile" onClick={() => requireLogin('/digi-gold')} aria-label="Open Digi Gold">
                  <span className="exact-digi-gold-coin" aria-hidden="true"><img src={digiGoldCoinsIcon} alt="" /></span>
                  <span className="exact-digi-gold-label">Digi Gold</span>
                </button>
              )}
              <button type="button" className="cn-compact-icon" onClick={() => requireLogin("/cart")} aria-label="Cart">
              <Icon name="cart" />
              {cartCount > 0 && <span className="cn-compact-badge">{cartCount}</span>}
            </button>
            <button type="button" className="cn-compact-icon" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
              <Icon name={mobileOpen ? "close" : "menu"} />
            </button>
          </div>
        )}

        {mobileSearchOpen && (
          <div className="cn-search-overlay" ref={searchScreenRef} role="dialog" aria-modal="true" aria-label="Search jewellery">
            <div className="cn-search-overlay-bar">
              <button type="button" className="cn-search-overlay-back" onClick={closeSearchScreen} aria-label="Back">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <div className="cn-search-overlay-input">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitSearch();
                  }}
                  aria-label="Search jewellery"
                  placeholder="Search gold, silver, coins and more"
                />
                {searchQuery && <button type="button" className="cn-search-clear" aria-label="Clear search" onClick={() => setSearchQuery('')}><Icon name="close" size={17} /></button>}
                <button
                  type="button"
                  className={`cn-search-overlay-voice ${voiceListening || showVoiceModal ? "is-listening" : ""}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={startVoiceModal}
                  disabled={!voiceSupported}
                  title="Search by voice"
                  aria-label="Search by voice"
                >
                  <Icon name="mic" size={17} />
                </button>
              </div>
            </div>

            <div className="cn-search-overlay-body">
              {searchQuery.trim().length >= 2 && <button type="button" className="cn-search-all" onClick={() => submitSearch()}>See all results for &ldquo;{searchQuery.trim()}&rdquo; <Icon name="chevronRight" size={16} /></button>}
              {searchQuery.trim() === "" ? (
                <>
                {recentSearches.length > 0 && (
                  <div className="cn-search-recent">
                    <div className="cn-search-recent-title">Recent Searches</div>
                    {recentSearches.map((q) => (
                      <div key={q} className="cn-search-recent-row">
                        <button
                          type="button"
                          className="cn-search-recent-item"
                          onClick={() => { setSearchQuery(q); submitSearch(q); }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <polyline points="12 7 12 12 15.5 14" />
                          </svg>
                          <span>{q}</span>
                        </button>
                        <button
                          type="button"
                          className="cn-search-recent-remove"
                          onClick={() => removeRecentSearch(q)}
                          aria-label={`Remove ${q}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="cn-search-discover"><h2>Find something you love</h2><p>Search by jewellery name, metal or collection.</p><div>{['Gold', 'Silver', 'Coins'].map(term => <button type="button" key={term} onClick={() => setSearchQuery(term)}><Icon name="search" size={15} />{term}</button>)}</div></div>
                </>
              ) : searchQuery.trim().length < 2 ? <div className="cn-search-status">Type at least 2 characters to see suggestions.</div> : (
                <div className="cn-search-results" aria-live="polite">
                  {searchLoading && <div className="cn-search-status">Searching...</div>}
                  {!searchLoading && searchResults.length === 0 && (
                    <div className="cn-search-status">No products found</div>
                  )}
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="cn-search-result"
                      onClick={() => {
                        setMobileSearchOpen(false);
                        setSearchQuery("");
                        navigate(`/product-display?category=${product.category}&metal=${product.metal}&id=${product.id}`);
                      }}
                    >
                      {productImage(product) ? (
                        <img src={productImage(product)} alt="" />
                      ) : (
                        <div className="exact-fallback" />
                      )}
                      <span>
                        <strong>{product.name}</strong>
                        <span>
                          {product.metal?.toUpperCase()} - {product.category} - {money(product.price)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`exact-strip ${isCompactRoute ? "cn-hide-mobile" : ""}`}>
          <div className="exact-strip-track">
            {/* First set */}
            <span className="exact-strip-item">
              <Icon name="truck" size={14} /> FREE INSURED SHIPPING ON ALL
              ORDERS ABOVE Rs.4,999
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="hallmark" size={14} /> BIS HALLMARKED JEWELLERY
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="refresh" size={14} /> 15 DAYS EASY RETURNS
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="truck" size={14} /> 100% GENUINE & CERTIFIED GOLD
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="hallmark" size={14} /> SECURE PAYMENTS GUARANTEED
            </span>
            <span className="exact-strip-dot" />
            {/* Duplicate for seamless loop */}
            <span className="exact-strip-item">
              <Icon name="truck" size={14} /> FREE INSURED SHIPPING ON ALL
              ORDERS ABOVE Rs.4,999
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="hallmark" size={14} /> BIS HALLMARKED JEWELLERY
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="refresh" size={14} /> 15 DAYS EASY RETURNS
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="truck" size={14} /> 100% GENUINE & CERTIFIED GOLD
            </span>
            <span className="exact-strip-dot" />
            <span className="exact-strip-item">
              <Icon name="hallmark" size={14} /> SECURE PAYMENTS GUARANTEED
            </span>
            <span className="exact-strip-dot" />
          </div>
        </div>

        <div className={`exact-main ${isCompactRoute ? "cn-hide-mobile" : ""}`}>
          <div className="exact-inner">
            <button
              className="team-brand"
              type="button"
              onClick={() => navigate("/customer")}
            >
              <span className="team-mark-frame">
                <img
                  src="/Aadhirai-Logo.png"
                  alt="Aadhirai"
                  className="team-mark"
                  loading="eager"
                />
              </span>
            </button>

            <div className="exact-search-wrap" onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) setShowSearchDrop(false);
            }}>
              <div className="exact-search">
                <Icon name="search" size={18} />
                <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)}
                  onFocus={() => {
                    if (restoringSearchFocus.current) return;
                    if (window.matchMedia('(max-width: 1180px)').matches) openSearchScreen();
                    else setShowSearchDrop(true);
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter') submitSearch();
                    if (event.key === 'Escape') setShowSearchDrop(false);
                  }}
                  aria-label="Search jewellery" aria-expanded={showSearchDrop && searchQuery.trim().length >= 2}
                  aria-controls="customer-search-suggestions" placeholder="Search gold & silver jewellery..." />
                <button
                  className={`exact-voice-btn ${voiceListening || showVoiceModal ? "is-listening" : ""}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (window.matchMedia('(max-width: 1180px)').matches) openSearchScreen();
                    else setShowSearchDrop(true);
                    startVoiceModal();
                  }}
                  disabled={!voiceSupported}
                  title={
                    voiceSupported
                      ? "Search by voice (Google / YouTube style)"
                      : "Voice search is not supported in this browser"
                  }
                  aria-label="Search by voice"
                >
                  <Icon name="mic" size={17} />
                </button>
              </div>

              {showSearchDrop && !mobileSearchOpen && searchQuery.trim().length >= 2 && (
                <div className="exact-results" id="customer-search-suggestions" aria-label="Search suggestions">
                  {searchLoading && <div className="cn-search-status" role="status">Searching...</div>}
                  {!searchLoading && searchResults.length === 0 && <div className="cn-search-status" role="status">No products found</div>}
                  {searchResults.map(product => <button key={product.id} type="button" className="exact-result"
                    onMouseDown={event => event.preventDefault()} onClick={() => {
                      setShowSearchDrop(false); setSearchQuery('');
                      navigate(`/product-display?category=${product.category}&metal=${product.metal}&id=${product.id}`);
                    }}>
                    {productImage(product) ? <img src={productImage(product)} alt="" /> : <div className="exact-fallback" />}
                    <span><strong>{product.name}</strong><span>{product.metal?.toUpperCase()} - {product.category} - {money(product.price)}</span></span>
                  </button>)}
                  <button type="button" className="cn-search-all" onMouseDown={event => event.preventDefault()} onClick={() => submitSearch()}>See all results <Icon name="chevronRight" size={16} /></button>
                </div>
              )}
            </div>

            <button
                type="button"
                className="exact-digi-gold-btn"
                onClick={() => requireLogin("/digi-gold")}
                title="Explore Athirai Digi Gold"
                aria-label="Open Digi Gold"
              >
                <span className="exact-digi-gold-coin" aria-hidden="true"><img src={digiGoldCoinsIcon} alt="" /></span>
                <span className="exact-digi-gold-label">Digi Gold</span>
                <span className="exact-digi-gold-arrow" aria-hidden="true"><Icon name="chevronRight" size={13} /></span>
              </button>

            <div
              className="rate-dropdown"
              onMouseEnter={() => setRatesOpen(true)}
              onMouseLeave={() => setRatesOpen(false)}
              onFocus={() => setRatesOpen(true)}
              onBlur={() => setRatesOpen(false)}
            >
              <button
                type="button"
                className="rate-dropdown-toggle"
                aria-expanded={ratesOpen}
                aria-haspopup="true"
              >
                <Icon name="calendar" size={16} />
                <span className="rate-label">
                  Today's Gold Rate 22K - {money(rates?.gold_22k)}
                </span>
                <span
                  style={{
                    transform: ratesOpen ? "rotate(270deg)" : "rotate(90deg)",
                    display: "inline-block",
                    transition: "transform 150ms ease",
                  }}
                >
                  ▾
                </span>
              </button>

              {ratesOpen && (
                <div className="rate-dropdown-panel">
                  <div className="rate-item">
                    <div className="rate-item-title">Gold 24K</div>
                    <div className="rate-item-value">
                      {money(rates?.gold_24k)}
                    </div>
                  </div>
                  <div className="rate-item">
                    <div className="rate-item-title">Silver</div>
                    <div className="rate-item-value">
                      {money(rates?.silver_999)}
                    </div>
                  </div>
                  {/* Diamond 18K row — hidden — future use ku vachurukom */}
                  {/* Diamond 22K row — hidden — future use ku vachurukom */}
                  {/* Platinum row — hidden — future use ku vachurukom */}
                </div>
              )}
            </div>

            <div className="exact-actions">
              {isLoggedIn && (
                <>
                  <button
                    className="summary-pill"
                    type="button"
                    onClick={() => requireLogin("/recharge")}
                    title="AUG Revive Wallet"
                  >
                    <Icon name="star" size={15} />{" "}
                    <span className="summary-text">AUG Revive</span>
                  </button>

                  <button type="button" className="exact-digi-gold-btn exact-digi-gold-mobile" onClick={() => requireLogin('/digi-gold')} aria-label="Open Digi Gold">
                    <span className="exact-digi-gold-coin" aria-hidden="true"><img src={digiGoldCoinsIcon} alt="" /></span>
                    <span className="exact-digi-gold-label">Digi Gold</span>
                  </button>

                  <button
                    className="exact-coin-icon-btn"
                    type="button"
                    onClick={() => requireLogin("/aug-products")}
                    title="Shop with Revive"
                    aria-label="AUG Revive"
                  >
                    <span className="exact-coin-disc">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="url(#exactGoldGrad)" stroke="#B5842F" strokeWidth="1.2"/>
                        <circle cx="12" cy="12" r="7.5" stroke="#FDE08D" strokeWidth="0.8" strokeDasharray="2 1.5"/>
                        <circle cx="12" cy="12" r="5.2" fill="#E5A630" />
                        <text x="12" y="14.8" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#583101" fontFamily="Inter, sans-serif">AUG</text>
                        <defs>
                          <linearGradient id="exactGoldGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FFF2A8"/>
                            <stop offset="0.45" stopColor="#F5BF46"/>
                            <stop offset="1" stopColor="#C98B1B"/>
                          </linearGradient>
                        </defs>
                      </svg>
                    </span>
                  </button>
                </>
              )}

              {!isLoggedIn && (
                <button type="button" className="exact-digi-gold-btn exact-digi-gold-mobile" onClick={() => requireLogin('/digi-gold')} aria-label="Open Digi Gold">
                  <span className="exact-digi-gold-coin" aria-hidden="true"><img src={digiGoldCoinsIcon} alt="" /></span>
                  <span className="exact-digi-gold-label">Digi Gold</span>
                </button>
              )}
              <button
                className="exact-icon"
                type="button"
                onClick={() => requireLogin("/wishlist")}
                aria-label="Wishlist"
                title="Wishlist"
              >
                <Icon name="heart" filled={wishlistCount > 0} />
                {wishlistCount > 0 && (
                  <span className="exact-badge">{wishlistCount}</span>
                )}
              </button>

              <button
                className="exact-icon"
                type="button"
                onClick={() => requireLogin("/cart")}
                aria-label="Cart"
                title="Cart"
              >
                <Icon name="cart" />
                {cartCount > 0 && (
                  <span className="exact-badge">{cartCount}</span>
                )}
              </button>
              {!isLoggedIn && (
                <div
                  className="exact-login-popover-wrap"
                  onMouseEnter={openLoginDrop}
                  onMouseLeave={scheduleCloseLoginDrop}
                >
                  <button
                    className="login-pill"
                    type="button"
                    onClick={goLogin}
                    aria-expanded={loginDropOpen}
                    title="Click to Login"
                  >
                    <span>Login</span>
                    <span style={{ fontSize: "11px", marginLeft: "4px", transform: loginDropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease", display: "inline-block" }}>▾</span>
                  </button>

                  {loginDropOpen && (
                    <div className="exact-login-popover">
                      <div className="login-popover-arrow" />
                      <div className="login-popover-content">
                        <button
                          type="button"
                          className="login-popover-btn"
                          onClick={() => {
                            setLoginDropOpen(false);
                            navigate("/login");
                          }}
                        >
                          Login
                        </button>
                        <div className="login-popover-footer">
                          <span>New user?</span>
                          <button
                            type="button"
                            className="login-popover-link"
                            onClick={() => {
                              setLoginDropOpen(false);
                              navigate("/register");
                            }}
                          >
                            Sign Up
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                className="exact-icon exact-desktop-menu-toggle"
                type="button"
                onClick={() => setRoleDrawerOpen(true)}
                aria-label="Menu"
                title="Menu"
              >
                <Icon name="menu" />
              </button>

              <button
                className="exact-icon exact-mobile-toggle"
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                aria-label="Menu"
              >
                <Icon name={mobileOpen ? "close" : "menu"} />
              </button>
            </div>
          </div>
        </div>

        <nav className="exact-menu" aria-label="Jewellery categories" onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.target.closest('.exact-menu-item')?.querySelector('.exact-menu-button')?.focus();
            closeMega();
          }
        }}>
          <div className="exact-inner">
            {menuItems.map((item) => {
              const sections = megaByLabel[item.label];

              return (
                <div
                  className={`exact-menu-item ${activeMega === item.label ? "is-open" : ""}`}
                  key={item.label}
                  onMouseEnter={() => openMegaAfterHover(sections ? item.label : null)}
                  onMouseLeave={scheduleCloseMega}
                  onFocus={event => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      cancelMegaTimers();
                      setActiveMega(sections ? item.label : null);
                    }
                  }}
                  onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) closeMega(); }}
                >
                  <button
                    className="exact-menu-button"
                    type="button"
                    aria-expanded={sections ? activeMega === item.label : undefined}
                    aria-controls={sections ? `customer-mega-${item.label.replace(/[^a-z0-9]/gi, '-').toLowerCase()}` : undefined}
                    onKeyDown={event => {
                      if (sections && event.key === 'ArrowDown') {
                        event.preventDefault();
                        cancelMegaTimers();
                        setActiveMega(item.label);
                        requestAnimationFrame(() => megaRefs.current[item.label]?.querySelector('a')?.focus());
                      }
                    }}
                    onClick={() => {
                      closeMega();
                      if (item.label === "Nearby Shop") requireLogin(item.route);
                      else navigate(item.route);
                    }}
                  >
                    {item.label}
                  </button>
                  {sections && (
                    <div className="exact-mega-wrap">
                      <button
                        className="exact-mega-scroll-btn left"
                        type="button"
                        aria-label="Scroll left"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => scrollMega(item.label, -1)}
                      >‹</button>
                      <div
                        className="exact-mega"
                        id={`customer-mega-${item.label.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                        ref={el => { megaRefs.current[item.label] = el; }}
                        onClick={event => { if (event.target.closest('a')) closeMega(); }}
                      >
                        {sections.map((section) => (
                          <section
                            className="exact-mega-section"
                            key={section.title}
                          >
                            <Link className="exact-mega-title" to={section.viewAll[1]}>
                              <span>{megaIconFor(section.title)}</span>
                              {section.title}
                            </Link>
                            <div className="exact-mega-links-wrap">
                            <div className="exact-mega-links" aria-label={`${section.title} categories`}>
                            {section.links.map(([label, route]) => (
                              <Link
                                className="exact-mega-link"
                                key={label}
                                to={route}
                              >
                                {label}
                              </Link>
                            ))}
                            </div>
                            </div>
                            <Link
                              className="exact-mega-view"
                              to={section.viewAll[1]}
                            >
                              {section.viewAll[0]} <span aria-hidden="true">&rarr;</span>
                            </Link>
                          </section>
                        ))}
                      </div>
                      <button
                        className="exact-mega-scroll-btn right"
                        type="button"
                        aria-label="Scroll right"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => scrollMega(item.label, 1)}
                      >›</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Mobile Backdrop Overlay */}
        {mobileOpen && (
          <div
            className="mobile-drawer-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <div ref={mobileMenuRef} className={`exact-mobile-menu ${mobileOpen ? "open" : ""}`} inert={!mobileOpen} role={mobileOpen ? "dialog" : undefined} aria-modal={mobileOpen ? true : undefined} aria-label="Shopping and account menu">
          <div className="mobile-menu-header">
            <div className="mobile-user-info">
              <div className="mobile-user-avatar">
                <DrawerUser size={22} />
              </div>
              <div className="mobile-user-text">
                <strong>Hello, {isLoggedIn ? (localStorage.getItem("email")?.split("@")[0] || "Customer") : "Guest"}</strong>
                <span>{isLoggedIn ? "Welcome to Aathirai" : "Sign in for best experience"}</span>
              </div>
            </div>
            <button
              type="button"
              className="mobile-menu-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <DrawerClose size={19} />
            </button>
          </div>

          <div className="mobile-menu-body">
          {rates && (
            <div className="mobile-menu-rates">
              <span><small>Gold 22K</small><strong>{money(rates?.gold_22k)}</strong></span>
              <span><small>Gold 24K</small><strong>{money(rates?.gold_24k)}</strong></span>
              <span><small>Silver 999</small><strong>{money(rates?.silver_999)}</strong></span>
            </div>
          )}

          {/* User Requested Exact Order:
              1. Wishlist
              2. Cart
              3. AUG Revive
              4. Nearby Shop
              5. Profile
              6. Order Summary
              7. Create Customer
              (Role switch if applicable)
              8. Logout (last)
          */}
          <div className="mobile-menu-divider-label">Quick Services</div>
          <div className="mobile-menu-services-list">
            <button
              type="button"
              className="mobile-service-item"
              onClick={() => {
                setMobileOpen(false);
                requireLogin("/wishlist");
              }}
            >
              <div className="mobile-service-left">
                <span className="mobile-service-icon heart-icon">
                  <DrawerHeart size={20} />
                </span>
                <span className="mobile-service-label">Wishlist</span>
              </div>
              {wishlistCount > 0 ? (
                <span className="mobile-service-badge">{wishlistCount}</span>
              ) : (
                <span className="mobile-service-arrow"><DrawerChevron size={16} aria-hidden="true" /></span>
              )}
            </button>

            <button
              type="button"
              className="mobile-service-item"
              onClick={() => {
                setMobileOpen(false);
                requireLogin("/cart");
              }}
            >
              <div className="mobile-service-left">
                <span className="mobile-service-icon cart-icon">
                  <DrawerBag size={20} />
                </span>
                <span className="mobile-service-label">Cart</span>
              </div>
              {cartCount > 0 ? (
                <span className="mobile-service-badge">{cartCount}</span>
              ) : (
                <span className="mobile-service-arrow"><DrawerChevron size={16} aria-hidden="true" /></span>
              )}
            </button>

            {isLoggedIn && (
              <button
                type="button"
                className="mobile-service-item"
                onClick={() => {
                  setMobileOpen(false);
                  requireLogin("/aug-products");
                }}
              >
                <div className="mobile-service-left">
                  <span className="mobile-service-icon coin-icon">
                    <AugMenuCoin />
                  </span>
                  <span className="mobile-service-label">AUG</span>
                </div>
                <span className="mobile-service-tag">Rewards</span>
              </button>
            )}

            <button
                type="button"
                className="mobile-service-item mobile-digi-gold"
                onClick={() => {
                  setMobileOpen(false);
                  requireLogin("/digi-gold");
                }}
              >
                <div className="mobile-service-left">
                  <span className="mobile-service-icon">
                    <img src={digiGoldCoinsIcon} alt="" />
                  </span>
                  <span className="exact-digi-gold-copy"><span className="mobile-service-label">Digi Gold</span><span className="exact-digi-gold-subtitle">Gold &amp; Silver</span></span>
                </div>
                <span className="exact-digi-gold-arrow" aria-hidden="true"><Icon name="chevronRight" size={15} /></span>
              </button>

            <button
              type="button"
              className="mobile-service-item"
              onClick={() => {
                setMobileOpen(false);
                requireLogin("/nearby-shop");
              }}
            >
              <div className="mobile-service-left">
                <span className="mobile-service-icon shop-icon">
                  <DrawerStore size={20} />
                </span>
                <span className="mobile-service-label">Nearby Shop</span>
              </div>
              <span className="mobile-service-arrow"><DrawerChevron size={16} aria-hidden="true" /></span>
            </button>

            <button
              type="button"
              className="mobile-service-item"
              onClick={() => {
                setMobileOpen(false);
                requireLogin("/profile");
              }}
            >
              <div className="mobile-service-left">
                <span className="mobile-service-icon user-icon">
                  <DrawerUser size={20} />
                </span>
                <span className="mobile-service-label">Profile</span>
              </div>
              <span className="mobile-service-arrow"><DrawerChevron size={16} aria-hidden="true" /></span>
            </button>

            <button
              type="button"
              className="mobile-service-item"
              onClick={() => {
                setMobileOpen(false);
                requireLogin("/order-summary");
              }}
            >
              <div className="mobile-service-left">
                <span className="mobile-service-icon truck-icon">
                  <DrawerReceipt size={20} />
                </span>
                <span className="mobile-service-label">Order Summary</span>
              </div>
              <span className="mobile-service-arrow"><DrawerChevron size={16} aria-hidden="true" /></span>
            </button>

            {isLoggedIn && ['super_admin', 'customer'].includes(role) && (
              <button
                type="button"
                className="mobile-service-item"
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/create-customer");
                }}
              >
                <div className="mobile-service-left">
                  <span className="mobile-service-icon add-user-icon">
                    <DrawerUserPlus size={20} />
                  </span>
                  <span className="mobile-service-label">Create Customer</span>
                </div>
                <span className="mobile-service-arrow"><DrawerChevron size={16} aria-hidden="true" /></span>
              </button>
            )}

            {isLoggedIn && role === 'customer' && (
              <button type="button" className="mobile-service-item" onClick={() => {
                setMobileOpen(false);
                navigate("/customer-hierarchy-grid");
              }}>
                <div className="mobile-service-left">
                  <span className="mobile-service-icon user-icon"><DrawerNetwork size={20} /></span>
                  <span className="mobile-service-label">Hierarchy</span>
                </div>
                <span className="mobile-service-arrow"><DrawerChevron size={16} aria-hidden="true" /></span>
              </button>
            )}


            {roleSwitchCfg && (
              <button
                type="button"
                className="mobile-service-item"
                onClick={() => {
                  setMobileOpen(false);
                  navigate(roleSwitchCfg.path);
                }}
              >
                <div className="mobile-service-left">
                  <span className="mobile-service-icon switch-icon">
                    <DrawerSwitch size={20} />
                  </span>
                  <span className="mobile-service-label">{roleSwitchCfg.label}</span>
                </div>
                <span className="mobile-service-arrow"><DrawerChevron size={16} aria-hidden="true" /></span>
              </button>
            )}
          </div>

          <div className="mobile-menu-divider-label">Shop by Category</div>
          <div className="mobile-menu-grid">
            {menuItems.map((item) => {

              return (
              <button
                type="button"
                className="mobile-cat-btn"
                key={item.label}
                onClick={() => {
                  setMobileOpen(false);
                  if (item.label === "Nearby Shop") requireLogin(item.route);
                  else navigate(item.route);
                }}
              >
                <span className="mobile-cat-icon" data-category={item.label}><MobileCategoryIcon label={item.label} /></span>
                <span className="mobile-cat-label">{item.label}</span>
              </button>
            ); })}
          </div>

          </div>
          {/* Logout at the very bottom */}
          <div className="mobile-menu-bottom">
            <button
              type="button"
              className={`mobile-logout-btn ${isLoggedIn ? "is-logout" : "is-login"}`}
              onClick={() => {
                setMobileOpen(false);
                if (isLoggedIn) logout(); else goLogin();
              }}
            >
              {isLoggedIn ? <DrawerLogout size={18} /> : <DrawerUser size={18} />}
              <span>{isLoggedIn ? "Logout" : "Login to Your Account"}</span>
            </button>
          </div>
        </div>
      </header>

      {roleDrawerOpen && (
        <div
          className="role-drawer-overlay"
          onClick={() => setRoleDrawerOpen(false)}
        >
          <div ref={roleDrawerRef} role="dialog" aria-modal="true" aria-labelledby="customer-account-title" className="role-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="role-drawer-top-accent" />

            <div className="role-drawer-head">
              <div className="role-drawer-brand">
                <span className="role-drawer-logo-mark"><img src="/Aadhirai-Logo.png" alt="" /></span>
                <div>
                  <h4 id="customer-account-title" className="role-drawer-brand-title">ATHIRAI</h4>
                  <small className="role-drawer-brand-sub">Your personal jewellery space</small>
                </div>
              </div>
              <button
                className="role-drawer-close"
                type="button"
                onClick={() => setRoleDrawerOpen(false)}
                aria-label="Close"
              >
                <DrawerClose size={18} />
              </button>
            </div>

            {/* Profile banner */}
            <div className="role-drawer-user-card">
              <div className="role-drawer-avatar">
                {isLoggedIn ? (
                  (localStorage.getItem("email") || "C").charAt(0).toUpperCase()
                ) : (
                  <DrawerUser size={22} />
                )}
              </div>
              <div className="role-drawer-user-meta">
                <span className="role-drawer-welcome">{isLoggedIn ? "Welcome back" : "Discover something special"}</span>
                <strong className="role-drawer-user-name">
                  {isLoggedIn
                    ? localStorage.getItem("email")?.split("@")[0] || "Valued Customer"
                    : "Welcome, Guest"}
                </strong>
                <span className={`role-drawer-user-role${isLoggedIn ? '' : ' is-guest'}`}>
                  {isLoggedIn ? (
                    <>✦ {role ? role.replace("_", " ") : "Member"}</>
                  ) : (
                    "Sign in to access your bag & coins"
                  )}
                </span>
              </div>
            </div>

            <div className="role-drawer-nav">
              <div className="role-drawer-section-label">Shopping & Account</div>

              {/* 1. Wishlist */}
              <button
                className="role-drawer-item"
                type="button"
                onClick={() => {
                  setRoleDrawerOpen(false);
                  requireLogin("/wishlist");
                }}
              >
                <div className="role-drawer-item-left">
                  <span className="role-drawer-icon-box icon-ruby">
                    <DrawerHeart size={20} />
                  </span>
                  <div className="role-drawer-item-labels">
                    <span className="role-drawer-item-title">Wishlist</span>
                    <span className="role-drawer-item-desc">Saved favorite pieces</span>
                  </div>
                </div>
                {wishlistCount > 0 ? (
                  <span className="role-drawer-item-badge badge-ruby">{wishlistCount}</span>
                ) : (
                  <span className="role-drawer-chevron">
                    <DrawerChevron size={17} />
                  </span>
                )}
              </button>

              {/* 2. Cart */}
              <button
                className="role-drawer-item"
                type="button"
                onClick={() => {
                  setRoleDrawerOpen(false);
                  requireLogin("/cart");
                }}
              >
                <div className="role-drawer-item-left">
                  <span className="role-drawer-icon-box icon-teal">
                    <DrawerBag size={20} />
                  </span>
                  <div className="role-drawer-item-labels">
                    <span className="role-drawer-item-title">Cart</span>
                    <span className="role-drawer-item-desc">Review bag & checkout</span>
                  </div>
                </div>
                {cartCount > 0 ? (
                  <span className="role-drawer-item-badge badge-teal">{cartCount}</span>
                ) : (
                  <span className="role-drawer-chevron">
                    <DrawerChevron size={17} />
                  </span>
                )}
              </button>

              {/* 3. AUG Revive */}
              {isLoggedIn && (
                <button
                  className="role-drawer-item"
                  type="button"
                  onClick={() => {
                    setRoleDrawerOpen(false);
                    requireLogin("/aug-products");
                  }}
                >
                  <div className="role-drawer-item-left">
                    <span className="role-drawer-icon-box icon-gold">
                      <AugMenuCoin />
                    </span>
                    <div className="role-drawer-item-labels">
                      <span className="role-drawer-item-title">AUG</span>
                      <span className="role-drawer-item-desc">Shop with Revive rewards</span>
                    </div>
                  </div>
                  <span className="role-drawer-chevron">
                    <DrawerChevron size={17} />
                  </span>
                </button>
              )}

              {/* 4. Nearby Shop */}
              <button
                className="role-drawer-item"
                type="button"
                onClick={() => {
                  setRoleDrawerOpen(false);
                  requireLogin("/nearby-shop");
                }}
              >
                <div className="role-drawer-item-left">
                  <span className="role-drawer-icon-box icon-emerald">
                    <DrawerStore size={20} />
                  </span>
                  <div className="role-drawer-item-labels">
                    <span className="role-drawer-item-title">Nearby Shop</span>
                    <span className="role-drawer-item-desc">Locate showroom & timings</span>
                  </div>
                </div>
                <span className="role-drawer-chevron">
                  <DrawerChevron size={17} />
                </span>
              </button>

              {/* 5. Profile */}
              <button
                className="role-drawer-item"
                type="button"
                onClick={() => {
                  setRoleDrawerOpen(false);
                  requireLogin("/profile");
                }}
              >
                <div className="role-drawer-item-left">
                  <span className="role-drawer-icon-box icon-teal">
                    <DrawerUser size={20} />
                  </span>
                  <div className="role-drawer-item-labels">
                    <span className="role-drawer-item-title">Profile</span>
                    <span className="role-drawer-item-desc">Personal details & address</span>
                  </div>
                </div>
                <span className="role-drawer-chevron">
                  <DrawerChevron size={17} />
                </span>
              </button>

              {/* 6. Order Summary */}
              <button
                className="role-drawer-item"
                type="button"
                onClick={() => {
                  setRoleDrawerOpen(false);
                  requireLogin("/order-summary");
                }}
              >
                <div className="role-drawer-item-left">
                  <span className="role-drawer-icon-box icon-teal">
                    <DrawerReceipt size={20} />
                  </span>
                  <div className="role-drawer-item-labels">
                    <span className="role-drawer-item-title">Order Summary</span>
                    <span className="role-drawer-item-desc">Track status & invoices</span>
                  </div>
                </div>
                <span className="role-drawer-chevron">
                  <DrawerChevron size={17} />
                </span>
              </button>

              {/* 7. Create Customer */}
              {isLoggedIn && ['super_admin', 'customer'].includes(role) && (
                <button
                  className="role-drawer-item"
                  type="button"
                  onClick={() => {
                    setRoleDrawerOpen(false);
                    navigate("/create-customer");
                  }}
                >
                  <div className="role-drawer-item-left">
                    <span className="role-drawer-icon-box icon-gold">
                      <DrawerUserPlus size={20} />
                    </span>
                    <div className="role-drawer-item-labels">
                      <span className="role-drawer-item-title">Create Customer</span>
                      <span className="role-drawer-item-desc">Onboard customer account</span>
                    </div>
                  </div>
                  <span className="role-drawer-chevron">
                    <DrawerChevron size={17} />
                  </span>
                </button>
              )}

              {isLoggedIn && role === 'customer' && (
                <button className="role-drawer-item" type="button" onClick={() => {
                  setRoleDrawerOpen(false);
                  navigate("/customer-hierarchy-grid");
                }}>
                  <div className="role-drawer-item-left">
                    <span className="role-drawer-icon-box icon-teal"><DrawerNetwork size={20} /></span>
                    <div className="role-drawer-item-labels">
                      <span className="role-drawer-item-title">Hierarchy</span>
                      <span className="role-drawer-item-desc">View your customer referral network</span>
                    </div>
                  </div>
                  <span className="role-drawer-chevron"><DrawerChevron size={17} /></span>
                </button>
              )}

              {/* Role Switch if applicable */}
              {roleSwitchCfg && (
                <button
                  className="role-drawer-item"
                  type="button"
                  onClick={() => {
                    setRoleDrawerOpen(false);
                    navigate(roleSwitchCfg.path);
                  }}
                >
                  <div className="role-drawer-item-left">
                    <span className="role-drawer-icon-box icon-emerald">
                      <DrawerSwitch size={20} />
                    </span>
                    <div className="role-drawer-item-labels">
                      <span className="role-drawer-item-title">{roleSwitchCfg.label}</span>
                      <span className="role-drawer-item-desc">Switch role dashboard</span>
                    </div>
                  </div>
                  <span className="role-drawer-chevron">
                    <DrawerChevron size={17} />
                  </span>
                </button>
              )}
            </div>

            <div className="role-drawer-footer">
              {isLoggedIn ? (
                <button
                  className="role-drawer-logout-btn"
                  type="button"
                  onClick={() => {
                    setRoleDrawerOpen(false);
                    logout();
                  }}
                >
                  <DrawerLogout size={18} />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  className="role-drawer-login-btn"
                  type="button"
                  onClick={() => {
                    setRoleDrawerOpen(false);
                    goLogin();
                  }}
                >
                  <DrawerUser size={18} />
                  <span>Login / Register</span>
                </button>
              )}
              <div className="role-drawer-tagline">
                <DrawerShield size={13} aria-hidden="true" />
                ✦ BIS 100% Hallmarked • Secure Shopping ✦
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── YOUTUBE / GOOGLE ULTRA-POWERFUL VOICE SEARCH MODAL ── */}
      {showVoiceModal && (
        <div className="cn-voice-overlay" onClick={handleCloseVoiceModal}>
          <div className="cn-voice-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="cn-voice-header">
              <span className={`cn-voice-badge ${voiceStatus === 'processing' ? 'is-processing' : ''}`}>
                <span className="cn-voice-badge-dot" />
                {voiceStatus === 'listening' ? 'Listening...' :
                 voiceStatus === 'processing' ? 'Searching...' :
                 voiceStatus === 'error' ? 'Notice' : 'Voice Search'}
              </span>

              <button
                type="button"
                className="cn-voice-close-btn"
                onClick={handleCloseVoiceModal}
                aria-label="Close voice search"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Live Transcript / Spoken Text Area (Only shown when speaking or error) */}
            {voiceInterim ? (
              <div className="cn-voice-transcript-box">
                <div className="cn-voice-transcript-active">
                  "{voiceInterim}"
                </div>
              </div>
            ) : voiceStatus === 'error' ? (
              <div className="cn-voice-transcript-box">
                <div className="cn-voice-error-text">
                  {voiceErrorMsg || 'Could not access microphone.'}
                </div>
              </div>
            ) : null}

            {/* Central Animated Mic */}
            <div className="cn-voice-mic-wrap">
              {voiceStatus === 'listening' && (
                <>
                  <div
                    className="cn-voice-ripple ripple-1"
                    style={{ transform: voiceVolume > 5 ? `scale(${1 + voiceVolume * 0.007})` : undefined }}
                  />
                  <div
                    className="cn-voice-ripple ripple-2"
                    style={{ transform: voiceVolume > 10 ? `scale(${1.2 + voiceVolume * 0.009})` : undefined }}
                  />
                  <div
                    className="cn-voice-ripple ripple-3"
                    style={{ transform: voiceVolume > 20 ? `scale(${1.4 + voiceVolume * 0.01})` : undefined }}
                  />
                </>
              )}
              <button
                type="button"
                className={`cn-voice-mic-main ${voiceStatus === 'listening' ? 'is-active' : ''} ${voiceStatus === 'processing' ? 'is-processing' : ''}`}
                onClick={() => {
                  if (voiceStatus === 'listening') {
                    if (voiceInterim.trim()) {
                      executeVoiceSearch(voiceInterim);
                    } else {
                      stopVoiceRecognition();
                      setVoiceStatus('ready');
                    }
                  } else {
                    startSpeechRecognition();
                  }
                }}
                title={voiceStatus === 'listening' ? 'Click to search or pause' : 'Click to speak'}
              >
                <Icon name="mic" size={40} />
              </button>
            </div>

            {/* Google / YouTube Style Soundwave Equalizer */}
            {voiceStatus === 'listening' && (
              <div className="cn-voice-waves">
                <span className="cn-wave-bar bar-1" style={{ height: voiceVolume > 5 ? `${Math.min(34, 12 + voiceVolume * 0.25)}px` : undefined }} />
                <span className="cn-wave-bar bar-2" style={{ height: voiceVolume > 5 ? `${Math.min(38, 22 + voiceVolume * 0.32)}px` : undefined }} />
                <span className="cn-wave-bar bar-3" style={{ height: voiceVolume > 5 ? `${Math.min(34, 16 + voiceVolume * 0.28)}px` : undefined }} />
                <span className="cn-wave-bar bar-4" style={{ height: voiceVolume > 5 ? `${Math.min(36, 20 + voiceVolume * 0.3)}px` : undefined }} />
                <span className="cn-wave-bar bar-5" style={{ height: voiceVolume > 5 ? `${Math.min(30, 10 + voiceVolume * 0.22)}px` : undefined }} />
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={navbarSpacerRef} className={`exact-nav-spacer ${isCompactRoute ? "cn-compact-spacer-height" : ""}`} aria-hidden="true" />
    </>
  );
}
