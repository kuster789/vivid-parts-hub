export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  stock: number;
  brand: string;
  model: string;
  images: string[];
  variations: { name: string; options: string[] }[];
  has3D: boolean;
}

export interface BrandData {
  name: string;
  slug: string;
  models: string[];
  icon: string;
  logo?: string;
}

import yamahaLogo from "@/assets/brands/yamaha.png";
import agraleLogo from "@/assets/brands/agrale.png";
import cagivaLogo from "@/assets/brands/cagiva.png";
import ktmLogo from "@/assets/brands/ktm.png";

export const brands: BrandData[] = [
  {
    name: "YAMAHA",
    slug: "yamaha",
    icon: "🏍",
    logo: yamahaLogo,
    models: ["RD 125", "RD 135", "RDZ 125", "RDZ 135", "DT 180", "DT 180 Z", "RD 350", "DT200", "DT200R"],
  },
  {
    name: "AGRALE",
    slug: "agrale",
    icon: "🛵",
    logo: agraleLogo,
    models: ["Agrale 13.5", "Agrale 16.5", "Agrale 27.5", "Agrale 27.5 E", "Agrale 27.5 EX", "Agrale Dakar 30.0", "Agrale Elefant 16.5", "Agrale Elefant 30.0"],
  },
  {
    name: "CAGIVA",
    slug: "cagiva",
    icon: "🏍",
    logo: cagivaLogo,
    models: ["Super City 125", "Mito Evo 2", "Mito", "W8", "W16"],
  },
  {
    name: "KTM",
    slug: "ktm",
    icon: "🏍",
    logo: ktmLogo,
    models: ["KTM 950cc"],
  },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Kit Pistão Completo RD 135",
    description: "Kit pistão forjado de alta performance para Yamaha RD 135. Inclui pistão, anéis, pino e travas. Material em liga de alumínio de alta resistência térmica.",
    price: 189.90,
    sku: "YAM-RD135-PST-001",
    stock: 45,
    brand: "yamaha",
    model: "RD 135",
    images: [],
    variations: [{ name: "Medida", options: ["STD", "0.25", "0.50", "0.75", "1.00"] }],
    has3D: true,
  },
  {
    id: "2",
    name: "Cilindro Motor RD 125",
    description: "Cilindro do motor original para Yamaha RD 125. Acabamento em nikasil para maior durabilidade. Pronto para instalação.",
    price: 459.90,
    sku: "YAM-RD125-CIL-001",
    stock: 12,
    brand: "yamaha",
    model: "RD 125",
    images: [],
    variations: [],
    has3D: true,
  },
  {
    id: "3",
    name: "Virabrequim Agrale 27.5",
    description: "Virabrequim completo para Agrale 27.5. Balanceado dinamicamente. Acompanha biela e rolamentos.",
    price: 890.00,
    sku: "AGR-275-VBQ-001",
    stock: 8,
    brand: "agrale",
    model: "Agrale 27.5",
    images: [],
    variations: [],
    has3D: true,
  },
  {
    id: "4",
    name: "Carburador Completo DT 180",
    description: "Carburador completo para Yamaha DT 180. Modelo original com todas as regulagens de fábrica. Inclui boia e agulha.",
    price: 345.00,
    sku: "YAM-DT180-CARB-001",
    stock: 20,
    brand: "yamaha",
    model: "DT 180",
    images: [],
    variations: [],
    has3D: false,
  },
  {
    id: "5",
    name: "Kit Embreagem Cagiva Mito",
    description: "Kit completo de embreagem para Cagiva Mito. Inclui discos de fricção, separadores e molas reforçadas.",
    price: 520.00,
    sku: "CAG-MITO-EMB-001",
    stock: 15,
    brand: "cagiva",
    model: "Mito",
    images: [],
    variations: [],
    has3D: false,
  },
  {
    id: "6",
    name: "Junta do Cabeçote Agrale Dakar 30.0",
    description: "Junta do cabeçote em cobre para Agrale Dakar 30.0. Alta resistência térmica e vedação perfeita.",
    price: 78.90,
    sku: "AGR-DK30-JTC-001",
    stock: 60,
    brand: "agrale",
    model: "Agrale Dakar 30.0",
    images: [],
    variations: [],
    has3D: false,
  },
  {
    id: "7",
    name: "Kit Rolamento Motor RDZ 135",
    description: "Kit de rolamentos do motor para Yamaha RDZ 135. Rolamentos de alta precisão selados. Kit completo para revisão.",
    price: 215.00,
    sku: "YAM-RDZ135-ROL-001",
    stock: 30,
    brand: "yamaha",
    model: "RDZ 135",
    images: [],
    variations: [],
    has3D: false,
  },
  {
    id: "8",
    name: "Escapamento Esportivo KTM 950cc",
    description: "Escapamento esportivo em aço inox para KTM 950cc. Melhora o fluxo de gases e performance. Som esportivo agressivo.",
    price: 1890.00,
    sku: "KTM-950-ESC-001",
    stock: 5,
    brand: "ktm",
    model: "KTM 950cc",
    images: [],
    variations: [{ name: "Acabamento", options: ["Polido", "Escovado", "Preto"] }],
    has3D: true,
  },
  {
    id: "9",
    name: "Retentor de Motor Agrale 16.5",
    description: "Kit de retentores do motor para Agrale 16.5. Material em viton para maior durabilidade. Kit completo.",
    price: 65.00,
    sku: "AGR-165-RET-001",
    stock: 80,
    brand: "agrale",
    model: "Agrale 16.5",
    images: [],
    variations: [],
    has3D: false,
  },
  {
    id: "10",
    name: "CDI Programável RD 350",
    description: "CDI eletrônico programável para Yamaha RD 350. Permite ajuste de curva de ignição. Performance otimizada.",
    price: 650.00,
    sku: "YAM-RD350-CDI-001",
    stock: 10,
    brand: "yamaha",
    model: "RD 350",
    images: [],
    variations: [],
    has3D: false,
  },
  {
    id: "11",
    name: "Câmbio Completo Super City 125",
    description: "Conjunto de engrenagens do câmbio para Cagiva Super City 125. Todas as marchas. Aço temperado.",
    price: 780.00,
    sku: "CAG-SC125-CMB-001",
    stock: 7,
    brand: "cagiva",
    model: "Super City 125",
    images: [],
    variations: [],
    has3D: true,
  },
  {
    id: "12",
    name: "Kit Cabeçote DT200R",
    description: "Kit cabeçote completo para Yamaha DT200R. Inclui cabeçote usinado, juntas e parafusos. Alta compressão.",
    price: 1250.00,
    sku: "YAM-DT200R-CBC-001",
    stock: 4,
    brand: "yamaha",
    model: "DT200R",
    images: [],
    variations: [],
    has3D: true,
  },
];
