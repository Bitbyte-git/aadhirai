from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import JewelryProduct, JewelryProductImage, MetalRate, User


DEFAULT_RATES = {
    "gold_22k": Decimal("6800.00"),
    "gold_24k": Decimal("7400.00"),
    "silver_999": Decimal("110.00"),
    "diamond_18k": Decimal("5200.00"),
    "diamond_22k": Decimal("6800.00"),
    "platinum_92": Decimal("3600.00"),
}

IMAGE_SETS = {
    "rings": [
        "frontend/public/img/gold/gold-ring-1.png",
        "frontend/public/img/gold/gold-ring-2.png",
        "frontend/public/img/gold/gold-ring-3.png",
        "frontend/public/img/silver/silver-ring-1.png",
        "frontend/public/banners/diamond_ring.png",
    ],
    "necklaces": [
        "frontend/public/img/gold/gold-necklace-1.png",
        "frontend/public/img/gold/gold-necklace-2.png",
        "frontend/public/img/silver/silver-necklace-1.png",
        "frontend/public/banners/diamond_necklace.png",
        "frontend/public/banners/Platinum_necklace.png",
    ],
    "bangles": [
        "frontend/public/img/gold/gold-bangles-1.png",
        "frontend/public/img/gold/gold-bangles-2.png",
        "frontend/public/img/silver/silver-bangle-1.png",
        "frontend/public/banners/diamond_bangles.png",
        "frontend/public/banners/platinum_banhgles.png",
    ],
    "bracelets": [
        "frontend/public/img/gold/gold_bracelet.jpg",
        "frontend/public/img/silver/silver_bracelet.jpg",
        "frontend/public/banners/gold_bracelet.png",
        "frontend/public/banners/diamond_Brecelet.png",
        "frontend/public/banners/Platinum_Brecelet.png",
    ],
    "earrings": [
        "frontend/public/img/gold/gold-earrings-1.png",
        "frontend/public/img/gold/gold-earrings-2.png",
        "frontend/public/img/silver/silver-Earrings-1.png",
        "frontend/public/banners/diamond_earrings.png",
        "frontend/public/banners/Platinum_Earrings.png",
    ],
    "chains": [
        "frontend/public/img/gold/gold chain-1.png",
        "frontend/public/img/gold/gold chain-2.png",
        "frontend/public/img/silver/silver-chain-1.png",
        "frontend/public/banners/diamond_chian.png",
        "frontend/public/banners/platinum_chain.png",
    ],
    "pendants": [
        "frontend/public/Gold/platinum_necklas.jpg",
        "frontend/public/Gold/wedding_necklaces.jpg",
        "frontend/public/Gold/diamond_necklas.jpg",
        "frontend/public/img/gold/gold-necklace-3.png",
        "frontend/public/img/silver/silver-necklace-2.png",
    ],
    "mangalsutra": [
        "frontend/public/Gold/black_necklaces.png",
        "frontend/public/Gold/wedding_necklaces.jpg",
        "frontend/public/marriage_woman.jpg",
        "frontend/public/img/gold/gold-necklace-4.png",
        "frontend/public/banners/diamond_necklace.png",
    ],
    "anklets": [
        "frontend/public/img/silver/silver-chain-2.png",
        "frontend/public/img/silver/silver-chain-3.png",
        "frontend/public/img/gold/gold chain-3.png",
        "frontend/public/Traditional Wear.jpg",
        "frontend/public/Casual Wear.jpg",
    ],
    "nosepin": [
        "frontend/public/img/gold/gold-earrings-3.png",
        "frontend/public/img/silver/silver-Earrings-2.png",
        "frontend/public/diamond Earings.jpg",
        "frontend/public/banners/gold_earrings.png",
        "frontend/public/banners/silver_earrings.png",
    ],
    "toerings": [
        "frontend/public/img/silver/silver-ring-2.png",
        "frontend/public/img/silver/silver-ring-3.png",
        "frontend/public/img/gold/gold-ring-4.png",
        "frontend/public/Casual Wear.png",
        "frontend/public/Traditional Wear.png",
    ],
    "cufflinks": [
        "frontend/public/Men's Jewellery.jpg",
        "frontend/public/Gold/platinum_ring.jpg",
        "frontend/public/img/silver/silver-ring-4.png",
        "frontend/public/banners/platinum_ring.png",
        "frontend/public/banners/gold_ring.png",
    ],
    "brooches": [
        "frontend/public/wedding.png",
        "frontend/public/gift_wedding.jpg",
        "frontend/public/diamond-women.png",
        "frontend/public/Gold/gold-women.png",
        "frontend/public/Gold/platinum_necklas.jpg",
    ],
    "tiepins": [
        "frontend/public/Men's Jewellery.jpg",
        "frontend/public/img/gold/gold chain-4.png",
        "frontend/public/img/silver/silver-chain-4.png",
        "frontend/public/Gold/platinam_chain.jpg",
        "frontend/public/banners/gold_chian.png",
    ],
    "coins": [
        "frontend/public/Gold/gold-coin.jpg.jpeg",
        "frontend/public/Gold/silver-coin.jpg.jpeg",
        "frontend/public/banners/Gold coin.png",
        "frontend/public/banners/Silver coin.png",
        "frontend/public/Gold/coin_promote.png",
    ],
}

