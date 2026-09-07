// categoryConfig.js
// Shared subcategory list — Navbar, Super Admin product form, AllCollection.jsx
// moonu file-um idha irundhu than data edukkum. Puthu subcategory add pannanumna
// idhula oru line add pannina podhum — moonu place-layum automatic-a varum.

export const CATEGORY_SUBCATEGORIES = {
  goldcoin: {
    gold: ["100 mg Gold Coin", "200 mg Gold Coin", "500 mg Gold Coin", "1 gm Gold Coin", "2 gm Gold Coin", "4 gm Gold Coin", "8 gm Gold Coin", "16 gm Gold Coin", "40 gm Gold Coin", "Gold Lakshmi Coin", "Gold Ganesha Coin", "Gold Gift Coin"],
    silver: ["500 mg Silver Coin", "1 gm Silver Coin", "2 gm Silver Coin", "5 gm Silver Coin", "10 gm Silver Coin", "20 gm Silver Coin", "50 gm Silver Coin", "100 gm Silver Coin", "Silver Lakshmi Coin", "Silver Ganesha Coin", "Silver Gift Coin"],
  },
  rings: {
    gold: ["Plain Gold Rings", "Gemstone Gold Rings", "Engagement Rings", "Couple Rings", "Kids Rings"],
    silver: ["Plain Silver Rings", "Oxidised Silver Rings", "Adjustable Silver Rings", "Designer Silver Rings", "Couple Silver Rings", "Stone Silver Rings", "Kids Silver Rings", "Men's Silver Rings"],
    wedding: ["Engagement Rings", "Wedding Rings", "Kundan Rings", "Temple Rings", "Couple Rings", "Antique Rings", "Polki Rings"],
  },
  earrings: {
    gold: ["Stud Earrings", "Jhumka Earrings", "Hoop Earrings", "Drop Earrings", "Sui Dhaga Earrings", "Kids Earrings"],
    silver: ["Stud Earrings", "Drop Earrings", "Jhumka Earrings", "Hoop Earrings", "Oxidised Earrings", "Chandbali Earrings", "Ear Cuffs", "Kids Silver Earrings"],
    wedding: ["Jhumka Earrings", "Kundan Earrings", "Temple Earrings", "Chandbali Earrings", "Polki Earrings", "Long Earrings", "Stud Earrings", "Drop Earrings"],
  },
  bangles: {
    gold: ["Plain Gold Bangles", "Traditional Bangles", "Kada Bangles", "Kids Bangles"],
    silver: ["Plain Silver Bangles", "Oxidised Bangles", "Designer Bangles", "Kada Bangles", "Stone Bangles", "Beaded Bangles", "Adjustable Bangles", "Kids Bangles"],
    wedding: ["Gold Bangles", "Kundan Bangles", "Antique Bangles", "Polki Bangles", "Kada Bangles", "Temple Bangles", "Designer Bangles", "Bangle Sets"],
  },
  bracelets: {
    gold: [],
    silver: ["Chain Bracelets", "Charms Bracelets", "Cuff Bracelets", "ID Bracelets", "Beaded Bracelets", "Mangalsutra Bracelets", "Kids Bracelets", "Men's Bracelets"],
  },
  pendants: {
    gold: ["Religious Pendants", "Initial Pendants", "Gemstone Pendants", "Kids Pendants"],
    silver: ["Religious Pendants", "Initial Pendants", "Heart Pendants", "Kids Pendants", "Motif Pendants", "Oxidised Pendants", "Stone Pendants", "Personalised Pendants"],
  },
  chains: {
    gold: ["Plain Gold Chains", "Rope Chains", "Box Chains", "Figaro Chains", "Beaded Chains"],
    silver: ["Plain Silver Chains", "Rope Chains", "Box Chains", "Figaro Chains", "Beaded Chains"],
  },
  necklaces: {
    gold: ["Plain Gold Necklaces", "Traditional Necklaces", "Temple Necklaces", "Chain Necklaces", "Mangalsutra Necklaces"],
    silver: ["Chains", "Pendant Necklaces", "Choker Necklaces", "Oxidised Necklaces", "Layered Necklaces", "Beaded Necklaces", "Statement Necklaces", "Mangalsutra Necklaces"],
    wedding: ["Temple Necklaces", "Kundan Necklaces", "Antique Necklaces", "Polki Necklaces", "Traditional Necklaces", "Long Haaram", "Choker Necklaces", "Rani Haar"],
  },
  mangalsutra: {
    gold: ["Traditional Mangalsutra", "Beaded Mangalsutra", "Short Mangalsutra", "Gold Mangalsutra Set"],
    silver: ["Silver Mangalsutra", "Silver Black Bead Mangalsutra", "Silver Short Mangalsutra"],
    wedding: ["Traditional Mangalsutra", "Beaded Mangalsutra", "Pendant Mangalsutra", "Short Mangalsutra", "Gold Mangalsutra", "Black Bead Mangalsutra", "Mangalsutra Sets"],
  },
  anklets: {
    gold: ["Gold Anklets", "Beaded Gold Anklets", "Kids Gold Anklets", "Bridal Gold Anklets"],
    silver: ["Plain Silver Anklets", "Oxidised Anklets", "Beaded Anklets", "Charm Anklets", "Designer Anklets", "Pair Anklets", "Kids Anklets", "Temple Anklets"],
  },
  coins: {
    gold: ["Gold Coins", "Gold Bars", "Gift Coins", "Religious Coins", "Collectible Coins"],
    silver: ["1g Silver Coins", "2g Silver Coins", "5g Silver Coins", "10g Silver Coins", "20g Silver Coins", "50g Silver Coins", "100g Silver Coins"],
  },
  nosepin: {
    gold: ["Gold Nose Pin", "Gold Stud Nose Pin", "Gold Hoop Nose Pin", "Bridal Gold Nose Pin"],
    silver: ["Silver Nose Pin", "Oxidised Silver Nose Pin", "Silver Stud Nose Pin"],
  },
  // toerings, cufflinks, brooches, tiepins — subcategory venumna appuram add pannalam
  toerings: { gold: [], silver: [] },
  cufflinks: { gold: [], silver: [] },
  brooches: { gold: [], silver: [] },
  tiepins: { gold: [], silver: [] },
};

