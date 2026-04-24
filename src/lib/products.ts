import bornToWin from "@/assets/tee-born-to-win.jpeg";
import getRich from "@/assets/tee-get-rich.jpeg";
import noLuck from "@/assets/tee-no-luck.jpeg";
import joker from "@/assets/tee-joker.jpeg";
import jrRed from "@/assets/tee-jr-red.jpeg";
import jrWhite from "@/assets/tee-jr-white.jpeg";

export type LegacyProduct = {
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string[];
  colors: string[];
  stockQuantity: number;
  isActive: boolean;
  isSoldOut: boolean;
  isPreorder: boolean;
  featuredHomepage: boolean;
  images: string[];
  videos: string[];
};

export const legacyProducts: LegacyProduct[] = [
  {
    slug: "born-to-win-tee",
    name: "Born To Win Tee",
    description: "Royal flush back hit. JR cards on the chest. Heavy cotton with a premium oversized fit.",
    price: 40,
    category: "T-Shirts",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Cream"],
    stockQuantity: 42,
    isActive: true,
    isSoldOut: false,
    isPreorder: false,
    featuredHomepage: true,
    images: [bornToWin, joker],
    videos: [],
  },
  {
    slug: "get-rich-or-die-trying-tee",
    name: "Get Rich Or Die Trying Tee",
    description: "Smeared red ink back. JR dice chest hit. Streetwear staple built for the first drop.",
    price: 40,
    category: "T-Shirts",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Red"],
    stockQuantity: 17,
    isActive: true,
    isSoldOut: false,
    isPreorder: false,
    featuredHomepage: false,
    images: [getRich, jrRed],
    videos: [],
  },
  {
    slug: "no-luck-all-god-tee",
    name: "No Luck All God Tee",
    description: "Three sevens back. Lucky 7 chest hit. Garment-dyed for a worn-in look and feel.",
    price: 40,
    category: "T-Shirts",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "White"],
    stockQuantity: 0,
    isActive: true,
    isSoldOut: false,
    isPreorder: true,
    featuredHomepage: false,
    images: [noLuck, jrWhite],
    videos: [],
  },
];
