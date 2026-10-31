import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { getDb, closeDb } from "../src/db";
import {
  auditLogs,
  banners,
  categories,
  customers,
  eventRequests,
  expenses,
  mediaAssets,
  options,
  orderItems,
  orders,
  productOptions,
  productVariants,
  products,
  promotions,
  reviews,
  settings,
  users,
} from "../src/db/schema";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

type VariantSeed = {
  name: string;
  quantity: number;
  price: number;
  compareAtPrice?: number;
  composition?: string;
  imageUrl?: string;
};

type ProductSeed = {
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  images: string[];
  variants: VariantSeed[];
  badge?: string;
  isFeatured?: boolean;
  costPrice: number;
  sortOrder: number;
  optionNames?: string[];
};

const CATEGORIES = [
  {
    name: "Fataya & nems",
    slug: "fataya-nems",
    description: "Croustillants, généreux, faits maison.",
    imageUrl: "/images/fataya.jpg",
    icon: "Flame",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Tacos & tortillas",
    slug: "tacos-tortillas",
    description: "Des garnitures XXL et des sauces qui claquent.",
    imageUrl: "/images/tacos.jpg",
    icon: "Sandwich",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Burgers & sandwichs",
    slug: "burgers-sandwichs",
    description: "Le réconfort entre deux pains.",
    imageUrl: "/images/burger.jpg",
    icon: "Beef",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Pizzas",
    slug: "pizzas",
    description: "Pâte fine, fromage fondant, garnitures au choix.",
    imageUrl: "/images/pizza.jpg",
    icon: "Pizza",
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Crêpes",
    slug: "crepes",
    description: "Sucrées ou salées, toujours généreuses.",
    imageUrl: "/images/crepe-nutella.jpg",
    icon: "CakeSlice",
    sortOrder: 5,
    isActive: true,
  },
  {
    name: "Jus naturels",
    slug: "jus-naturels",
    description: "Pressés maison, sans conservateur.",
    imageUrl: "/images/juice.jpg",
    icon: "CupSoda",
    sortOrder: 6,
    isActive: true,
  },
  {
    name: "Pâtisserie",
    slug: "patisserie",
    description: "Gâteaux d'anniversaire et douceurs maison.",
    imageUrl: "/images/pastry.jpg",
    icon: "Cookie",
    sortOrder: 7,
    isActive: true,
  },
];