// Category-level metadata — Navbar mega menu title/icon/route ku
export const CATEGORY_META = {
  rings:      { title: "Rings",      icon: "◌" },
  earrings:   { title: "Earrings",   icon: "♢" },
  bangles:    { title: "Bangles",    icon: "◯" },
  bracelets:  { title: "Bracelets",  icon: "◌" },
  pendants:   { title: "Pendants",   icon: "♤" },
  chains:     { title: "Chains",     icon: "⌁" },
  necklaces:  { title: "Necklaces",  icon: "♧" },
  mangalsutra:{ title: "Mangalsutra",icon: "♧" },
  anklets:    { title: "Anklets",    icon: "⌁" },
  coins:      { title: "Coins",      icon: "◎" },
};

export function getSubcategories(category, metal) {
  return CATEGORY_SUBCATEGORIES[category]?.[metal] || [];
}

// ── Gifting — thani structure, metal/category illama gift_tag vachi
// group aaguthu. Ovvoru tag-kkum keezhe gift_type options iruku ──
export const GIFTING_SUBCATEGORIES = {
  Her: ["Necklaces", "Earrings", "Rings", "Bracelets", "Pendants", "Bangles", "Mangalsutra", "Nose Pins"],
  Him: ["Chains", "Bracelets", "Rings", "Pendants", "Cufflinks", "Tie Pins", "Men's Kada", "Coins & Bars"],
  Kids: ["Baby Jewellery", "Chains", "Earrings", "Bracelets", "Nazariya", "Anklets", "Pendants", "ID Bracelets"],
  Couple: ["Couple Rings", "Couple Pendants", "Matching Bracelets", "His & Her Sets", "Engagement Gifts", "Anniversary Gifts", "Personalised Gifts"],
  Parents: ["Gold Coins", "Religious Pendants", "Chains", "Bracelets", "Rings", "Pooja Articles", "Silver Articles", "Health Pendants"],
  Occasion: ["Birthday Gifts", "Anniversary Gifts", "Wedding Gifts", "Housewarming Gifts", "Festive Gifts", "Graduation Gifts", "Promotion Gifts", "Baby Shower Gifts"],
  Corporate: ["Gold Coins", "Silver Coins", "Desk Accessories", "Pen Sets", "Customized Coins", "Mementos", "Trophies", "Premium Sets"],
  Religious: ["Gold Idols", "Silver Idols", "Pooja Items", "Religious Pendants", "Yantra Pendants", "Mala & Chains", "Temple Jewellery", "Spiritual Coins"],
};