COMMON_SEARCH_KEYWORDS = [
    "Bestseller",
    "New",
    "Premium",
    "Light Weight Jewellery",
    "Minimal Collection",
    "Gift For Her",
    "Gift For Him",
    "Gifts For Her",
    "Gifts For Him",
    "Gifts For Kids",
    "Kids Jewellery",
    "Corporate Gifts",
    "Anniversary Gifts",
    "Birthday Gifts",
    "Personalised Gifts",
    "Religious Gifts",
]

METAL_SEARCH_KEYWORDS = {
    "gold": [
        "Gold Jewellery",
        "Plain Gold Rings",
        "Diamond Gold Rings",
        "Gemstone Gold Rings",
        "Engagement Rings",
        "Couple Rings",
        "Kids Rings",
        "Stud Earrings",
        "Jhumka Earrings",
        "Hoop Earrings",
        "Drop Earrings",
        "Sui Dhaga Earrings",
        "Kids Earrings",
        "Plain Gold Necklaces",
        "Traditional Necklaces",
        "Temple Necklaces",
        "Chain Necklaces",
        "Diamond Necklaces",
        "Mangalsutra Necklaces",
        "Religious Pendants",
        "Diamond Pendants",
        "Initial Pendants",
        "Gemstone Pendants",
        "Kids Pendants",
        "Plain Gold Bangles",
        "Diamond Bangles",
        "Traditional Bangles",
        "Kada Bangles",
        "Kids Bangles",
        "Plain Gold Chains",
        "Rope Chains",
        "Box Chains",
        "Figaro Chains",
        "Beaded Chains",
        "Traditional Mangalsutra",
        "Diamond Mangalsutra",
        "Beaded Mangalsutra",
        "Short Mangalsutra",
        "Gold Mangalsutra Set",
        "Gold Coins",
        "Gold Bars",
        "Gift Coins",
        "Religious Coins",
        "Collectible Coins",
    ],
    "diamond": [
        "Diamond Jewellery",
        "Solitaire Collection",
        "Solitaire Rings",
        "Engagement Rings",
        "Wedding Rings",
        "Cocktail Rings",
        "Fashion Rings",
        "Cluster Rings",
        "Men's Diamond Rings",
        "Kids Diamond Rings",
        "Stud Earrings",
        "Drop Earrings",
        "Hoop Earrings",
        "Jhumka Earrings",
        "Sui Dhaga Earrings",
        "Chandbali Earrings",
        "Party Wear Earrings",
        "Kids Diamond Earrings",
        "Solitaire Pendants",
        "Halo Pendants",
        "Religious Pendants",
        "Initial Pendants",
        "Heart Pendants",
        "Shape Pendants",
        "Fancy Pendants",
        "Kids Diamond Pendants",
        "Solitaire Necklaces",
        "Tennis Necklaces",
        "Cluster Necklaces",
        "Bridal Necklaces",
        "Choker Necklaces",
        "Long Necklaces",
        "Mang Tikka / Neck Sets",
        "Contemporary Necklaces",
        "Tennis Bracelets",
        "Chain Bracelets",
        "Bangle Bracelets",
        "Charm Bracelets",
        "Cuff Bracelets",
        "ID Bracelets",
        "Men's Bracelets",
        "Line Bangles",
        "Bracelet Bangles",
        "Openable Bangles",
        "Designer Bangles",
        "Party Wear Bangles",
        "Single Line Mangalsutra",
        "Tanmaniya Mangalsutra",
        "Pendant Mangalsutra",
        "Diamond Mangalsutra Set",
        "Contemporary Mangalsutra",
        "Round Diamond",
        "Princess Cut",
        "Oval Diamond",
        "Pear Shape",
        "Emerald Cut",
        "Cushion Cut",
        "Marquise Cut",
    ],
    "platinum": [
        "Platinum Jewellery",
        "Men's Platinum",
        "Men's Platinum Rings",
        "Women's Platinum Rings",
        "Couple Platinum Rings",
        "Engagement Platinum Rings",
        "Wedding Platinum Rings",
        "Fashion Platinum Rings",
        "Kids Platinum Rings",
        "Stud Earrings",
        "Drop Earrings",
        "Hoop Earrings",
        "Jhumka Earrings",
        "Sui Dhaga Earrings",
        "Chandbali Earrings",
        "Ear Cuffs",
        "Initial Pendants",
        "Religious Pendants",
        "Heart Pendants",
        "Solitaire Pendants",
        "Shape Pendants",
        "Fancy Pendants",
        "Kids Pendants",
        "Chains",
        "Solitaire Necklaces",
        "Layered Necklaces",
        "Symbol Necklaces",
        "Choker Necklaces",
        "Long Necklaces",
        "Mangalsutra Necklaces",
        "Chain Bracelets",
        "Tennis Bracelets",
        "Bangle Bracelets",
        "Cuff Bracelets",
        "ID Bracelets",
        "Charm Bracelets",
        "Men's Bracelets",
        "Plain Bangles",
        "Diamond Bangles",
        "Openable Bangles",
        "Designer Bangles",
        "Kada Bangles",
        "Slim Bangles",
        "Stackable Bangles",
        "Men's Chains",
        "Women's Chains",
        "Rope Chains",
        "Box Chains",
        "Figaro Chains",
        "Snake Chains",
        "Bead Chains",
        "Love Collection",
        "Infinity Collection",
        "Minimal Collection",
        "Men's Collection",
        "Wedding Collection",
        "Kids Collection",
        "Office Wear Collection",
    ],
    "silver": [
        "Silver Jewellery",
        "Silver Coins & Items",
        "Plain Silver Rings",
        "Oxidised Silver Rings",
        "Adjustable Silver Rings",
        "Designer Silver Rings",
        "Couple Silver Rings",
        "Stone Silver Rings",
        "Kids Silver Rings",
        "Men's Silver Rings",
        "Stud Earrings",
        "Drop Earrings",
        "Jhumka Earrings",
        "Hoop Earrings",
        "Oxidised Earrings",
        "Chandbali Earrings",
        "Ear Cuffs",
        "Kids Silver Earrings",
        "Religious Pendants",
        "Initial Pendants",
        "Heart Pendants",
        "Kids Pendants",
        "Motif Pendants",
        "Oxidised Pendants",
        "Stone Pendants",
        "Personalised Pendants",
        "Chains",
        "Pendant Necklaces",
        "Choker Necklaces",
        "Oxidised Necklaces",
        "Layered Necklaces",
        "Beaded Necklaces",
        "Statement Necklaces",
        "Mangalsutra Necklaces",
        "Chain Bracelets",
        "Charms Bracelets",
        "Cuff Bracelets",
        "ID Bracelets",
        "Beaded Bracelets",
        "Mangalsutra Bracelets",
        "Kids Bracelets",
        "Men's Bracelets",
        "Plain Silver Bangles",
        "Oxidised Bangles",
        "Designer Bangles",
        "Kada Bangles",
        "Stone Bangles",
        "Beaded Bangles",
        "Adjustable Bangles",
        "Kids Bangles",
        "Plain Silver Anklets",
        "Oxidised Anklets",
        "Beaded Anklets",
        "Charm Anklets",
        "Designer Anklets",
        "Pair Anklets",
        "Kids Anklets",
        "Temple Anklets",
        "Silver Articles",
        "Pooja Articles",
        "Silver Utensils",
        "Home Decor",
        "Gift Articles",
        "Return Gifts",
        "Corporate Gifts",
        "Kids Articles",
    ],
}