const PRODUCTS: ProductSeed[] = [
  {
    name: "Mini-fataya",
    slug: "mini-fataya",
    category: "fataya-nems",
    shortDescription: "Le croustillant doré qui met tout le monde d'accord.",
    description:
      "Nos mini-fataya sont pliés à la main et garnis d'une farce de viande épicée, d'oignons et d'herbes fraîches. Frits à la commande pour garder tout leur croustillant. Parfaits à l'apéritif, en encas ou en box à partager.",
    imageUrl: "/images/fataya.jpg",
    images: ["/images/fataya.jpg", "/images/hero-fataya.jpg", "/images/spread.jpg"],
    badge: "Best-seller",
    isFeatured: true,
    costPrice: 60,
    sortOrder: 1,
    optionNames: ["Sauce piquante", "Sauce fromagère"],
    variants: [
      { name: "À l'unité", quantity: 1, price: 150, composition: "1 mini-fataya" },
      {
        name: "Box de 10",
        quantity: 10,
        price: 1000,
        compareAtPrice: 1500,
        composition: "10 mini-fataya + 1 sauce au choix",
      },
      {
        name: "Box de 15",
        quantity: 15,
        price: 1400,
        compareAtPrice: 2250,
        composition: "15 mini-fataya + 1 sauce au choix",
      },
      {
        name: "Box de 25",
        quantity: 25,
        price: 2400,
        composition: "25 mini-fataya + 2 sauces au choix",
      },
      {
        name: "Box de 50",
        quantity: 50,
        price: 4500,
        composition: "50 mini-fataya + 3 sauces au choix",
      },
    ],
  },
  {
    name: "Fataya complet",
    slug: "fataya-complet",
    category: "fataya-nems",
    shortDescription: "Fataya, frites maison et boisson fraîche.",
    description:
      "Le classique de la maison dans son format le plus complet : mini-fataya dorés, frites croustillantes et une boisson fraîche au choix. Un repas simple et généreux, préparé à la commande.",
    imageUrl: "/images/fataya.jpg",
    images: ["/images/fataya.jpg", "/images/spread.jpg"],
    costPrice: 850,
    sortOrder: 2,
    optionNames: ["Sauce piquante", "Sauce fromagère", "Boisson fraîche"],
    variants: [
      { name: "Seul", quantity: 1, price: 1500, composition: "5 mini-fataya + sauce" },
      { name: "Menu complet", quantity: 1, price: 2500, composition: "5 mini-fataya + frites + boisson" },
    ],
  },
  {
    name: "Box mixte Gourmande",
    slug: "box-mixte-gourmande",
    category: "fataya-nems",
    shortDescription: "Fataya, nems et samossas pour la grande tablée.",
    description:
      "Une box composée par la maison pour varier les plaisirs. Sa composition et son prix peuvent être ajustés depuis l'espace de gestion. Idéale pour les apéritifs, les pauses d'équipe et les soirées entre amis.",
    imageUrl: "/images/spread.jpg",
    images: ["/images/spread.jpg", "/images/fataya.jpg", "/images/tacos.jpg"],
    badge: "À partager",
    isFeatured: true,
    costPrice: 2900,
    sortOrder: 3,
    optionNames: ["Sauce piquante", "Sauce fromagère"],
    variants: [
      {
        name: "Box de 25 pièces",
        quantity: 25,
        price: 4500,
        composition: "10 mini-fataya + 10 nems + 5 samossas + 2 sauces",
      },
      {
        name: "Box de 50 pièces",
        quantity: 50,
        price: 8500,
        composition: "20 mini-fataya + 15 nems + 15 samossas + 4 sauces",
      },
    ],
  },
  {
    name: "Nems",
    slug: "nems",
    category: "fataya-nems",
    shortDescription: "Fins, croustillants et bien garnis.",
    description:
      "Des nems préparés à la main dans une pâte fine, avec une garniture de légumes et d'épices douces. Servis avec une sauce maison. Excellents seuls ou en box pour partager.",
    imageUrl: "/images/nems.jpg",
    images: ["/images/nems.jpg", "/images/fataya.jpg"],
    isFeatured: true,
    costPrice: 100,
    sortOrder: 4,
    optionNames: ["Sauce piquante", "Sauce fromagère"],
    variants: [
      { name: "À l'unité", quantity: 1, price: 200, composition: "1 nem" },
      {
        name: "Box de 10",
        quantity: 10,
        price: 1500,
        composition: "10 nems + 1 sauce",
      },
      {
        name: "Box de 15",
        quantity: 15,
        price: 2100,
        composition: "15 nems + 1 sauce",
      },
      {
        name: "Box de 25",
        quantity: 25,
        price: 3500,
        composition: "25 nems + 2 sauces",
      },
      {
        name: "Box de 50",
        quantity: 50,
        price: 6500,
        composition: "50 nems + 3 sauces",
      },
    ],
  },
  {
    name: "Tacos viande",
    slug: "tacos-viande",
    category: "tacos-tortillas",
    shortDescription: "Galette grillée, viande fondante, sauce fromagère.",
    description:
      "Notre tacos signature : une galette grillée, une généreuse portion de viande, des frites croustillantes, du fromage fondu et la sauce de votre choix. Préparé minute, servi bien chaud.",
    imageUrl: "/images/tacos.jpg",
    images: ["/images/tacos.jpg", "/images/tacos-2.jpg", "/images/spread.jpg"],
    badge: "Best-seller",
    isFeatured: true,
    costPrice: 1350,
    sortOrder: 1,
    optionNames: [
      "Sauce piquante",
      "Sauce fromagère",
      "Extra viande",
      "Extra fromage",
      "Frites",
      "Boisson fraîche",
    ],
    variants: [
      {
        name: "Normal",
        quantity: 1,
        price: 2500,
        composition: "Galette, viande, frites, fromage, sauce",
      },
      {
        name: "XL",
        quantity: 1,
        price: 3500,
        composition: "Double portion de viande et de frites",
      },
    ],
  },
  {
    name: "Tacos poulet",
    slug: "tacos-poulet",
    category: "tacos-tortillas",
    shortDescription: "Poulet mariné et sauce onctueuse.",
    description:
      "Du poulet mariné puis grillé, des frites maison, du fromage fondu et une sauce au choix, le tout dans une galette grillée. Un incontournable pour les amateurs de poulet.",
    imageUrl: "/images/tacos-2.jpg",
    images: ["/images/tacos-2.jpg", "/images/tacos.jpg"],
    costPrice: 1100,
    sortOrder: 2,
    optionNames: [
      "Sauce piquante",
      "Sauce fromagère",
      "Extra viande",
      "Extra fromage",
      "Frites",
      "Boisson fraîche",
    ],
    variants: [
      { name: "Normal", quantity: 1, price: 2000, composition: "Galette, poulet, frites, sauce" },
      { name: "XL", quantity: 1, price: 3000, composition: "Double portion de poulet et frites" },
    ],
  },
  {
    name: "Tacos mixte",
    slug: "tacos-mixte",
    category: "tacos-tortillas",
    shortDescription: "Viande et poulet pour les grandes faims.",
    description:
      "Le meilleur des deux mondes : viande et poulet dans une seule galette, avec frites, fromage fondu et sauce maison. Un format copieux pour les vraies faims.",
    imageUrl: "/images/tacos.jpg",
    images: ["/images/tacos.jpg", "/images/tacos-2.jpg"],
    badge: "Généreux",
    costPrice: 1450,
    sortOrder: 3,
    optionNames: [
      "Sauce piquante",
      "Sauce fromagère",
      "Extra viande",
      "Extra fromage",
      "Frites",
      "Boisson fraîche",
    ],
    variants: [
      { name: "Normal", quantity: 1, price: 3000, composition: "Viande + poulet + frites + sauce" },
      { name: "XL", quantity: 1, price: 4000, composition: "Double viande + poulet + frites" },
    ],
  },
  {
    name: "Tortilla poulet",
    slug: "tortilla-poulet",
    category: "tacos-tortillas",
    shortDescription: "Version roulée, fraîche et gourmande.",
    description:
      "Une tortilla souple garnie de poulet grillé, de crudités croquantes et d'une sauce crémeuse. Plus légère qu'un tacos, tout aussi généreuse.",
    imageUrl: "/images/tortilla.jpg",
    images: ["/images/tortilla.jpg", "/images/tacos-2.jpg"],
    costPrice: 1050,
    sortOrder: 4,
    optionNames: ["Sauce piquante", "Sauce fromagère", "Frites", "Boisson fraîche"],
    variants: [
      { name: "Classique", quantity: 1, price: 2000, composition: "Tortilla, poulet, crudités, sauce" },
      { name: "Menu", quantity: 1, price: 3000, composition: "Tortilla + frites + boisson" },
    ],
  },
  {
    name: "Tortilla mixte",
    slug: "tortilla-mixte",
    category: "tacos-tortillas",
    shortDescription: "Poulet, viande et sauce maison.",
    description:
      "Une tortilla moelleuse garnie de poulet, de viande et de crudités, relevée par la sauce de votre choix. Le format roulé des grosses faims.",
    imageUrl: "/images/tortilla.jpg",
    images: ["/images/tortilla.jpg", "/images/sandwich.jpg"],
    costPrice: 1200,
    sortOrder: 5,
    optionNames: ["Sauce piquante", "Sauce fromagère", "Frites", "Boisson fraîche"],
    variants: [
      { name: "Classique", quantity: 1, price: 2500, composition: "Tortilla, poulet, viande, crudités" },
      { name: "Menu", quantity: 1, price: 3500, composition: "Tortilla + frites + boisson" },
    ],
  },
  {
    name: "Mini-pizza",
    slug: "mini-pizza",
    category: "pizzas",
    shortDescription: "La petite pizza qui se croque sans culpabilité.",
    description:
      "Une pâte fine et croustillante, une sauce tomate maison, du fromage fondant et une garniture au choix. À l'unité pour une envie rapide ou en box pour partager.",
    imageUrl: "/images/pizza-3.jpg",
    images: ["/images/pizza-3.jpg", "/images/pizza.jpg"],
    isFeatured: true,
    costPrice: 450,
    sortOrder: 1,
    optionNames: ["Extra fromage"],
    variants: [
      { name: "À l'unité", quantity: 1, price: 1000, composition: "1 mini-pizza garnie" },
      { name: "Box de 4", quantity: 4, price: 3500, composition: "4 mini-pizzas au choix" },
      { name: "Box de 10", quantity: 10, price: 8000, composition: "10 mini-pizzas au choix" },
    ],
  },
  {
    name: "Pizza Margherita",
    slug: "pizza-margherita",
    category: "pizzas",
    shortDescription: "Tomate, fromage, basilic. L'essentiel, en mieux.",
    description:
      "La simplicité qui fait toujours plaisir : sauce tomate maison, mozzarella fondante et basilic frais sur une pâte travaillée à la main.",
    imageUrl: "/images/pizza.jpg",
    images: ["/images/pizza.jpg", "/images/pizza-4.jpg"],
    costPrice: 1700,
    sortOrder: 2,
    optionNames: ["Extra fromage", "Boisson fraîche"],
    variants: [
      { name: "Moyenne", quantity: 1, price: 3500, composition: "4 parts" },
      { name: "Grande", quantity: 1, price: 5000, composition: "6 parts" },
    ],
  },
  {
    name: "Pizza Poulet BBQ",
    slug: "pizza-poulet-bbq",
    category: "pizzas",
    shortDescription: "Poulet grillé, sauce barbecue et fromage.",
    description:
      "Une base tomate généreuse, du poulet grillé mariné, de la sauce barbecue, des oignons rouges et une pluie de fromage fondu.",
    imageUrl: "/images/pizza-2.jpg",
    images: ["/images/pizza-2.jpg", "/images/pizza-3.jpg", "/images/pizza.jpg"],
    badge: "Best-seller",
    isFeatured: true,
    costPrice: 2300,
    sortOrder: 3,
    optionNames: ["Extra fromage", "Boisson fraîche"],
    variants: [
      { name: "Moyenne", quantity: 1, price: 4500, composition: "4 parts" },
      { name: "Grande", quantity: 1, price: 6500, composition: "6 parts" },
    ],
  },
  {
    name: "Pizza 4 fromages",
    slug: "pizza-4-fromages",
    category: "pizzas",
    shortDescription: "Un festival de fromages fondants.",
    description:
      "Mozzarella, gorgonzola, parmesan et fromage frais se rencontrent sur une pâte dorée. Pour les vrais amateurs de fromage.",
    imageUrl: "/images/pizza-4.jpg",
    images: ["/images/pizza-4.jpg", "/images/pizza.jpg"],
    costPrice: 2500,
    sortOrder: 4,
    optionNames: ["Extra fromage"],
    variants: [
      { name: "Moyenne", quantity: 1, price: 5000, composition: "4 parts" },
      { name: "Grande", quantity: 1, price: 7000, composition: "6 parts" },
    ],
  },
  {
    name: "Burger classique",
    slug: "burger-classique",
    category: "burgers-sandwichs",
    shortDescription: "Le burger bien exécuté, sans chichis.",
    description:
      "Un pain brioché toasté, un steak haché juteux, du cheddar fondu, de la salade, des oignons et notre sauce maison. Le classique qui ne déçoit jamais.",
    imageUrl: "/images/burger.jpg",
    images: ["/images/burger.jpg", "/images/burger-2.jpg"],
    costPrice: 1350,
    sortOrder: 1,
    optionNames: ["Extra fromage", "Extra viande", "Frites", "Boisson fraîche"],
    variants: [
      { name: "Seul", quantity: 1, price: 2500, composition: "Burger + sauce maison" },
      { name: "Menu", quantity: 1, price: 3500, composition: "Burger + frites + boisson" },
    ],
  },
  {
    name: "Burger local",
    slug: "burger-local",
    category: "burgers-sandwichs",
    shortDescription: "Le burger qui parle d'ici.",
    description:
      "Notre création locale : pain moelleux, galette de viande épicée, sauce arachide, alloco croustillant et oignons caramélisés. Un clin d'œil à Dakar dans chaque bouchée.",
    imageUrl: "/images/burger-2.jpg",
    images: ["/images/burger-2.jpg", "/images/burger.jpg"],
    badge: "Création maison",
    isFeatured: true,
    costPrice: 1600,
    sortOrder: 2,
    optionNames: ["Extra fromage", "Extra viande", "Frites", "Boisson fraîche"],
    variants: [
      { name: "Seul", quantity: 1, price: 3000, composition: "Burger local + alloco" },
      { name: "Menu", quantity: 1, price: 4000, composition: "Burger + frites + boisson" },
    ],
  },
  {
    name: "Double burger",
    slug: "double-burger",
    category: "burgers-sandwichs",
    shortDescription: "Deux steaks, deux fois plus de plaisir.",
    description:
      "Pour les grandes faims : deux steaks hachés, double cheddar, oignons et sauce maison dans un pain brioché. Un monstre gourmand.",
    imageUrl: "/images/burger.jpg",
    images: ["/images/burger.jpg", "/images/burger-2.jpg"],
    costPrice: 2100,
    sortOrder: 3,
    optionNames: ["Extra fromage", "Frites", "Boisson fraîche"],
    variants: [
      { name: "Seul", quantity: 1, price: 3500, composition: "Double steak + double fromage" },
      { name: "Menu", quantity: 1, price: 4500, composition: "Double burger + frites + boisson" },
    ],
  },
  {
    name: "Sandwich poulet",
    slug: "sandwich-poulet",
    category: "burgers-sandwichs",
    shortDescription: "Poulet grillé, crudités et pain moelleux.",
    description:
      "Du poulet grillé, des crudités croquantes et une sauce crémeuse dans un pain moelleux. Frais, généreux et parfait pour les pauses rapides.",
    imageUrl: "/images/sandwich.jpg",
    images: ["/images/sandwich.jpg", "/images/sandwich-2.jpg"],
    costPrice: 1050,
    sortOrder: 4,
    optionNames: ["Sauce piquante", "Extra fromage", "Frites", "Boisson fraîche"],
    variants: [
      { name: "Seul", quantity: 1, price: 2000, composition: "Sandwich + sauce" },
      { name: "Menu", quantity: 1, price: 3000, composition: "Sandwich + frites + boisson" },
    ],
  },
  {
    name: "Sandwich viande",
    slug: "sandwich-viande",
    category: "burgers-sandwichs",
    shortDescription: "Viande goûteuse et pain toasté.",
    description:
      "Une viande assaisonnée et grillée, des crudités et une sauce maison dans un pain moelleux. Un classique robuste et réconfortant.",
    imageUrl: "/images/sandwich-2.jpg",
    images: ["/images/sandwich-2.jpg", "/images/sandwich.jpg"],
    costPrice: 1250,
    sortOrder: 5,
    optionNames: ["Sauce piquante", "Extra fromage", "Frites", "Boisson fraîche"],
    variants: [
      { name: "Seul", quantity: 1, price: 2500, composition: "Sandwich + sauce" },
      { name: "Menu", quantity: 1, price: 3500, composition: "Sandwich + frites + boisson" },
    ],
  },
  {
    name: "Crêpe Nutella",
    slug: "crepe-nutella",
    category: "crepes",
    shortDescription: "La valeur sûre des goûters gourmands.",
    description:
      "Une crêpe fine et moelleuse garnie d'une généreuse couche de Nutella, saupoudrée d'un peu de sucre glace. Le plaisir simple qui rassemble.",
    imageUrl: "/images/crepe-nutella.jpg",
    images: ["/images/crepe-nutella.jpg", "/images/pancakes.jpg"],
    badge: "Best-seller",
    isFeatured: true,
    costPrice: 600,
    sortOrder: 1,
    optionNames: ["Nutella supplémentaire"],
    variants: [
      { name: "Simple", quantity: 1, price: 1500, composition: "Crêpe + Nutella" },
      { name: "Gourmande", quantity: 1, price: 2000, composition: "Double Nutella + banane" },
      { name: "Menu", quantity: 1, price: 2500, composition: "Crêpe gourmande + boisson" },
    ],
  },
  {
    name: "Crêpe sucre-citron",
    slug: "crepe-sucre-citron",
    category: "crepes",
    shortDescription: "Acidulée, sucrée, irrésistible.",
    description:
      "Une crêpe moelleuse, du sucre et un trait de citron frais. La simplicité à son meilleur.",
    imageUrl: "/images/pancakes.jpg",
    images: ["/images/pancakes.jpg", "/images/crepe-nutella.jpg"],
    costPrice: 350,
    sortOrder: 2,
    variants: [
      { name: "Simple", quantity: 1, price: 1000, composition: "Crêpe sucre-citron" },
      { name: "Double", quantity: 1, price: 1500, composition: "Deux crêpes sucre-citron" },
    ],
  },
  {
    name: "Crêpe fruits de saison",
    slug: "crepe-fruits-de-saison",
    category: "crepes",
    shortDescription: "Fraîche, colorée, pleine de fruits.",
    description:
      "Une crêpe garnie de fruits frais de saison, d'une touchée de crème et d'un peu de sucre. Légère et lumineuse.",
    imageUrl: "/images/pancakes.jpg",
    images: ["/images/pancakes.jpg", "/images/crepe-nutella.jpg"],
    costPrice: 800,
    sortOrder: 3,
    optionNames: ["Nutella supplémentaire"],
    variants: [
      { name: "Simple", quantity: 1, price: 2000, composition: "Crêpe + fruits frais" },
      { name: "Gourmande", quantity: 1, price: 2500, composition: "Crêpe + fruits + crème" },
    ],
  },
  {
    name: "Crêpe salée jambon",
    slug: "crepe-salee-jambon",
    category: "crepes",
    shortDescription: "Jambon, fromage et béchamel maison.",
    description:
      "Une crêpe salée garnie de jambon, de fromage fondu et d'une béchamel maison. Réconfortante à souhait.",
    imageUrl: "/images/crepe.jpg",
    images: ["/images/crepe.jpg", "/images/pancakes.jpg"],
    costPrice: 1000,
    sortOrder: 4,
    optionNames: ["Extra fromage", "Sauce piquante"],
    variants: [
      { name: "Simple", quantity: 1, price: 2000, composition: "Jambon + fromage + béchamel" },
      { name: "Gourmande", quantity: 1, price: 2500, composition: "Double fromage + salade" },
    ],
  },
  {
    name: "Crêpe salée poulet",
    slug: "crepe-salee-poulet",
    category: "crepes",
    shortDescription: "Poulet, champignons et fromage.",
    description:
      "Une crêpe salée généreusement garnie de poulet, de champignons et de fromage fondant. Un déjeuner réconfortant.",
    imageUrl: "/images/crepe.jpg",
    images: ["/images/crepe.jpg", "/images/crepe-nutella.jpg"],
    costPrice: 1200,
    sortOrder: 5,
    optionNames: ["Extra fromage", "Sauce piquante"],
    variants: [
      { name: "Simple", quantity: 1, price: 2500, composition: "Poulet + champignons + fromage" },
      { name: "Gourmande", quantity: 1, price: 3000, composition: "Double garniture + salade" },
    ],
  },
  {
    name: "Bissap maison",
    slug: "bissap-maison",
    category: "jus-naturels",
    shortDescription: "L'hibiscus, frais et légèrement mentholé.",
    description:
      "Notre bissap est infusé chaque jour avec des fleurs d'hibiscus, un peu de gingembre et de la menthe fraîche. Servi bien frais.",
    imageUrl: "/images/juice-3.jpg",
    images: ["/images/juice-3.jpg", "/images/juice.jpg"],
    isFeatured: true,
    costPrice: 300,
    sortOrder: 1,
    variants: [
      { name: "50 cl", quantity: 1, price: 1000, composition: "50 cl" },
      { name: "1 L", quantity: 1, price: 1800, composition: "1 litre" },
    ],
  },
  {
    name: "Jus de gingembre",
    slug: "jus-de-gingembre",
    category: "jus-naturels",
    shortDescription: "Le coup de peps naturel.",
    description:
      "Gingembre frais pressé, citron et un peu de sucre. Un jus tonique et rafraîchissant, préparé maison.",
    imageUrl: "/images/juice.jpg",
    images: ["/images/juice.jpg", "/images/juice-2.jpg"],
    costPrice: 300,
    sortOrder: 2,
    variants: [
      { name: "50 cl", quantity: 1, price: 1000, composition: "50 cl" },
      { name: "1 L", quantity: 1, price: 1800, composition: "1 litre" },
    ],
  },
  {
    name: "Cocktail tropical",
    slug: "cocktail-tropical",
    category: "jus-naturels",
    shortDescription: "Mangue, ananas et citron vert.",
    description:
      "Un mélange frais de mangue, d'ananas et de citron vert. Sans alcool, pressé à la commande.",
    imageUrl: "/images/juice-2.jpg",
    images: ["/images/juice-2.jpg", "/images/juice.jpg", "/images/juice-3.jpg"],
    costPrice: 450,
    sortOrder: 3,
    variants: [
      { name: "50 cl", quantity: 1, price: 1500, composition: "50 cl" },
      { name: "1 L", quantity: 1, price: 2500, composition: "1 litre" },
    ],
  },
  {
    name: "Gâteau d'anniversaire",
    slug: "gateau-anniversaire",
    category: "patisserie",
    shortDescription: "Le gâteau fait maison qui rend la fête encore plus belle.",
    description:
      "Un gâteau moelleux, préparé à la commande et décoré avec soin pour célébrer vos anniversaires et vos moments de partage. Choisissez le format selon le nombre d'invités. Pensez à commander au moins 24 h à l'avance.",
    imageUrl: "/images/pastry.jpg",
    images: ["/images/pastry.jpg"],
    badge: "Sur commande",
    costPrice: 0,
    sortOrder: 40,
    variants: [
      { name: "8 parts", quantity: 1, price: 8000, composition: "1 gâteau d'anniversaire · 8 parts" },
      { name: "10 parts", quantity: 1, price: 10000, composition: "1 gâteau d'anniversaire · 10 parts" },
    ],
  },
  {
    name: "Khérou Touba",
    slug: "kherou-touba",
    category: "patisserie",
    shortDescription: "La douceur traditionnelle de Touba, en sachet à partager.",
    description:
      "Le Khérou Touba, petite gourmandise sénégalaise croquante et parfumée, vendu en sachet de 10 pièces. À grignoter à tout moment ou à offrir.",
    imageUrl: "/images/pastry.jpg",
    images: ["/images/pastry.jpg"],
    costPrice: 0,
    sortOrder: 41,
    variants: [
      { name: "Sachet de 10", quantity: 10, price: 500, composition: "1 sachet de 10 pièces" },
    ],
  },
];

