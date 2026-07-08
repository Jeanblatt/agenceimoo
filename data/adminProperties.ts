import type { PropertyType } from "@/data/properties";

export type AdminPropertyStatus = "Disponible" | "Réservé" | "Vendu";

// Données locales simulées. Chaque champ correspond à ce qu'une vraie base
// (ex. Supabase) renverrait plus tard — la structure est déjà prête pour être
// remplacée par des requêtes Supabase sans changer les composants qui la lisent.
export interface AdminProperty {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  type: PropertyType;
  surface: number;
  bedrooms: number;
  status: AdminPropertyStatus;
  image: string;
}

export const adminProperties: AdminProperty[] = [
  {
    id: "1",
    title: "Appartement Haut Standing",
    description:
      "Un appartement lumineux au cœur des Berges du Lac, avec vue dégagée sur le lac de Tunis et finitions haut de gamme.",
    location: "Les Berges du Lac, Tunis",
    price: 850000,
    type: "Appartement",
    surface: 140,
    bedrooms: 3,
    status: "Disponible",
    image: "/images/properties/appartement-1/exterior.jpg",
  },
  {
    id: "2",
    title: "Villa Moderne avec Piscine",
    description:
      "Villa contemporaine nichée dans les hauteurs de Gammarth, piscine à débordement et vue imprenable sur la Méditerranée.",
    location: "Gammarth, Tunis",
    price: 2200000,
    type: "Villa",
    surface: 380,
    bedrooms: 5,
    status: "Réservé",
    image: "/images/properties/villa-1/exterior.jpg",
  },
  {
    id: "3",
    title: "Maison Traditionnelle",
    description:
      "Authentique demeure aux volets bleus et façades blanchies à la chaux, au cœur du village de Sidi Bou Saïd.",
    location: "Sidi Bou Saïd",
    price: 1350000,
    type: "Maison traditionnelle",
    surface: 260,
    bedrooms: 4,
    status: "Disponible",
    image: "/images/properties/maison-1/exterior.jpg",
  },
  {
    id: "4",
    title: "Terrain Constructible",
    description:
      "Parcelle plane et viabilisée à proximité des plages de Nabeul, idéale pour un projet résidentiel.",
    location: "Nabeul",
    price: 420000,
    type: "Terrain",
    surface: 800,
    bedrooms: 0,
    status: "Disponible",
    image: "/images/properties/terrain-1/exterior.jpg",
  },
  {
    id: "5",
    title: "Penthouse Vue Mer",
    description:
      "Penthouse dernier étage à La Marsa avec immense terrasse et vue panoramique sur le golfe de Tunis.",
    location: "La Marsa",
    price: 1950000,
    type: "Penthouse",
    surface: 220,
    bedrooms: 4,
    status: "Vendu",
    image: "/images/properties/appartement-2/exterior.jpg",
  },
  {
    id: "6",
    title: "Villa avec Vue Panoramique",
    description:
      "Villa d'architecture contemporaine à Carthage, entre sites historiques et bord de mer.",
    location: "Carthage",
    price: 2600000,
    type: "Villa",
    surface: 340,
    bedrooms: 5,
    status: "Disponible",
    image: "/images/properties/villa-2/exterior.jpg",
  },
  {
    id: "7",
    title: "Dar Traditionnelle",
    description:
      "Maison secondaire de charme à Hammamet, à quelques minutes de la médina et des plages.",
    location: "Hammamet",
    price: 980000,
    type: "Maison traditionnelle",
    surface: 210,
    bedrooms: 4,
    status: "Disponible",
    image: "/images/properties/maison-2/exterior.jpg",
  },
  {
    id: "8",
    title: "Local Commercial Centre-Ville",
    description:
      "Local commercial bien situé en centre-ville de Sousse, forte visibilité et emplacement stratégique.",
    location: "Sousse",
    price: 650000,
    type: "Local commercial",
    surface: 180,
    bedrooms: 0,
    status: "Vendu",
    image: "/images/properties/terrain-2/exterior.jpg",
  },
  {
    id: "9",
    title: "Villa Vue Marina",
    description:
      "Villa face à la marina de Monastir, piscine privée et accès direct aux pontons.",
    location: "Monastir",
    price: 1750000,
    type: "Villa",
    surface: 300,
    bedrooms: 4,
    status: "Vendu",
    image: "/images/properties/villa-2/terrace.jpg",
  },
  {
    id: "10",
    title: "Appartement Vue Mer",
    description:
      "Appartement rénové avec vue mer directe, à deux pas des plages de Djerba.",
    location: "Djerba",
    price: 590000,
    type: "Appartement",
    surface: 130,
    bedrooms: 3,
    status: "Réservé",
    image: "/images/properties/maison-1/kitchen.jpg",
  },
];