CATEGORY_SEARCH_KEYWORDS = {
    "rings": ["Gold Rings", "Diamond Rings", "Platinum Rings", "Silver Rings", "Bridal Rings", "Daily Wear Rings", "Rings for Men", "Couple Rings"],
    "earrings": ["Gold Earrings", "Diamond Earrings", "Platinum Earrings", "Silver Earrings", "Bridal Earrings", "Daily Wear Earrings"],
    "necklaces": ["Gold Necklaces", "Diamond Necklaces", "Platinum Necklaces", "Silver Necklaces", "Bridal Necklaces", "Necklace Sets", "Long Haaram", "Rani Haar"],
    "pendants": ["Gold Pendants", "Diamond Pendants", "Platinum Pendants", "Silver Pendants", "Daily Wear Pendants", "Health Pendants", "Yantra Pendants", "Pendants for Men"],
    "bangles": ["Gold Bangles", "Diamond Bangles", "Platinum Bangles", "Silver Bangles", "Wedding Bangles", "Bridal Bangles", "Bangle Sets"],
    "chains": ["Gold Chains", "Platinum Chains", "Silver Chains", "Daily Wear Chains", "Chains for Men", "Mala & Chains"],
    "mangalsutra": ["Gold Mangalsutra", "Diamond Mangalsutra", "Black Bead Mangalsutra", "Mangalsutra Sets"],
    "anklets": ["Silver Anklets", "Anklets", "Pair Anklets", "Kids Anklets", "Temple Anklets"],
    "nosepin": ["Nose Pins", "Gold Nose Pin", "Nose Pin"],
    "toerings": ["Toe Rings"],
    "cufflinks": ["Cufflinks"],
    "brooches": ["Brooches"],
    "tiepins": ["Tie Pins"],
    "coins": [
        "Gold Coins",
        "Silver Coins",
        "Gold Bars",
        "Silver Bars",
        "Collectible Coins",
        "Temple Coins",
        "24K Gold Coins",
        "22K Gold Coins",
        "18K Gold Coins",
        "10g Gold Coins",
        "20g Gold Coins",
        "1/2 Sovereign Coins",
        "1 Sovereign Coins",
        "2 Sovereign Coins",
        "1g Gold Bars",
        "2g Gold Bars",
        "5g Gold Bars",
        "10g Gold Bars",
        "20g Gold Bars",
        "50g Gold Bars",
        "100g Gold Bars",
        "500g Gold Bars",
        "999 Silver Coins",
        "925 Silver Coins",
        "10g Silver Coins",
        "20g Silver Coins",
        "50g Silver Coins",
        "100g Silver Coins",
        "250g Silver Coins",
        "500g Silver Coins",
        "10g Silver Bars",
        "20g Silver Bars",
        "50g Silver Bars",
        "100g Silver Bars",
        "250g Silver Bars",
        "500g Silver Bars",
        "1kg Silver Bars",
        "5kg Silver Bars",
        "Lakshmi Coins",
        "Ganesha Coins",
        "Krishna Coins",
        "Rama Coins",
        "Hanuman Coins",
        "Swami Coins",
        "Religious Coins",
        "Limited Edition Coins",
        "Diwali Coins",
        "Dhanteras Coins",
        "Akshaya Tritiya Coins",
        "Navratri Coins",
        "Pongal Coins",
        "Ganesh Chaturthi Coins",
        "Birthday Coins",
        "Baby Gift Coins",
        "Wedding Gift Coins",
        "Anniversary Coins",
        "Corporate Gift Coins",
        "Return Gift Coins",
        "Naming Ceremony Coins",
        "Housewarming Coins",
        "24K Investment Coins",
        "22K Investment Coins",
        "Low Premium Coins",
        "High Resale Coins",
        "Popular Investment Coins",
        "Certified Investment Coins",
        "Investment Coins",
        "Festival Coins",
        "Gift Coins",
    ],
}