const OPTIONS = [
  { name: "Sauce piquante", groupName: "Sauces", price: 0 },
  { name: "Sauce fromagère", groupName: "Sauces", price: 200 },
  { name: "Extra viande", groupName: "Suppléments", price: 500 },
  { name: "Extra fromage", groupName: "Suppléments", price: 300 },
  { name: "Frites", groupName: "Accompagnements", price: 500 },
  { name: "Boisson fraîche", groupName: "Boissons", price: 500 },
  { name: "Nutella supplémentaire", groupName: "Gourmandises", price: 300 },
];

function reference(prefix: string, length = 6): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += alphabet[crypto.randomInt(alphabet.length)];
  }
  return `${prefix}-${result}`;
}

async function main() {
  const db = getDb();

  const [productCount] = await db.select({ value: count() }).from(products);
  if (productCount.value > 0) {
    console.log(
      "La base contient déjà des produits. Seed ignoré (utilisez npm run db:reset puis db:setup pour repartir de zéro).",
    );
    await closeDb();
    return;
  }

  console.log("Création du compte administrateur…");
  const adminEmail = (process.env.ADMIN_EMAIL || "gerante@maisongourmande.sn")
    .trim()
    .toLowerCase();
  let adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    adminPassword = crypto.randomBytes(12).toString("base64url");
    console.log("──────────────────────────────────────────────────────────────");
    console.log("Aucun ADMIN_PASSWORD fourni. Mot de passe généré :");
    console.log(adminPassword);
    console.log("Notez-le puis changez-le dans Paramètres > Équipe.");
    console.log("──────────────────────────────────────────────────────────────");
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const [existingAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);
  const admin =
    existingAdmin ??
    (
      await db
        .insert(users)
        .values({
          name: process.env.ADMIN_NAME || "Gérante Maison Gourmande",
          email: adminEmail,
          passwordHash,
          role: "SUPER_ADMIN",
        })
        .returning()
    )[0];
  if (existingAdmin) {
    console.log("Compte admin existant conservé :", adminEmail);
  } else {
    console.log("Compte admin créé :", adminEmail);
  }

  console.log("Création des catégories…");
  const categoryRows = await db.insert(categories).values(CATEGORIES).returning();
  const categoryBySlug = new Map(categoryRows.map((row) => [row.slug, row]));

  console.log("Création des options…");
  const optionRows = await db
    .insert(options)
    .values(
      OPTIONS.map((option, index) => ({
        ...option,
        sortOrder: index,
      })),
    )
    .returning();
  const optionByName = new Map(optionRows.map((row) => [row.name, row]));

  console.log("Création du catalogue…");
  const productBySlug = new Map<
    string,
    typeof products.$inferSelect
  >();
  const variantsByProduct = new Map<
    string,
    Array<typeof productVariants.$inferSelect>
  >();

  for (const seed of PRODUCTS) {
    const category = categoryBySlug.get(seed.category);
    if (!category) throw new Error(`Catégorie introuvable : ${seed.category}`);
    const basePrice = Math.min(...seed.variants.map((variant) => variant.price));
    const [product] = await db
      .insert(products)
      .values({
        categoryId: category.id,
        name: seed.name,
        slug: seed.slug,
        shortDescription: seed.shortDescription,
        description: seed.description,
        basePrice,
        costPrice: seed.costPrice,
        imageUrl: seed.imageUrl,
        images: seed.images,
        badge: seed.badge ?? null,
        isFeatured: seed.isFeatured ?? false,
        isActive: true,
        isArchived: false,
        sortOrder: seed.sortOrder,
      })
      .returning();
    productBySlug.set(product.slug, product);

    const variantRows = await db
      .insert(productVariants)
      .values(
        seed.variants.map((variant, index) => ({
          productId: product.id,
          name: variant.name,
          quantity: variant.quantity,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice ?? null,
          composition: variant.composition ?? "",
          imageUrl: variant.imageUrl ?? "",
          isActive: true,
          sortOrder: index,
        })),
      )
      .returning();
    variantsByProduct.set(product.slug, variantRows);

    if (seed.optionNames?.length) {
      const links = seed.optionNames
        .map((name) => optionByName.get(name))
        .filter((option): option is typeof options.$inferSelect => Boolean(option))
        .map((option) => ({
          productId: product.id,
          optionId: option.id,
        }));
      if (links.length) await db.insert(productOptions).values(links);
    }
  }

  console.log("Création des promotions et bannières…");
  const now = new Date();
  const inDays = (days: number) => new Date(now.getTime() + days * 24 * 3600 * 1000);

  await db.insert(promotions).values([
    {
      name: "Bienvenue à la maison",
      description: "10 % de remise sur votre première commande dès 5 000 FCFA.",
      code: "BIENVENUE10",
      type: "PERCENT",
      value: 10,
      minSubtotal: 5000,
      isAutomatic: false,
      isActive: true,
      startsAt: new Date(now.getTime() - 24 * 3600 * 1000),
      endsAt: inDays(60),
      maxRedemptions: 100,
    },
    {
      name: "Week-end gourmand",
      description: "5 % offerts les samedis et dimanches, dès 8 000 FCFA.",
      code: null,
      type: "PERCENT",
      value: 5,
      minSubtotal: 8000,
      daysOfWeek: [0, 6],
      startTime: "11:00",
      endTime: "22:30",
      isAutomatic: true,
      isActive: true,
      startsAt: new Date(now.getTime() - 24 * 3600 * 1000),
      endsAt: inDays(90),
    },
    {
      name: "Livraison offerte",
      description: "La livraison est offerte dès 15 000 FCFA d'achat.",
      code: null,
      type: "FREE_DELIVERY",
      value: 0,
      minSubtotal: 15000,
      isAutomatic: true,
      isActive: true,
      startsAt: new Date(now.getTime() - 24 * 3600 * 1000),
      endsAt: inDays(120),
    },
    {
      name: "Fidélité 3 commandes",
      description:
        "10 % pour nos clients ayant au moins 3 commandes terminées. Utilisable avec le code FIDELITE10.",
      code: "FIDELITE10",
      type: "PERCENT",
      value: 10,
      minSubtotal: 5000,
      loyaltyMinOrders: 3,
      isAutomatic: false,
      isActive: true,
      startsAt: new Date(now.getTime() - 24 * 3600 * 1000),
      endsAt: inDays(120),
    },
    {
      name: "Fête à la maison",
      description:
        "1 000 FCFA de remise dès 10 000 FCFA, limité aux 20 premières commandes enregistrées.",
      code: "FETE1000",
      type: "FIXED",
      value: 1000,
      minSubtotal: 10000,
      maxRedemptions: 20,
      isAutomatic: false,
      isActive: true,
      startsAt: new Date(now.getTime() - 24 * 3600 * 1000),
      endsAt: inDays(30),
    },
  ]);

  await db.insert(banners).values([
    {
      title: "L'heure du goûter",
      subtitle:
        "Une crêpe bien garnie, un jus frais, et la journée prend une autre couleur.",
      imageUrl: "/images/crepe-nutella.jpg",
      ctaLabel: "Choisir ma crêpe",
      ctaHref: "/menu?categorie=crepes",
      placement: "HOME_STRIP",
      isActive: true,
      startsAt: new Date(now.getTime() - 24 * 3600 * 1000),
      endsAt: inDays(90),
      sortOrder: 1,
    },
    {
      title: "Les box à partager",
      subtitle: "Dès 1 000 FCFA. Pour l'apéro, le bureau ou la soirée.",
      imageUrl: "/images/fataya.jpg",
      ctaLabel: "Voir les box",
      ctaHref: "/menu",
      placement: "HOME_STRIP",
      isActive: true,
      startsAt: new Date(now.getTime() - 24 * 3600 * 1000),
      endsAt: inDays(90),
      sortOrder: 2,
    },
  ]);

  console.log("Création des avis, événements et dépenses de démonstration…");
  await db.insert(reviews).values([
    {
      customerName: "Mariam K.",
      rating: 5,
      message:
        "Les mini-fataya sont incroyablement croustillants et la box de 10 est parfaite pour l'apéro. On sent le fait maison !",
      productId: productBySlug.get("mini-fataya")?.id ?? null,
      status: "APPROVED",
      isFeatured: true,
      isDemo: true,
      approvedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
    },
    {
      customerName: "Ibrahim S.",
      rating: 5,
      message:
        "Commande reçue à l'heure, tacos généreux, sauce fromagère au top. Je recommande les yeux fermés.",
      productId: productBySlug.get("tacos-viande")?.id ?? null,
      status: "APPROVED",
      isFeatured: true,
      isDemo: true,
      approvedAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000),
    },
    {
      customerName: "Aïcha T.",
      rating: 5,
      message:
        "La crêpe Nutella est un vrai plaisir. Ma fille en parle encore. Service très chaleureux.",
      productId: productBySlug.get("crepe-nutella")?.id ?? null,
      status: "APPROVED",
      isFeatured: true,
      isDemo: true,
      approvedAt: new Date(now.getTime() - 8 * 24 * 3600 * 1000),
    },
    {
      customerName: "Kevin A.",
      rating: 4,
      message:
        "Très bon tacos poulet, frites croustillantes. J'ai attendu un peu mais la commande était chaude.",
      productId: productBySlug.get("tacos-poulet")?.id ?? null,
      status: "APPROVED",
      isFeatured: false,
      isDemo: true,
      approvedAt: new Date(now.getTime() - 10 * 24 * 3600 * 1000),
    },
    {
      customerName: "Fatou D.",
      rating: 5,
      message:
        "Les jus naturels sont délicieux, le bissap est parfaitement dosé. On reviendra !",
      productId: productBySlug.get("bissap-maison")?.id ?? null,
      status: "APPROVED",
      isFeatured: false,
      isDemo: true,
      approvedAt: new Date(now.getTime() - 14 * 24 * 3600 * 1000),
    },
    {
      customerName: "Awa B.",
      rating: 5,
      message:
        "Tout simplement excellent. La commande par WhatsApp est simple et la réponse rapide.",
      status: "PENDING",
      isFeatured: false,
      isDemo: true,
    },
  ]);

  const eventDate = new Date(now.getTime() + 21 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  const eventDate2 = new Date(now.getTime() + 45 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  await db.insert(eventRequests).values([
    {
      reference: "EVT-DEMO-1001",
      name: "Aïcha Koné",
      phone: "+221 77 123 45 67",
      email: "aicha.demo@example.com",
      eventType: "Anniversaire",
      eventDate,
      peopleCount: 40,
      location: "Keur Massar, Gouye Gui",
      budget: 75000,
      products: [
        {
          productId: productBySlug.get("mini-fataya")?.id ?? null,
          name: "Mini-fataya",
          quantity: 100,
        },
        {
          productId: productBySlug.get("crêpe-nutella")?.id ?? null,
          name: "Crêpe Nutella",
          quantity: 40,
        },
      ],
      notes: "Démo — anniversaire surprise, décoration pastel si possible.",
      status: "NEW",
      isDemo: true,
    },
    {
      reference: "EVT-DEMO-1002",
      name: "Yann Bamba",
      phone: "+221 76 234 56 78",
      email: "yann.demo@example.com",
      eventType: "Événement d'entreprise",
      eventDate: eventDate2,
      peopleCount: 60,
      location: "Malika, Dakar",
      budget: 150000,
      products: [
        {
          productId: productBySlug.get("box-mixte-gourmande")?.id ?? null,
          name: "Box mixte Gourmande",
          quantity: 4,
        },
        {
          productId: productBySlug.get("tacos-poulet")?.id ?? null,
          name: "Tacos poulet",
          quantity: 30,
        },
      ],
      notes: "Démo — pause déjeuner d'équipe, livraison sur place à 12h30.",
      status: "CONTACTED",
      isDemo: true,
    },
  ]);

  await db.insert(expenses).values([
    {
      label: "Achat viande et volaille",
      category: "Ingrédients",
      amount: 45000,
      expenseDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10),
      notes: "Démo — marché de Keur Massar.",
      isDemo: true,
    },
    {
      label: "Boîtes et sachets kraft",
      category: "Emballages",
      amount: 18500,
      expenseDate: new Date(now.getTime() - 4 * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10),
      notes: "Démo — stock pour les box.",
      isDemo: true,
    },
    {
      label: "Carburant livraisons",
      category: "Livraison",
      amount: 12000,
      expenseDate: new Date(now.getTime() - 1 * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10),
      notes: "Démo — semaine en cours.",
      isDemo: true,
    },
    {
      label: "Impression flyers",
      category: "Marketing",
      amount: 25000,
      expenseDate: new Date(now.getTime() - 9 * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10),
      notes: "Démo — flyers quartier.",
      isDemo: true,
    },
  ]);

  await db.insert(mediaAssets).values([
    { name: "Mini-fataya doré", url: "/images/fataya.jpg", type: "IMAGE", alt: "Mini-fataya" },
    { name: "Tacos viande", url: "/images/tacos.jpg", type: "IMAGE", alt: "Tacos" },
    { name: "Crêpe Nutella", url: "/images/crepe-nutella.jpg", type: "IMAGE", alt: "Crêpe" },
    { name: "Ambiance maison", url: "/images/spread.jpg", type: "IMAGE", alt: "Table gourmande" },
    {
      name: "Vidéo coulisses",
      url: "/videos/maison-gourmande.mp4",
      type: "VIDEO",
      alt: "Chef en cuisine",
    },
  ]);

  console.log("Création des clients et commandes de démonstration…");
  const demoCustomers = await db
    .insert(customers)
    .values([
      {
        name: "Aïcha K.",
        phone: "+221 77 123 45 67",
        email: "aicha.demo@example.com",
        address: "Keur Massar, Gouye Gui",
        notes: "Cliente de démonstration. Préfère la livraison en fin de journée.",
        isDemo: true,
      },
      {
        name: "Yann B.",
        phone: "+221 76 234 56 78",
        email: "yann.demo@example.com",
        address: "Malika, Dakar",
        notes: "Client de démonstration.",
        isDemo: true,
      },
      {
        name: "Mariam K.",
        phone: "+221 70 345 67 89",
        email: "mariam.demo@example.com",
        address: "Guédiawaye, Dakar",
        isDemo: true,
      },
      {
        name: "Fatou D.",
        phone: "+221 78 456 78 90",
        email: "fatou.demo@example.com",
        address: "Parcelles Assainies, Dakar",
        isDemo: true,
      },
    ])
    .returning();
  const customerByPhone = new Map(demoCustomers.map((row) => [row.phone, row]));

  const miniFataya = productBySlug.get("mini-fataya")!;
  const miniFatayaVariants = variantsByProduct.get("mini-fataya")!;
  const miniFatayaBox10 = miniFatayaVariants.find((v) => v.name === "Box de 10")!;
  const bissap = productBySlug.get("bissap-maison")!;
  const bissap50 = variantsByProduct.get("bissap-maison")!.find((v) => v.name === "50 cl")!;
  const tacosViande = productBySlug.get("tacos-viande")!;
  const tacosViandeNormal = variantsByProduct.get("tacos-viande")!.find((v) => v.name === "Normal")!;
  const crepeNutella = productBySlug.get("crepe-nutella")!;
  const crepeNutellaGourmande = variantsByProduct
    .get("crepe-nutella")!
    .find((v) => v.name === "Gourmande")!;
  const pizzaPoulet = productBySlug.get("pizza-poulet-bbq")!;
  const pizzaPouletGrande = variantsByProduct
    .get("pizza-poulet-bbq")!
    .find((v) => v.name === "Grande")!;
  const nems = productBySlug.get("nems")!;
  const nemsBox10 = variantsByProduct.get("nems")!.find((v) => v.name === "Box de 10")!;
  const miniPizza = productBySlug.get("mini-pizza")!;
  const miniPizzaBox4 = variantsByProduct.get("mini-pizza")!.find((v) => v.name === "Box de 4")!;
  const boxMixte = productBySlug.get("box-mixte-gourmande")!;
  const boxMixte25 = variantsByProduct.get("box-mixte-gourmande")![0];

  const orderSeeds = [
    {
      reference: "MG-DEMO-1024",
      customerPhone: "+221 77 123 45 67",
      customerName: "Aïcha K.",
      status: "COMPLETED" as const,
      paymentStatus: "PAID" as const,
      amountReceived: 5000,
      deliveryMode: "DELIVERY" as const,
      address: "Keur Massar, Gouye Gui",
      subtotal: 4000,
      deliveryFee: 1000,
      total: 5000,
      notes: "Démo — laisser à la réception.",
      createdAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
      completedAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000 + 3600 * 1000),
      items: [
        {
          product: miniFataya,
          variant: miniFatayaBox10,
          quantity: 2,
          unitPrice: 1000,
          options: [],
        },
        {
          product: bissap,
          variant: bissap50,
          quantity: 2,
          unitPrice: 1000,
          options: [],
        },
      ],
    },
    {
      reference: "MG-DEMO-1025",
      customerPhone: "+221 76 234 56 78",
      customerName: "Yann B.",
      status: "PREPARING" as const,
      paymentStatus: "PARTIAL" as const,
      amountReceived: 3000,
      deliveryMode: "DELIVERY" as const,
      address: "Malika, Dakar",
      subtotal: 6700,
      deliveryFee: 1000,
      total: 7700,
      notes: "Démo — sans oignons sur le tacos.",
      createdAt: new Date(now.getTime() - 22 * 3600 * 1000),
      completedAt: null,
      items: [
        {
          product: tacosViande,
          variant: tacosViandeNormal,
          quantity: 1,
          unitPrice: 2700,
          options: [{ id: "demo-option-fromage", name: "Sauce fromagère", price: 200 }],
        },
        {
          product: crepeNutella,
          variant: crepeNutellaGourmande,
          quantity: 2,
          unitPrice: 2000,
          options: [],
        },
      ],
    },
    {
      reference: "MG-DEMO-1026",
      customerPhone: "+221 70 345 67 89",
      customerName: "Mariam K.",
      status: "PENDING" as const,
      paymentStatus: "UNPAID" as const,
      amountReceived: 0,
      deliveryMode: "PICKUP" as const,
      address: "",
      subtotal: 8000,
      deliveryFee: 0,
      total: 8000,
      notes: "Démo — retrait prévu vers 19h.",
      createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
      completedAt: null,
      items: [
        {
          product: pizzaPoulet,
          variant: pizzaPouletGrande,
          quantity: 1,
          unitPrice: 6500,
          options: [],
        },
        {
          product: nems,
          variant: nemsBox10,
          quantity: 1,
          unitPrice: 1500,
          options: [],
        },
      ],
    },
    {
      reference: "MG-DEMO-1027",
      customerPhone: "+221 78 456 78 90",
      customerName: "Fatou D.",
      status: "CONFIRMED" as const,
      paymentStatus: "PAID" as const,
      amountReceived: 4500,
      deliveryMode: "DELIVERY" as const,
      address: "Parcelles Assainies, Dakar",
      subtotal: 4500,
      deliveryFee: 0,
      total: 4500,
      notes: "Démo — livraison offerte (offre box).",
      createdAt: new Date(now.getTime() - 28 * 3600 * 1000),
      completedAt: null,
      items: [
        {
          product: boxMixte,
          variant: boxMixte25,
          quantity: 1,
          unitPrice: 4500,
          options: [],
        },
      ],
    },
    {
      reference: "MG-DEMO-1028",
      customerPhone: "+221 70 345 67 89",
      customerName: "Mariam K.",
      status: "CANCELLED" as const,
      paymentStatus: "UNPAID" as const,
      amountReceived: 0,
      deliveryMode: "DELIVERY" as const,
      address: "Guédiawaye, Dakar",
      subtotal: 3500,
      deliveryFee: 1000,
      total: 4500,
      notes: "Démo — commande annulée, client absent.",
      createdAt: new Date(now.getTime() - 3 * 24 * 3600 * 1000),
      completedAt: null,
      items: [
        {
          product: miniPizza,
          variant: miniPizzaBox4,
          quantity: 1,
          unitPrice: 3500,
          options: [],
        },
      ],
    },
  ];

  for (const seed of orderSeeds) {
    const customer = customerByPhone.get(seed.customerPhone);
    const [order] = await db
      .insert(orders)
      .values({
        reference: seed.reference,
        customerId: customer?.id ?? null,
        customerName: seed.customerName,
        customerPhone: seed.customerPhone,
        channel: "WHATSAPP",
        deliveryMode: seed.deliveryMode,
        address: seed.address,
        notes: seed.notes,
        subtotal: seed.subtotal,
        quantityDiscount: 0,
        promotionDiscount: 0,
        deliveryFee: seed.deliveryFee,
        discountTotal: 0,
        total: seed.total,
        status: seed.status,
        paymentStatus: seed.paymentStatus,
        amountReceived: seed.amountReceived,
        isDemo: true,
        createdBy: admin.id,
        confirmedAt:
          seed.status !== "PENDING" && seed.status !== "CANCELLED"
            ? seed.createdAt
            : null,
        completedAt: seed.completedAt,
        createdAt: seed.createdAt,
        updatedAt: seed.createdAt,
      })
      .returning();

    await db.insert(orderItems).values(
      seed.items.map((item) => ({
        orderId: order.id,
        productId: item.product.id,
        variantId: item.variant.id,
        productName: item.product.name,
        variantName: item.variant.name,
        imageUrl: item.product.imageUrl,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.unitPrice * item.quantity,
        costPrice: item.product.costPrice * item.variant.quantity,
        optionsSnapshot: item.options,
      })),
    );
  }

  console.log("Enregistrement des paramètres du site…");
  const settingsToSave = {
    ...DEFAULT_SETTINGS,
    videoPoster: "/images/chef.jpg",
    heroImage: "/images/hero-fataya.jpg",
  };
  for (const [key, value] of Object.entries(settingsToSave)) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  await db.insert(auditLogs).values({
    actorId: admin.id,
    actorName: "Système",
    action: "Installation des données de démonstration",
    entity: "database",
    details: {
      produits: PRODUCTS.length,
      commandes_demo: orderSeeds.length,
      admin: adminEmail,
    },
  });

  console.log("──────────────────────────────────────────────────────────────");
  console.log("Seed terminé avec succès.");
  console.log("Admin :", adminEmail);
  if (process.env.ADMIN_PASSWORD) {
    console.log("Mot de passe : celui défini dans ADMIN_PASSWORD (.env.local).");
  }
  console.log("Données de démonstration : commandes, avis, devis et dépenses");
  console.log("portent le marqueur « Démo » dans l'espace de gestion.");
  console.log("──────────────────────────────────────────────────────────────");
  await closeDb();
}

main().catch(async (error) => {
  console.error("Échec du seed :", error);
  await closeDb().catch(() => undefined);
  process.exit(1);
});