export type PropertyType =
  | "Villa"
  | "Appartement"
  | "Penthouse"
  | "Terrain"
  | "Maison traditionnelle"
  | "Local commercial";

export interface Property {
  id: string;
  title: string;
  description: string;
  /** URLs des images du bien. Laisser vide en attendant les visuels IA. */
  images?: string[];
  location: string;
  price: number;
  area: number;
  bedrooms: number;
  type: PropertyType;
  featured?: boolean;
  /** Caractéristiques supplémentaires affichées sur la fiche détaillée. */
  features?: string[];
}

export const properties: Property[] = [
  {
    id: "1",
    title: "Appartement Haut Standing",
    description:
      "Un appartement lumineux au cœur des Berges du Lac, avec vue dégagée sur le lac de Tunis, finitions haut de gamme et parking sécurisé.",
    location: "Les Berges du Lac, Tunis",
    price: 850000,
    area: 140,
    bedrooms: 3,
    type: "Appartement",
    features: [
      "Vue sur le lac de Tunis",
      "Parking sécurisé",
      "Ascenseur",
      "Résidence gardée",
    ],
    images: [
      "/images/properties/appartement-1/exterior.jpg",
      "/images/properties/appartement-1/living-room.jpg",
      "/images/properties/appartement-1/bedroom.jpg",
    ],
  },
  {
    id: "2",
    title: "Villa Moderne avec Piscine",
    description:
      "Villa contemporaine nichée dans les hauteurs de Gammarth, piscine à débordement, jardin paysager et vue imprenable sur la Méditerranée.",
    location: "Gammarth, Tunis",
    price: 2200000,
    area: 380,
    bedrooms: 5,
    type: "Villa",
    featured: true,
    features: [
      "Piscine à débordement",
      "Vue mer",
      "Jardin paysager",
      "Garage double",
      "Domotique",
    ],
    images: [
      "/images/properties/villa-1/exterior.jpg",
      "/images/properties/villa-1/living-room.jpg",
      "/images/properties/villa-1/pool.jpg",
    ],
  },
  {
    id: "3",
    title: "Maison Traditionnelle",
    description:
      "Authentique demeure aux volets bleus et façades blanchies à la chaux, au cœur du village emblématique de Sidi Bou Saïd, avec patio andalou et terrasse panoramique.",
    location: "Sidi Bou Saïd",
    price: 1350000,
    area: 260,
    bedrooms: 4,
    type: "Maison traditionnelle",
    features: [
      "Patio traditionnel",
      "Terrasse vue mer",
      "Architecture andalouse",
      "Proche médina",
    ],
    images: [
      "/images/properties/maison-1/exterior.jpg",
      "/images/properties/maison-1/kitchen.jpg",
      "/images/properties/maison-1/garden.jpg",
    ],
  },
  {
    id: "4",
    title: "Terrain Constructible",
    description:
      "Parcelle plane et viabilisée à proximité des plages de Nabeul, idéale pour un projet résidentiel ou une résidence secondaire.",
    location: "Nabeul",
    price: 420000,
    area: 800,
    bedrooms: 0,
    type: "Terrain",
    features: [
      "Terrain viabilisé",
      "Proche plage",
      "Titre foncier",
      "Zone résidentielle calme",
    ],
    images: [
      "/images/properties/terrain-1/exterior.jpg",
      "/images/properties/terrain-1/view.jpg",
      "/images/properties/terrain-1/plan.jpg",
    ],
  },
  {
    id: "5",
    title: "Penthouse Vue Mer",
    description:
      "Penthouse dernier étage à La Marsa avec immense terrasse, vue panoramique sur le golfe de Tunis et prestations haut de gamme.",
    location: "La Marsa",
    price: 1950000,
    area: 220,
    bedrooms: 4,
    type: "Penthouse",
    featured: true,
    features: [
      "Terrasse panoramique",
      "Vue golfe de Tunis",
      "Ascenseur privatif",
      "Climatisation centrale",
    ],
    images: [
      "/images/properties/appartement-2/exterior.jpg",
      "/images/properties/appartement-2/living-room.jpg",
      "/images/properties/appartement-2/terrace.jpg",
    ],
  },
  {
    id: "6",
    title: "Villa avec Vue Panoramique",
    description:
      "Villa d'architecture contemporaine à Carthage, entre sites historiques et bord de mer, grandes baies vitrées et piscine chauffée.",
    location: "Carthage",
    price: 2600000,
    area: 340,
    bedrooms: 5,
    type: "Villa",
    features: [
      "Piscine chauffée",
      "Vue mer",
      "Proche sites archéologiques",
      "Grand jardin",
    ],
    images: [
      "/images/properties/villa-2/exterior.jpg",
      "/images/properties/villa-2/living-room.jpg",
      "/images/properties/villa-2/terrace.jpg",
    ],
  },
  {
    id: "7",
    title: "Dar Traditionnelle",
    description:
      "Maison secondaire de charme à Hammamet, à quelques minutes de la médina et des plages, jardin ombragé et piscine privée.",
    location: "Hammamet",
    price: 980000,
    area: 210,
    bedrooms: 4,
    type: "Maison traditionnelle",
    features: [
      "Piscine privée",
      "Jardin ombragé",
      "Proche médina",
      "Climatisation",
    ],
    images: [
      "/images/properties/maison-2/exterior.jpg",
      "/images/properties/maison-2/kitchen.jpg",
      "/images/properties/maison-2/garden.jpg",
    ],
  },
  {
    id: "8",
    title: "Local Commercial Centre-Ville",
    description:
      "Local commercial bien situé en centre-ville de Sousse, forte visibilité, idéal pour commerce ou activité de bureau.",
    location: "Sousse",
    price: 650000,
    area: 180,
    bedrooms: 0,
    type: "Local commercial",
    features: [
      "Grande vitrine",
      "Emplacement stratégique",
      "Climatisation",
      "Parking à proximité",
    ],
    images: [
      "/images/properties/terrain-2/exterior.jpg",
      "/images/properties/terrain-2/vineyard.jpg",
      "/images/properties/terrain-2/view.jpg",
    ],
  },
];
