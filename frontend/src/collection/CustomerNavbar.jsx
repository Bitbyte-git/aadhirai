import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import { getCartCountDB } from "../collection/card_section";
import { getSubcategories } from "../config/categoryConfig";

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

export default function CustomerNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  // AUG Coin pill, coin-shop icon, and the menu drawer are hidden for
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
  const [ratesOpen, setRatesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [activeMega, setActiveMega] = useState(null);
  const megaRefs = useRef({});
  const recognitionRef = useRef(null);
  const [loginDropOpen, setLoginDropOpen] = useState(false);
  const loginHideTimerRef = useRef(null);
  // Flipkart-style compact mobile/tablet header — only for the 3 pages the
  // user asked for; desktop and every other page keep the full navbar as-is.
  // Exact match only — "/collection/all/filter" is its own dedicated
  // full-page view with its own back header, so it's deliberately excluded.
  const isCompactRoute = ["/collection/all", "/collection/coins", "/product-display"].includes(location.pathname);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      if (transcript) {
        setSearchQuery(transcript);
        setShowSearchDrop(true);
      }
    };

    recognition.onerror = () => setVoiceListening(false);
    recognition.onend = () => setVoiceListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchDrop(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(
          `/jewelry-products/?search=${encodeURIComponent(query)}`,
        );
        const allResults = Array.isArray(res.data) ? res.data : [];
        const filteredResults = allResults.filter(
          (p) => p.metal !== "diamond" && p.metal !== "platinum",
        );
        setSearchResults(filteredResults.slice(0, 6));
        setShowSearchDrop(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const submitSearch = (queryOverride) => {
    const query = (queryOverride ?? searchQuery).trim();
    if (!query) return;
    setShowSearchDrop(false);
    setMobileSearchOpen(false);
    saveRecentSearch(query);
    navigate(`/collection/all?search=${encodeURIComponent(query)}`);
  };

  const startVoiceSearch = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceSupported(false);
      return;
    }

    if (voiceListening) {
      recognition.stop();
      setVoiceListening(false);
      return;
    }

    try {
      setShowSearchDrop(false);
      setVoiceListening(true);
      recognition.start();
    } catch {
      setVoiceListening(false);
    }
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
          grid-template-columns: auto 1fr auto auto;
          gap: clamp(18px, 2.5vw, 36px);
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
        }

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
          width: 34px;
          height: 34px;
          margin-right: 5px;
          border: 0;
          border-radius: 999px;
          background: var(--bb-mist-aqua);
          color: var(--bb-teal-dark);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }

        .exact-voice-btn:hover {
          background: var(--bb-soft-aqua);
          transform: translateY(-1px);
        }

        .exact-voice-btn.is-listening {
          background: var(--bb-teal-dark);
          color: var(--bb-bg);
          box-shadow: 0 0 0 6px rgba(12,64,68,0.13);
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
          border: none;
          background: #073B3F;
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
          box-shadow: 0 4px 12px rgba(7,59,63,0.22);
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
          border: 1px solid #073B3F;
          background: #073B3F;
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
          background: #0E4B46;
          box-shadow: 0 10px 24px rgba(7,59,63,0.18);
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
          gap: 0;
          padding: 20px 44px 16px;
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
          min-height: 220px;
          padding: 0 22px 8px 16px;
          border-right: 1px solid #e6ded5;
          display: flex;
          flex-direction: column;
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
          min-height: 28px;
          padding: 0;
          color: var(--bb-ink);
          display: block;
          text-align: left;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0;
          text-transform: none;
          cursor: pointer;
          transition: color 160ms ease, transform 160ms ease;
        }

        .exact-mega-link:hover {
          color: #9F6130;
          transform: translateX(3px);
        }

        .exact-mega-view {
          border: 0;
          background: transparent;
          margin-top: auto;
          padding: 12px 0 0;
          min-height: 34px;
          color: #073B3F;
          display: inline-flex;
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

        .exact-mega-scroll-btn:hover {
          opacity: 0.7;
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
            border: 1px solid #073B3F;
            background: #073B3F;
            color: #FFFFFF;
          }

          .mobile-logout-btn.is-login:active {
            background: #0E4B46;
          }
        }

        .role-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(7, 24, 26, 0.52);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 10050;
          display: flex;
          justify-content: flex-end;
          animation: role-drawer-fade 200ms ease both;
        }

        @keyframes role-drawer-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .role-drawer {
          width: 340px;
          max-width: 88vw;
          height: 100%;
          background: linear-gradient(180deg, #FDFDFC 0%, #FBFAF7 100%);
          box-shadow: -20px 0 60px rgba(7, 45, 48, 0.28);
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          animation: role-drawer-slide 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
          position: relative;
          overflow: hidden;
        }

        @keyframes role-drawer-slide {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .role-drawer-top-accent {
          height: 4px;
          width: 100%;
          background: linear-gradient(90deg, #073B3F, #CCA881 35%, #E5C378 55%, #073B3F);
          background-size: 200% 100%;
          animation: role-drawer-accent-shift 6s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes role-drawer-accent-shift {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 0%; }
        }

        .role-drawer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 20px 16px;
          border-bottom: 1px solid #EDF4F3;
          flex-shrink: 0;
          background: radial-gradient(120% 100% at 0% 0%, rgba(204,168,129,0.10), transparent 55%), #FAFDFD;
        }

        .role-drawer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .role-drawer-logo-mark {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(145deg, #073B3F, #0C4E53);
          border: 1px solid rgba(204, 168, 129, 0.55);
          box-shadow: 0 4px 12px rgba(7, 59, 63, 0.22);
          display: grid;
          place-items: center;
          color: #E5C378;
          font-weight: 700;
          font-size: 16px;
          font-family: 'Playfair Display', Georgia, serif;
        }

        .role-drawer-brand-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #073B3F;
          margin: 0;
          text-transform: uppercase;
        }

        .role-drawer-brand-sub {
          display: block;
          font-size: 9px;
          letter-spacing: 0.14em;
          color: #7A8987;
          text-transform: uppercase;
          margin-top: 1px;
        }

        .role-drawer-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #D1DFDE;
          background: #F5FAF9;
          color: #073B3F;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 180ms ease;
        }

        .role-drawer-close:hover {
          background: #073B3F;
          color: #ffffff;
          border-color: #073B3F;
          transform: rotate(90deg);
        }

        /* User Card in Drawer */
        .role-drawer-user-card {
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(7,59,63,0.06) 0%, rgba(204,168,129,0.12) 100%);
          border-bottom: 1px solid #EDF4F3;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          position: relative;
        }

        .role-drawer-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #073B3F, #0C4E53);
          color: #F8F5EE;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 17px;
          font-family: 'Playfair Display', Georgia, serif;
          box-shadow: 0 0 0 3px rgba(204,168,129,0.22), 0 6px 16px rgba(7, 59, 63, 0.24);
          border: 1.5px solid #CCA881;
          flex-shrink: 0;
        }

        .role-drawer-user-meta {
          min-width: 0;
          flex: 1;
        }

        .role-drawer-user-name {
          font-weight: 800;
          font-size: 14px;
          color: #073B3F;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }

        .role-drawer-user-role {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #FDFBF5;
          margin-top: 5px;
          padding: 3px 9px;
          border-radius: 999px;
          background: linear-gradient(135deg, #9F6130, #CCA881);
          box-shadow: 0 3px 8px rgba(159, 97, 48, 0.28);
        }

        .role-drawer-user-role.is-guest {
          color: #7A8987;
          background: transparent;
          box-shadow: none;
          padding: 0;
          text-transform: none;
          letter-spacing: normal;
          font-weight: 600;
          font-size: 11px;
        }

        /* Scrollable Navigation List */
        .role-drawer-nav {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .role-drawer-section-label {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9F6130;
          padding: 8px 8px 4px;
        }

        .role-drawer-item {
          width: 100%;
          text-align: left;
          border: 1px solid rgba(209, 223, 222, 0.6);
          border-radius: 13px;
          padding: 10px 12px;
          background: #FFFFFF;
          color: #073B3F;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
          text-decoration: none;
          box-shadow: 0 1px 2px rgba(7, 59, 63, 0.04);
        }

        .role-drawer-item:hover {
          background: linear-gradient(135deg, #FFFFFF, #FAF6EF);
          border-color: #CCA881;
          transform: translateX(4px);
          box-shadow: 0 8px 20px rgba(7, 59, 63, 0.10);
        }

        .role-drawer-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .role-drawer-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          transition: transform 180ms ease;
        }

        .role-drawer-item:hover .role-drawer-icon-box {
          transform: scale(1.08);
        }

        .role-drawer-icon-box.icon-ruby {
          background: linear-gradient(145deg, rgba(201, 32, 53, 0.14), rgba(201, 32, 53, 0.05));
          color: #C92035;
        }
        .role-drawer-icon-box.icon-teal {
          background: linear-gradient(145deg, rgba(7, 59, 63, 0.14), rgba(7, 59, 63, 0.05));
          color: #073B3F;
        }
        .role-drawer-icon-box.icon-gold {
          background: linear-gradient(145deg, rgba(187, 137, 88, 0.22), rgba(187, 137, 88, 0.08));
          color: #9F6130;
        }
        .role-drawer-icon-box.icon-emerald {
          background: linear-gradient(145deg, rgba(12, 64, 68, 0.14), rgba(12, 64, 68, 0.05));
          color: #0C4044;
        }

        .role-drawer-item-labels {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .role-drawer-item-title {
          font-weight: 800;
          font-size: 13px;
          color: #111817;
          line-height: 1.25;
        }

        .role-drawer-item-desc {
          font-size: 10.5px;
          color: #7A8987;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role-drawer-item-badge {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.3;
          flex-shrink: 0;
        }

        .role-drawer-item-badge.badge-ruby {
          background: #C92035;
          color: #ffffff;
        }
        .role-drawer-item-badge.badge-teal {
          background: #073B3F;
          color: #ffffff;
        }

        .role-drawer-chevron {
          color: #BDCFCE;
          flex-shrink: 0;
          transition: transform 180ms ease, color 180ms ease;
        }

        .role-drawer-item:hover .role-drawer-chevron {
          color: #073B3F;
          transform: translateX(2px);
        }

        /* Drawer Footer */
        .role-drawer-footer {
          padding: 12px 16px 16px;
          border-top: 1px solid #EDF4F3;
          background: #FAFDFD;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }

        .role-drawer-logout-btn {
          width: 100%;
          border: 1px solid rgba(201, 32, 53, 0.25);
          background: rgba(201, 32, 53, 0.04);
          color: #C92035;
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 180ms ease;
        }

        .role-drawer-logout-btn:hover {
          background: #C92035;
          color: #ffffff;
          border-color: #C92035;
          box-shadow: 0 4px 14px rgba(201, 32, 53, 0.2);
        }

        .role-drawer-login-btn {
          width: 100%;
          border: none;
          background: linear-gradient(135deg, #073B3F, #0C4E53);
          color: #ffffff;
          border-radius: 12px;
          padding: 11px 16px;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.04em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 6px 18px rgba(7, 59, 63, 0.22);
          transition: all 180ms ease;
        }

        .role-drawer-login-btn:hover {
          transform: translateY(-1px);
          background: #0E585E;
          box-shadow: 0 8px 22px rgba(7, 59, 63, 0.3);
        }

        .role-drawer-tagline {
          text-align: center;
          font-size: 9.5px;
          color: #9F6130;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 700;
          padding-top: 6px;
          border-top: 1px solid rgba(204, 168, 129, 0.35);
        }
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
          display: none;
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
            display: flex;
            align-items: center;
            justify-content: center;
            border: 0;
            background: transparent;
            color: #8b551e;
            cursor: pointer;
            padding: 0;
          }

          .cn-search-overlay-voice.is-listening {
            color: #C92035;
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
        }
      `}</style>

      <header className="exact-nav">
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
            <button type="button" className="cn-compact-icon" onClick={() => setMobileSearchOpen(true)} aria-label="Search">
              <Icon name="search" size={19} />
            </button>
            {isLoggedIn && (
              <>
                <button type="button" className="cn-compact-aug-pill" onClick={() => requireLogin("/recharge")} title="AUG Coin Wallet">
                  <Icon name="star" size={12} />
                  <span>AUG</span>
                </button>
                <button type="button" className="cn-compact-icon" onClick={() => requireLogin("/aug-products")} aria-label="AUG Coins" title="Shop with Coins">
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
          <div className="cn-search-overlay">
            <div className="cn-search-overlay-bar">
              <button type="button" className="cn-search-overlay-back" onClick={() => setMobileSearchOpen(false)} aria-label="Back">
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
                  placeholder="Search for Products, Brands and More"
                />
                <button
                  type="button"
                  className={`cn-search-overlay-voice ${voiceListening ? "is-listening" : ""}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={startVoiceSearch}
                  disabled={!voiceSupported}
                  aria-label={voiceListening ? "Stop voice search" : "Search by voice"}
                >
                  <Icon name="mic" size={17} />
                </button>
              </div>
            </div>

            <div className="cn-search-overlay-body">
              {searchQuery.trim() === "" ? (
                recentSearches.length > 0 && (
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
                )
              ) : (
                <div className="cn-search-results">
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

            <div className="exact-search-wrap">
              <div className="exact-search">
                <Icon name="search" size={18} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() =>
                    searchResults.length && setShowSearchDrop(true)
                  }
                  onBlur={() => setTimeout(() => setShowSearchDrop(false), 180)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitSearch();
                  }}
                  placeholder="Search gold & silver jewellery..."
                />
                <button
                  className={`exact-voice-btn ${voiceListening ? "is-listening" : ""}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={startVoiceSearch}
                  disabled={!voiceSupported}
                  title={
                    voiceSupported
                      ? voiceListening
                        ? "Stop voice search"
                        : "Search by voice"
                      : "Voice search is not supported in this browser"
                  }
                  aria-label={
                    voiceListening ? "Stop voice search" : "Search by voice"
                  }
                >
                  <Icon name="mic" size={17} />
                </button>
              </div>

              {showSearchDrop && (
                <div className="exact-results">
                  {searchLoading && (
                    <div
                      style={{
                        padding: 12,
                        color: "var(--bb-muted)",
                        fontWeight: 900,
                      }}
                    >
                      Searching...
                    </div>
                  )}
                  {!searchLoading && searchResults.length === 0 && (
                    <div
                      style={{
                        padding: 12,
                        color: "var(--bb-muted)",
                        fontWeight: 900,
                      }}
                    >
                      No products found
                    </div>
                  )}
                  {searchResults.map((product) => (
                    <button
                      className="exact-result"
                      type="button"
                      key={product.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setShowSearchDrop(false);
                        setSearchQuery("");
                        navigate(
                          `/product-display?category=${product.category}&metal=${product.metal}&id=${product.id}`,
                        );
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
                          {product.metal?.toUpperCase()} - {product.category} -{" "}
                          {money(product.price)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

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
                    title="AUG Coin Wallet"
                  >
                    <Icon name="star" size={15} />{" "}
                    <span className="summary-text">AUG</span>
                  </button>

                  <button
                    className="exact-coin-icon-btn"
                    type="button"
                    onClick={() => requireLogin("/aug-products")}
                    title="Shop with Coins"
                    aria-label="AUG Coins"
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

        <nav className="exact-menu">
          <div className="exact-inner">
            {menuItems.map((item) => {
              const sections = megaByLabel[item.label];

              return (
                <div
                  className={`exact-menu-item ${activeMega === item.label ? "is-open" : ""}`}
                  key={item.label}
                  onMouseEnter={() =>
                    setActiveMega(sections ? item.label : null)
                  }
                  onMouseLeave={() => setActiveMega(null)}
                >
                  <button
                    className="exact-menu-button"
                    type="button"
                    onClick={() => {
                      setActiveMega(null);
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
                        ref={el => { megaRefs.current[item.label] = el; }}
                        onClick={() => setActiveMega(null)}
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
                            {section.links.map(([label, route]) => (
                              <Link
                                className="exact-mega-link"
                                key={label}
                                to={route}
                              >
                                {label}
                              </Link>
                            ))}
                            <Link
                              className="exact-mega-view"
                              to={section.viewAll[1]}
                            >
                              {section.viewAll[0]} -&gt;
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

        <div className={`exact-mobile-menu ${mobileOpen ? "open" : ""}`}>
          <div className="mobile-menu-header">
            <div className="mobile-user-info">
              <div className="mobile-user-avatar">
                <Icon name="user" size={20} />
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
              <Icon name="close" size={18} />
            </button>
          </div>

          {rates && (
            <div className="mobile-menu-rates">
              <span>Gold 22K: {money(rates?.gold_22k)}</span>
              <span>Silver: {money(rates?.silver_999)}</span>
            </div>
          )}

          {/* User Requested Exact Order:
              1. Wishlist
              2. Cart
              3. AUG Coins
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
                  <Icon name="heart" size={17} />
                </span>
                <span className="mobile-service-label">Wishlist</span>
              </div>
              {wishlistCount > 0 ? (
                <span className="mobile-service-badge">{wishlistCount}</span>
              ) : (
                <span className="mobile-service-arrow">›</span>
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
                  <Icon name="cart" size={17} />
                </span>
                <span className="mobile-service-label">Cart</span>
              </div>
              {cartCount > 0 ? (
                <span className="mobile-service-badge">{cartCount}</span>
              ) : (
                <span className="mobile-service-arrow">›</span>
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
                    <Icon name="coin" size={17} />
                  </span>
                  <span className="mobile-service-label">AUG Coins</span>
                </div>
                <span className="mobile-service-tag">Rewards</span>
              </button>
            )}

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
                  <Icon name="shop" size={17} />
                </span>
                <span className="mobile-service-label">Nearby Shop</span>
              </div>
              <span className="mobile-service-arrow">›</span>
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
                  <Icon name="user" size={17} />
                </span>
                <span className="mobile-service-label">Profile</span>
              </div>
              <span className="mobile-service-arrow">›</span>
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
                  <Icon name="truck" size={17} />
                </span>
                <span className="mobile-service-label">Order Summary</span>
              </div>
              <span className="mobile-service-arrow">›</span>
            </button>

            {isLoggedIn && role === 'super_admin' && (
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
                    <Icon name="userPlus" size={17} />
                  </span>
                  <span className="mobile-service-label">Create Customer</span>
                </div>
                <span className="mobile-service-arrow">›</span>
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
                    <Icon name="refresh" size={17} />
                  </span>
                  <span className="mobile-service-label">{roleSwitchCfg.label}</span>
                </div>
                <span className="mobile-service-arrow">›</span>
              </button>
            )}
          </div>

          <div className="mobile-menu-divider-label">Shop by Category</div>
          <div className="mobile-menu-grid">
            {menuItems.map((item) => (
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
                <span className="mobile-cat-icon"><Icon name={item.icon || "star"} size={16} /></span>
                <span className="mobile-cat-label">{item.label}</span>
              </button>
            ))}
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
              <Icon name={isLoggedIn ? "logout" : "user"} size={16} />
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
          <div className="role-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="role-drawer-top-accent" />

            <div className="role-drawer-head">
              <div className="role-drawer-brand">
                <span className="role-drawer-logo-mark">A</span>
                <div>
                  <h4 className="role-drawer-brand-title">ATHIRAI</h4>
                  <small className="role-drawer-brand-sub">Exclusive Services</small>
                </div>
              </div>
              <button
                className="role-drawer-close"
                type="button"
                onClick={() => setRoleDrawerOpen(false)}
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            {/* Profile banner */}
            <div className="role-drawer-user-card">
              <div className="role-drawer-avatar">
                {isLoggedIn ? (
                  (localStorage.getItem("email") || "C").charAt(0).toUpperCase()
                ) : (
                  <Icon name="user" size={20} />
                )}
              </div>
              <div className="role-drawer-user-meta">
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
                    <Icon name="heart" size={17} filled={wishlistCount > 0} />
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
                    <Icon name="chevronRight" size={16} />
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
                    <Icon name="cart" size={17} />
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
                    <Icon name="chevronRight" size={16} />
                  </span>
                )}
              </button>

              {/* 3. AUG Coins */}
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
                      <Icon name="coin" size={17} />
                    </span>
                    <div className="role-drawer-item-labels">
                      <span className="role-drawer-item-title">AUG Coins</span>
                      <span className="role-drawer-item-desc">Shop with gold coin rewards</span>
                    </div>
                  </div>
                  <span className="role-drawer-chevron">
                    <Icon name="chevronRight" size={16} />
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
                    <Icon name="shop" size={17} />
                  </span>
                  <div className="role-drawer-item-labels">
                    <span className="role-drawer-item-title">Nearby Shop</span>
                    <span className="role-drawer-item-desc">Locate showroom & timings</span>
                  </div>
                </div>
                <span className="role-drawer-chevron">
                  <Icon name="chevronRight" size={16} />
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
                    <Icon name="user" size={17} />
                  </span>
                  <div className="role-drawer-item-labels">
                    <span className="role-drawer-item-title">Profile</span>
                    <span className="role-drawer-item-desc">Personal details & address</span>
                  </div>
                </div>
                <span className="role-drawer-chevron">
                  <Icon name="chevronRight" size={16} />
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
                    <Icon name="receipt" size={17} />
                  </span>
                  <div className="role-drawer-item-labels">
                    <span className="role-drawer-item-title">Order Summary</span>
                    <span className="role-drawer-item-desc">Track status & invoices</span>
                  </div>
                </div>
                <span className="role-drawer-chevron">
                  <Icon name="chevronRight" size={16} />
                </span>
              </button>

              {/* 7. Create Customer — Super Admin mattum */}
              {isLoggedIn && role === 'super_admin' && (
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
                      <Icon name="userPlus" size={17} />
                    </span>
                    <div className="role-drawer-item-labels">
                      <span className="role-drawer-item-title">Create Customer</span>
                      <span className="role-drawer-item-desc">Onboard customer account</span>
                    </div>
                  </div>
                  <span className="role-drawer-chevron">
                    <Icon name="chevronRight" size={16} />
                  </span>
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
                      <Icon name="role" size={17} />
                    </span>
                    <div className="role-drawer-item-labels">
                      <span className="role-drawer-item-title">{roleSwitchCfg.label}</span>
                      <span className="role-drawer-item-desc">Switch role dashboard</span>
                    </div>
                  </div>
                  <span className="role-drawer-chevron">
                    <Icon name="chevronRight" size={16} />
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
                  <Icon name="logout" size={16} />
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
                  <Icon name="user" size={16} />
                  <span>Login / Register</span>
                </button>
              )}
              <div className="role-drawer-tagline">
                ✦ BIS 100% Hallmarked • Secure Shopping ✦
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`exact-nav-spacer ${isCompactRoute ? "cn-compact-spacer-height" : ""}`} aria-hidden="true" />
    </>
  );
}