export function getGiftingSubcategories(tag) {
  return GIFTING_SUBCATEGORIES[tag] || [];
}

// Wedding/bridal type list — navbar's Wedding mega-menu ku matching data.
// Category select pannina, andha category ku matching bridal types mattum kaatum.
export const WEDDING_SUBCATEGORIES = {
  rings: ["Engagement Rings", "Wedding Rings", "Kundan Rings", "Temple Rings", "Couple Rings", "Antique Rings", "Polki Rings"],
  necklaces: ["Temple Necklaces", "Kundan Necklaces", "Antique Necklaces", "Polki Necklaces", "Traditional Necklaces", "Long Haaram", "Choker Necklaces", "Rani Haar"],
  bangles: ["Gold Bangles", "Kundan Bangles", "Antique Bangles", "Polki Bangles", "Kada Bangles", "Temple Bangles", "Designer Bangles"],
  earrings: ["Jhumka Earrings", "Kundan Earrings", "Temple Earrings", "Chandbali Earrings", "Polki Earrings", "Long Earrings", "Stud Earrings", "Drop Earrings"],
  mangalsutra: ["Traditional Mangalsutra", "Beaded Mangalsutra", "Pendant Mangalsutra", "Short Mangalsutra", "Gold Mangalsutra", "Black Bead Mangalsutra", "Mangalsutra Sets"],
};

export function getWeddingSubcategories(category) {
  return WEDDING_SUBCATEGORIES[category] || [];
}

// Gift Tags sub-list — navbar's Gifting mega-menu ku matching data.
// Admin oru gift tag (Her/Him/Kids...) select pannina, andha tag-oda specific items mattum dropdown la varum.
export const GIFT_TAG_SUBCATEGORIES = {
  her: ["Necklaces", "Earrings", "Rings", "Bracelets", "Pendants", "Bangles", "Mangalsutra", "Nose Pins"],
  him: ["Chains", "Bracelets", "Rings", "Pendants", "Cufflinks", "Tie Pins", "Men's Kada", "Coins & Bars"],
  kids: ["Baby Jewellery", "Chains", "Earrings", "Bracelets", "Nazariya", "Anklets", "Pendants", "ID Bracelets"],
  couple: ["Couple Rings", "Couple Pendants", "Matching Bracelets", "His & Her Sets", "Engagement Gifts", "Anniversary Gifts", "Personalised Gifts"],
  parents: ["Gold Coins", "Religious Pendants", "Chains", "Bracelets", "Rings", "Pooja Articles", "Silver Articles", "Health Pendants"],
  occasion: ["Birthday Gifts", "Anniversary Gifts", "Wedding Gifts", "Housewarming Gifts", "Festive Gifts", "Graduation Gifts", "Promotion Gifts", "Baby Shower Gifts"],
  corporate: ["Gold Coins", "Silver Coins", "Desk Accessories", "Pen Sets", "Customized Coins", "Mementos", "Trophies", "Premium Sets"],
  religious: ["Gold Idols", "Silver Idols", "Pooja Items", "Religious Pendants", "Yantra Pendants", "Mala & Chains", "Temple Jewellery", "Spiritual Coins"],
};

export function getGiftSubcategories(tag) {
  return GIFT_TAG_SUBCATEGORIES[tag?.toLowerCase()] || [];
}