WEDDING_SEARCH_KEYWORDS = [
    "Bridal Sets",
    "Temple Jewellery",
    "Kundan Jewellery",
    "Polki Jewellery",
    "Antique Jewellery",
    "Temple Necklaces",
    "Kundan Necklaces",
    "Antique Necklaces",
    "Polki Necklaces",
    "Traditional Necklaces",
    "Choker Necklaces",
    "Jhumka Earrings",
    "Kundan Earrings",
    "Temple Earrings",
    "Chandbali Earrings",
    "Polki Earrings",
    "Engagement Rings",
    "Wedding Rings",
    "Kundan Rings",
    "Temple Rings",
    "Antique Rings",
    "Polki Rings",
    "Kundan Bangles",
    "Antique Bangles",
    "Polki Bangles",
    "Temple Bangles",
    "Complete Bridal Sets",
    "Kundan Sets",
    "Temple Sets",
    "Polki Sets",
    "Antique Sets",
    "Kundan Maang Tikka",
    "Polki Maang Tikka",
    "Temple Maang Tikka",
    "Antique Maang Tikka",
    "Diamond Maang Tikka",
    "Pearl Maang Tikka",
    "Maang Tikka",
    "Groom Jewellery",
]

GIFT_SEARCH_KEYWORDS = [
    "Baby Jewellery",
    "Nazariya",
    "ID Bracelets",
    "Gifts For Couple",
    "Matching Bracelets",
    "His & Her Sets",
    "Engagement Gifts",
    "Personalised Gifts",
    "Gifts For Parents",
    "Pooja Articles",
    "Silver Articles",
    "Health Pendants",
    "Occasion Gifts",
    "Birthday Gifts",
    "Anniversary Gifts",
    "Wedding Gifts",
    "Housewarming Gifts",
    "Festive Gifts",
    "Graduation Gifts",
    "Promotion Gifts",
    "Baby Shower Gifts",
    "Corporate Gifts",
    "Desk Accessories",
    "Pen Sets",
    "Customized Coins",
    "Mementos",
    "Trophies",
    "Premium Sets",
    "Religious Gifts",
    "Gold Idols",
    "Silver Idols",
    "Pooja Items",
    "Religious Pendants",
    "Yantra Pendants",
    "Mala & Chains",
    "Spiritual Coins",
]

CATALOG = {
    "rings": [
        ("Men's Gold Ring", "gold", "22k", "Office Wear", "", "men", "Bestseller", "4.8000", "0.0000", "12.00", "3.00", "0.00", "Classic 22K gold ring with a clean daily-wear finish."),
        ("Women's Gold Ring", "gold", "22k", "Casual Wear", "", "women", "New", "3.6500", "0.0000", "14.00", "4.00", "0.00", "Elegant 22K gold ring with a soft polished profile."),
        ("Diamond Engagement Solitaire Ring", "diamond", "18k", "Wedding", "Wedding Ring", "women", "Premium", "3.1000", "0.1200", "18.00", "5.00", "18500.00", "Solitaire engagement ring with a refined diamond setting."),
        ("Platinum Wedding Ring", "platinum", "92", "Wedding", "Wedding Ring", "all", "Limited", "5.2500", "0.0000", "16.00", "2.00", "0.00", "Minimal platinum wedding band with a smooth comfort fit."),
        ("Kids Silver Ring", "silver", "999", "Birthday", "", "kids", "New", "2.8000", "0.0000", "10.00", "2.00", "0.00", "Light silver ring for kids and birthday gifting."),
    ],
    "necklaces": [
        ("Gold Bridal Temple Necklace", "gold", "22k", "Wedding", "Wedding Necklaces", "women", "Bridal", "28.5000", "0.0000", "15.00", "3.00", "0.00", "Traditional bridal temple necklace with rich festive detailing."),
        ("Gold Stone Necklace", "gold", "22k", "Anniversary", "", "women", "Premium", "22.2500", "1.5000", "14.00", "4.00", "8500.00", "Gold necklace with stone highlights for special occasions."),
        ("Diamond Pendant Necklace", "diamond", "18k", "Modern Wear", "", "women", "Statement", "10.4000", "0.3500", "18.00", "5.00", "42000.00", "Diamond pendant necklace with a graceful lightweight chain."),
        ("Silver Bridal Necklace", "silver", "999", "Wedding", "Wedding Necklaces", "women", "Bridal", "35.0000", "2.0000", "12.00", "4.00", "4500.00", "Silver bridal necklace with bright traditional finishing."),
        ("Platinum Layered Necklace", "platinum", "92", "Office Wear", "", "women", "Limited", "12.8000", "0.0000", "16.00", "3.00", "0.00", "Layered platinum necklace designed for premium daily styling."),
    ],
    "bangles": [
        ("Women's Gold Bangle", "gold", "22k", "Traditional Wear", "", "women", "Bestseller", "18.7500", "0.0000", "13.00", "3.00", "0.00", "Polished gold bangle for everyday traditional wear."),
        ("Gold Bridal Kundan Bangle", "gold", "22k", "Wedding", "Wedding Bangles", "women", "Bridal", "32.4000", "0.0000", "16.00", "4.00", "0.00", "Heavy bridal kundan bangle with ornate detailing."),
        ("Diamond Wedding Bangle", "diamond", "22k", "Wedding", "Wedding Bangles", "women", "Premium", "20.2000", "0.6500", "18.00", "5.00", "52000.00", "Diamond bangle with festive stone setting."),
        ("Kids Silver Bangle", "silver", "999", "Birthday", "", "kids", "New", "8.5000", "0.0000", "10.00", "2.00", "0.00", "Light silver bangle made for kids with a simple safe profile."),
        ("Platinum Stackable Bangle", "platinum", "92", "Anniversary", "", "women", "Limited", "24.0000", "0.0000", "15.00", "2.00", "0.00", "Stackable platinum bangle with a premium mirror finish."),
    ],
    "bracelets": [
        ("Men's Gold Bracelet", "gold", "22k", "Office Wear", "", "men", "Bestseller", "20.5000", "0.0000", "13.00", "3.00", "0.00", "Gold bracelet with a strong masculine link pattern."),
        ("Gold Charm Bracelet", "gold", "22k", "Birthday", "", "women", "New", "12.2500", "0.0000", "14.00", "4.00", "0.00", "Gold charm bracelet with a lightweight modern design."),
        ("Diamond Tennis Bracelet", "diamond", "18k", "Anniversary", "", "women", "Premium", "11.7000", "0.4200", "20.00", "5.00", "68000.00", "Diamond tennis bracelet with elegant stone alignment."),
        ("Silver Kada Bracelet", "silver", "999", "Traditional Wear", "", "men", "Statement", "26.0000", "0.0000", "10.00", "3.00", "0.00", "Bold silver kada bracelet with a clean traditional edge."),
        ("Platinum Tennis Bracelet", "platinum", "92", "Modern Wear", "", "women", "Limited", "15.3000", "0.0000", "18.00", "3.00", "0.00", "Premium platinum tennis bracelet for refined occasions."),
    ],
    "earrings": [
        ("Gold Stud Earring", "gold", "22k", "Casual Wear", "", "women", "Bestseller", "3.2000", "0.0000", "12.00", "3.00", "0.00", "Simple gold stud earrings for daily use."),
        ("Gold Drop Earring", "gold", "22k", "Wedding", "Wedding Earring", "women", "New", "5.4500", "0.0000", "14.00", "4.00", "0.00", "Gold drop earrings with graceful movement."),
        ("Diamond Stud Earring", "diamond", "18k", "Modern Wear", "", "women", "Premium", "2.8500", "0.1800", "18.00", "5.00", "24000.00", "Diamond studs with a premium sparkle finish."),
        ("Kids Silver Earring", "silver", "999", "Birthday", "", "kids", "Stackable", "2.9000", "0.0000", "10.00", "2.00", "0.00", "Light silver earrings for kids."),
        ("Platinum Stud Earring", "platinum", "92", "Office Wear", "", "women", "Limited", "3.6000", "0.0000", "16.00", "2.00", "0.00", "Minimal platinum studs with a polished premium look."),
    ],
    "chains": [
        ("Men's Gold Chain", "gold", "22k", "Traditional Wear", "", "men", "Bestseller", "18.0000", "0.0000", "12.00", "3.00", "0.00", "Strong gold chain with a timeless link style."),
        ("Gold Rope Chain", "gold", "22k", "Modern Wear", "", "all", "Statement", "14.5000", "0.0000", "13.00", "4.00", "0.00", "Gold rope chain with a bright textured finish."),
        ("Diamond Pendant Chain", "diamond", "18k", "Birthday", "", "women", "Premium", "8.2000", "0.2200", "18.00", "5.00", "30000.00", "Diamond pendant chain for premium gifting."),
        ("Silver Box Chain", "silver", "999", "Casual Wear", "", "all", "New", "16.0000", "0.0000", "10.00", "3.00", "0.00", "Silver box chain with a crisp geometric link pattern."),
        ("Platinum Wedding Chain", "platinum", "92", "Wedding", "Wedding Chain", "all", "Limited", "18.7500", "0.0000", "16.00", "2.00", "0.00", "Platinum wedding chain with a subtle premium finish."),
    ],
    "pendants": [
        ("Gold Religious Pendant", "gold", "22k", "Auspicious", "", "all", "Bestseller", "4.3000", "0.0000", "12.00", "3.00", "0.00", "Religious pendant for temple and festival gifting."),
        ("Diamond Solitaire Pendant", "diamond", "18k", "Anniversary", "", "women", "Premium", "3.8000", "0.1800", "18.00", "5.00", "28000.00", "Solitaire diamond pendant with a halo-inspired finish."),
        ("Silver Initial Pendant", "silver", "999", "Birthday", "", "kids", "New", "5.2000", "0.0000", "10.00", "2.00", "0.00", "Personalised initial pendant for kids and gifting."),
        ("Platinum Heart Pendant", "platinum", "92", "Modern Wear", "", "women", "Limited", "5.5000", "0.0000", "16.00", "3.00", "0.00", "Platinum heart pendant for minimal daily wear."),
        ("Gold Lightweight Minimal Pendant", "gold", "22k", "Casual Wear", "", "women", "New", "2.6000", "0.0000", "10.00", "4.00", "0.00", "Light minimal pendant for everyday styling."),
    ],
    "mangalsutra": [
        ("Traditional Gold Mangalsutra", "gold", "22k", "Wedding", "Wedding Necklaces", "women", "Bestseller", "14.8000", "0.0000", "13.00", "3.00", "0.00", "Traditional black bead mangalsutra for wedding wear."),
        ("Diamond Mangalsutra", "diamond", "18k", "Wedding", "Wedding Necklaces", "women", "Premium", "8.9000", "0.2500", "18.00", "5.00", "36000.00", "Diamond mangalsutra with contemporary styling."),
        ("Short Gold Mangalsutra", "gold", "22k", "Office Wear", "", "women", "New", "8.4000", "0.0000", "12.00", "3.00", "0.00", "Short mangalsutra for daily office wear."),
        ("Beaded Silver Mangalsutra", "silver", "999", "Casual Wear", "", "women", "Statement", "18.0000", "0.0000", "10.00", "2.00", "0.00", "Beaded mangalsutra with a clean black bead profile."),
        ("Platinum Minimal Mangalsutra", "platinum", "92", "Anniversary", "", "women", "Limited", "9.7000", "0.0000", "16.00", "3.00", "0.00", "Minimal platinum mangalsutra for premium gifting."),
    ],
    "anklets": [
        ("Silver Anklet Pair", "silver", "999", "Casual Wear", "", "women", "Bestseller", "24.0000", "0.0000", "10.00", "3.00", "0.00", "Silver anklet pair with a soft daily-wear design."),
        ("Kids Silver Anklet", "silver", "999", "Birthday", "", "kids", "New", "12.5000", "0.0000", "8.00", "2.00", "0.00", "Kids anklet for birthday gifting."),
        ("Gold Anklet", "gold", "22k", "Traditional Wear", "", "women", "Premium", "9.8000", "0.0000", "13.00", "3.00", "0.00", "Gold anklet with a traditional festive finish."),
        ("Minimal Silver Anklet", "silver", "999", "Office Wear", "", "women", "New", "10.5000", "0.0000", "9.00", "2.00", "0.00", "Light minimal anklet for daily wear."),
        ("Platinum Charm Anklet", "platinum", "92", "Anniversary", "", "women", "Limited", "7.5000", "0.0000", "15.00", "3.00", "0.00", "Platinum charm anklet for premium occasions."),
    ],
    "nosepin": [
        ("Gold Nose Pin", "gold", "22k", "Traditional Wear", "", "women", "Bestseller", "0.8500", "0.0000", "12.00", "3.00", "0.00", "Classic gold nose pin for traditional styling."),
        ("Diamond Nose Pin", "diamond", "18k", "Modern Wear", "", "women", "Premium", "0.9000", "0.0400", "18.00", "5.00", "6500.00", "Diamond nose pin with a small bright stone."),
        ("Silver Nose Pin", "silver", "999", "Casual Wear", "", "women", "New", "1.4000", "0.0000", "10.00", "2.00", "0.00", "Simple silver nose pin for everyday use."),
        ("Gold Floral Nose Pin", "gold", "22k", "Wedding", "Wedding Earring", "women", "Bridal", "1.2500", "0.0000", "14.00", "3.00", "0.00", "Floral nose pin for bridal and wedding looks."),
        ("Platinum Nose Pin", "platinum", "92", "Office Wear", "", "women", "Limited", "1.1000", "0.0000", "16.00", "2.00", "0.00", "Minimal platinum nose pin for refined daily wear."),
    ],
    "toerings": [
        ("Silver Toe Rings", "silver", "999", "Traditional Wear", "", "women", "Bestseller", "5.8000", "0.0000", "10.00", "2.00", "0.00", "Traditional silver toe rings with a clean finish."),
        ("Adjustable Silver Toe Rings", "silver", "999", "Casual Wear", "", "women", "New", "4.6000", "0.0000", "9.00", "2.00", "0.00", "Adjustable silver toe rings for daily comfort."),
        ("Gold Polish Toe Rings", "silver", "999", "Wedding", "", "women", "Bridal", "6.2000", "0.0000", "11.00", "3.00", "0.00", "Gold polish toe rings for wedding styling."),
        ("Stone Toe Rings", "silver", "999", "Anniversary", "", "women", "Statement", "5.1000", "0.1000", "10.00", "3.00", "900.00", "Stone toe rings with decorative detail."),
        ("Minimal Toe Rings", "silver", "999", "Office Wear", "", "women", "New", "3.8000", "0.0000", "8.00", "2.00", "0.00", "Minimal toe rings for light daily wear."),
    ],
    "cufflinks": [
        ("Men's Gold Cufflinks", "gold", "22k", "Wedding", "", "men", "Premium", "7.5000", "0.0000", "13.00", "3.00", "0.00", "Gold cufflinks for formal wedding wear."),
        ("Platinum Cufflinks", "platinum", "92", "Office Wear", "", "men", "Limited", "9.0000", "0.0000", "16.00", "2.00", "0.00", "Platinum cufflinks with a sharp formal design."),
        ("Silver Cufflinks", "silver", "999", "Birthday", "", "men", "New", "8.2000", "0.0000", "10.00", "2.00", "0.00", "Silver cufflinks for birthday gifting."),
        ("Diamond Accent Cufflinks", "diamond", "18k", "Anniversary", "", "men", "Premium", "7.9000", "0.1200", "18.00", "5.00", "22000.00", "Diamond accent cufflinks for premium formal style."),
        ("Corporate Gift Cufflinks", "silver", "999", "Auspicious", "", "men", "Bestseller", "7.0000", "0.0000", "9.00", "2.00", "0.00", "Corporate gift cufflinks with a clean elegant finish."),
    ],
    "brooches": [
        ("Gold Floral Brooch", "gold", "22k", "Wedding", "", "women", "Bridal", "8.5000", "0.0000", "14.00", "3.00", "0.00", "Gold floral brooch for saree and wedding styling."),
        ("Diamond Brooch", "diamond", "18k", "Anniversary", "", "women", "Premium", "7.2000", "0.2600", "20.00", "5.00", "46000.00", "Diamond brooch with statement sparkle."),
        ("Silver Brooch", "silver", "999", "Casual Wear", "", "all", "New", "12.0000", "0.0000", "10.00", "3.00", "0.00", "Silver brooch for casual festive styling."),
        ("Antique Temple Brooch", "gold", "22k", "Wedding", "", "women", "Statement", "11.4000", "0.0000", "15.00", "4.00", "0.00", "Antique temple brooch with heritage detailing."),
        ("Platinum Minimal Brooch", "platinum", "92", "Office Wear", "", "all", "Limited", "8.8000", "0.0000", "16.00", "2.00", "0.00", "Minimal platinum brooch for modern formal wear."),
    ],
    "tiepins": [
        ("Men's Gold Tie Pin", "gold", "22k", "Office Wear", "", "men", "Bestseller", "5.2000", "0.0000", "13.00", "3.00", "0.00", "Gold tie pin for polished formal dressing."),
        ("Platinum Tie Pin", "platinum", "92", "Office Wear", "", "men", "Limited", "6.5000", "0.0000", "16.00", "2.00", "0.00", "Platinum tie pin with a premium finish."),
        ("Silver Tie Pin", "silver", "999", "Birthday", "", "men", "New", "6.0000", "0.0000", "9.00", "2.00", "0.00", "Silver tie pin for birthday and corporate gifts."),
        ("Diamond Accent Tie Pin", "diamond", "18k", "Anniversary", "", "men", "Premium", "5.7000", "0.0900", "18.00", "5.00", "18000.00", "Diamond accent tie pin for premium formal wear."),
        ("Corporate Gift Tie Pin", "silver", "999", "Auspicious", "", "men", "Bestseller", "5.8000", "0.0000", "10.00", "2.00", "0.00", "Corporate gift tie pin for formal presentation."),
    ],
    "coins": [
        ("1 gm Gold Coin", "gold", "22k", "Auspicious", "", "all", "Bestseller", "1.0000", "0.0000", "6.00", "0.00", "0.00", "Temple gift coin for auspicious saving."),
        ("2 gm Gold Coin", "gold", "24k", "Auspicious", "", "all", "Premium", "2.0000", "0.0000", "5.00", "0.00", "0.00", "Certified 24K gold investment coin."),
        ("10 gm Silver Coin", "silver", "999", "Auspicious", "", "all", "Bestseller", "10.0000", "0.0000", "5.00", "0.00", "0.00", "Certified silver temple coin for gifting."),
        ("50 gm Silver Bar", "silver", "999", "Auspicious", "", "all", "Limited", "50.0000", "0.0000", "4.00", "0.00", "0.00", "Silver bar for investment and gifting."),
        ("5 gm Platinum Coin", "platinum", "92", "Auspicious", "", "all", "Premium", "5.0000", "0.0000", "6.00", "0.00", "0.00", "Certified platinum coin for premium gifting."),
    ],
}


def money(value):
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def product_price(metal, grade, net_weight, making_charge, wastage_charge, stone_value, rates):
    if metal == "gold":
        rate = rates["gold_24k"] if grade == "24k" else rates["gold_22k"]
    elif metal == "silver":
        rate = rates["silver_999"]
    elif metal == "diamond":
        rate = rates["diamond_18k"] if grade == "18k" else rates["diamond_22k"]
    elif metal == "platinum":
        rate = rates["platinum_92"]
    else:
        rate = Decimal("0.00")

    rate_with_making = rate + (rate * (making_charge / Decimal("100")))
    discounted_rate = rate_with_making - (rate_with_making * (wastage_charge / Decimal("100")))
    original = ((net_weight * rate_with_making) + stone_value) * Decimal("1.03")
    final = ((net_weight * discounted_rate) + stone_value) * Decimal("1.03")
    return money(final), money(original)


def product_description(description, category, metal, occasion):
    keywords = []
    keywords.extend(COMMON_SEARCH_KEYWORDS)
    keywords.extend(METAL_SEARCH_KEYWORDS.get(metal, []))
    keywords.extend(CATEGORY_SEARCH_KEYWORDS.get(category, []))

    if occasion == "Wedding":
        keywords.extend(WEDDING_SEARCH_KEYWORDS)

    if occasion in {"Birthday", "Anniversary", "Auspicious"}:
        keywords.extend(GIFT_SEARCH_KEYWORDS)

    unique_keywords = []
    for keyword in keywords:
        if keyword and keyword not in unique_keywords:
            unique_keywords.append(keyword)

    return f"{description} Search keywords: {'; '.join(unique_keywords)}."


def project_root():
    return Path(settings.BASE_DIR).resolve().parent


class Command(BaseCommand):
    help = "Create navbar-ready dummy products with images, 5 products for each product category."

    def add_arguments(self, parser):
        parser.add_argument("--created-by", type=str, default="")
        parser.add_argument(
            "--skip-images",
            action="store_true",
            help="Create/update products without attaching repository images.",
        )
        parser.add_argument(
            "--replace-images",
            action="store_true",
            help="Delete existing images on these dummy products and attach images again.",
        )

    def handle(self, *args, **options):
        rates = DEFAULT_RATES.copy()
        latest_rate = MetalRate.objects.order_by("-date").first()
        if latest_rate:
            rates.update({
                "gold_22k": Decimal(latest_rate.gold_22k or 0) or DEFAULT_RATES["gold_22k"],
                "gold_24k": Decimal(latest_rate.gold_24k or 0) or DEFAULT_RATES["gold_24k"],
                "silver_999": Decimal(latest_rate.silver_999 or 0) or DEFAULT_RATES["silver_999"],
                "diamond_18k": Decimal(latest_rate.diamond_18k or 0) or DEFAULT_RATES["diamond_18k"],
                "diamond_22k": Decimal(latest_rate.diamond_22k or 0) or DEFAULT_RATES["diamond_22k"],
                "platinum_92": Decimal(latest_rate.platinum_92 or 0) or DEFAULT_RATES["platinum_92"],
            })

        created_by = None
        if options["created_by"]:
            created_by = User.objects.filter(email=options["created_by"]).first()
            if not created_by:
                self.stdout.write(self.style.WARNING(
                    f"No user found for --created-by={options['created_by']}. Products will be saved without owner."
                ))

        created = 0
        updated = 0
        images_added = 0
        image_warnings = 0
        root = project_root()

        with transaction.atomic():
            for category, products in CATALOG.items():
                image_paths = IMAGE_SETS.get(category, [])

                for index, item in enumerate(products):
                    (
                        name, metal, grade, occasion, wedding_category, gender, tag,
                        cross_weight, stone_weight, making_charge, wastage_charge,
                        stone_value, description,
                    ) = item

                    cross_weight = Decimal(cross_weight)
                    stone_weight = Decimal(stone_weight)
                    net_weight = cross_weight - stone_weight
                    making_charge = Decimal(making_charge)
                    wastage_charge = Decimal(wastage_charge)
                    stone_value = Decimal(stone_value)
                    price, original_price = product_price(
                        metal, grade, net_weight, making_charge, wastage_charge, stone_value, rates
                    )

                    product, was_created = JewelryProduct.objects.update_or_create(
                        category=category,
                        metal=metal,
                        grade=grade,
                        name=name,
                        defaults={
                            "description": product_description(description, category, metal, occasion),
                            "cross_weight": cross_weight,
                            "stone_weight": stone_weight,
                            "net_weight": net_weight,
                            "making_charge": making_charge,
                            "wastage_charge": wastage_charge,
                            "stone_value": stone_value,
                            "tax_percent": Decimal("3.00"),
                            "price": price,
                            "original_price": original_price,
                            "tag": tag,
                            "occasion": occasion,
                            "wedding_category": wedding_category,
                            "gender": gender,
                            "is_active": True,
                            "created_by": created_by,
                        },
                    )

                    if was_created:
                        created += 1
                    else:
                        updated += 1

                    if options["skip_images"]:
                        continue

                    if options["replace_images"]:
                        product.images.all().delete()

                    if product.images.exists():
                        continue

                    image_rel = image_paths[index % len(image_paths)] if image_paths else ""
                    image_path = root / image_rel if image_rel else None
                    if not image_path or not image_path.exists():
                        image_warnings += 1
                        self.stdout.write(self.style.WARNING(
                            f"Image missing for {product.name}: {image_rel or 'not configured'}"
                        ))
                        continue

                    try:
                        with image_path.open("rb") as image_file:
                            JewelryProductImage.objects.create(
                                product=product,
                                image=File(image_file, name=f"dummy_products/{image_path.name}"),
                                order=0,
                            )
                        images_added += 1
                    except Exception as exc:
                        image_warnings += 1
                        self.stdout.write(self.style.WARNING(
                            f"Image attach failed for {product.name}: {exc}"
                        ))

        self.stdout.write(self.style.SUCCESS(
            f"Done. {created} products created, {updated} products updated, {images_added} images attached."
        ))
        if image_warnings:
            self.stdout.write(self.style.WARNING(
                f"{image_warnings} image warnings. Products were still created/updated."
            ))
