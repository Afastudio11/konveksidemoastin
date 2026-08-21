import { useState } from "react";
import { Plus, Shirt, ShirtIcon, Layers, Circle, Waves, School, GraduationCap, Flower2, HardHat, CloudRain, Move, Award, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PriceRange {
  quantity: string;
  price: string;
  materials?: string;
}

interface SizeChart {
  headers: string[];
  rows: { [key: string]: string }[];
}

interface Product {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  options: string[];
  sizeChart: SizeChart;
  pricing: PriceRange[];
  include?: string;
}

const products: Product[] = [
  {
    name: "ROMPI",
    icon: Layers,
    description: "Buat tampilan kerja atau komunitas semakin profesional dengan rompi custom dari kami! Cocok untuk seragam lapangan, event, atau kebutuhan fashion lainnya. Rompi kami dibuat dari bahan berkualitas tinggi yang ringan namun tetap kuat, tersedia dalam berbagai model dengan tambahan kantong fungsional dan fitur custom desain agar semakin eksklusif.",
    options: ["+5K-10K 1 TITIK BORDIR", "+7K RESLETING", "+10K SCOTLIGHT", "+5K FURING"],
    sizeChart: {
      headers: ["SIZE", "LENGTH", "WIDTH"],
      rows: [
        { SIZE: "S", LENGTH: "60cm", WIDTH: "100cm" },
        { SIZE: "M", LENGTH: "62cm", WIDTH: "104cm" },
        { SIZE: "L", LENGTH: "64cm", WIDTH: "108cm" },
        { SIZE: "XL", LENGTH: "66cm", WIDTH: "112cm" },
        { SIZE: "XXL", LENGTH: "68cm", WIDTH: "116cm" },
        { SIZE: "XXXL", LENGTH: "70cm", WIDTH: "120cm" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "170K", materials: "AMERICAN, NAGATA, PARASUT, DESVO, MAYER (REQUEST)" },
      { quantity: "24-64", price: "165K", materials: "AMERICAN, NAGATA, PARASUT, DESVO, MAYER (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "AMERICAN, NAGATA, PARASUT, DESVO, MAYER (REQUEST)" }
    ],
    include: "2 TITIK BORDIR"
  },
  {
    name: "KEMEJA",
    icon: Shirt,
    description: "Butuh kemeja yang tampil elegan dan profesional? Kami menyediakan kemeja custom dengan bahan berkualitas yang nyaman dikenakan sepanjang hari. Cocok untuk seragam kerja, komunitas, atau keperluan formal lainnya. Kemeja kami hadir dengan pilihan bordir atau sablon detail tinggi yang awet dan tidak mudah pudar, jadikan tim atau komunitasmu tampil lebih rapi dan berkelas dengan kemeja yang sesuai identitas mereka!",
    options: ["+5K-10K 1 TITIK BORDIR", "MENYESUAIKAN CUSTOM BORDIR"],
    sizeChart: {
      headers: ["SIZE", "SLEEVE LENGTH", "LENGTH", "WIDTH"],
      rows: [
        { SIZE: "S", "SLEEVE LENGTH": "23/58cm", LENGTH: "68cm", WIDTH: "100cm" },
        { SIZE: "M", "SLEEVE LENGTH": "24/59cm", LENGTH: "70cm", WIDTH: "104cm" },
        { SIZE: "L", "SLEEVE LENGTH": "25/60cm", LENGTH: "72cm", WIDTH: "108cm" },
        { SIZE: "XL", "SLEEVE LENGTH": "26/62cm", LENGTH: "74cm", WIDTH: "112cm" },
        { SIZE: "XXL", "SLEEVE LENGTH": "27/63cm", LENGTH: "76cm", WIDTH: "116cm" },
        { SIZE: "XXXL", "SLEEVE LENGTH": "28/65cm", LENGTH: "78cm", WIDTH: "120cm" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "165K", materials: "AMERICAN, NAGATA, TROPICAL RIPSTOP, HISOFY (REQUEST)" },
      { quantity: "24-64", price: "160K", materials: "AMERICAN, NAGATA, TROPICAL RIPSTOP, HISOFY (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "AMERICAN, NAGATA, TROPICAL RIPSTOP, HISOFY (REQUEST)" }
    ],
    include: "2 TITIK BORDIR"
  },
  {
    name: "KAOS POLO",
    icon: ShirtIcon,
    description: "Tampilkan gaya casual yang tetap elegan dengan kaos polo premium dari kami! Terbuat dari bahan berkualitas tinggi yang nyaman di kulit, kaos polo kami cocok untuk seragam kerja, komunitas, atau sekedar tampil lebih rapi dalam berbagai kesempatan. Dengan pilihan bordir logo atau desain eksklusif, kaos polo ini bisa memperkuat identitas tim atau perusahaanmu.",
    options: ["+5K OVERSIZE", "+5K LENGAN PANJANG", "+5K-10K RIB", "MENYESUAIKAN SABLON"],
    sizeChart: {
      headers: ["SIZE", "SLEEVE LENGTH", "LENGTH", "WIDTH"],
      rows: [
        { SIZE: "S", "SLEEVE LENGTH": "23cm", LENGTH: "66cm", WIDTH: "100cm" },
        { SIZE: "M", "SLEEVE LENGTH": "24cm", LENGTH: "68cm", WIDTH: "104cm" },
        { SIZE: "L", "SLEEVE LENGTH": "25cm", LENGTH: "70cm", WIDTH: "108cm" },
        { SIZE: "XL", "SLEEVE LENGTH": "26cm", LENGTH: "72cm", WIDTH: "112cm" },
        { SIZE: "XXL", "SLEEVE LENGTH": "27cm", LENGTH: "74cm", WIDTH: "116cm" },
        { SIZE: "XXXL", "SLEEVE LENGTH": "28cm", LENGTH: "76cm", WIDTH: "120cm" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "95K", materials: "CVC PIQUE, COTTON PIQUE, POLYESTER" },
      { quantity: "24-64", price: "90K", materials: "CVC PIQUE, COTTON PIQUE, POLYESTER" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "CVC PIQUE, COTTON PIQUE, POLYESTER" }
    ],
    include: "2 TITIK BORDIR"
  },
  {
    name: "HOODIE",
    icon: Circle,
    description: "Tampil keren dan tetap nyaman dengan hoodie custom dari kami! Terbuat dari bahan fleece premium yang lembut dan hangat, hoodie ini cocok dipakai untuk gaya casual sehari-hari maupun event komunitas. Bisa dipersonalisasi dengan desain bordir atau sablon berkualitas tinggi yang tahan lama. Tersedia model zipper atau pullover sesuai kebutuhanmu. Dapatkan hoodie eksklusif dengan desain yang hanya kamu miliki!",
    options: ["+5K OVERSIZE", "+5K RESLETING", "+5K-10K 1 TITIK BORDIR", "MENYESUAIKAN SABLON"],
    sizeChart: {
      headers: ["SIZE", "SLEEVE LENGTH", "LENGTH", "WIDTH"],
      rows: [
        { SIZE: "S", "SLEEVE LENGTH": "61", LENGTH: "71", WIDTH: "54" },
        { SIZE: "M", "SLEEVE LENGTH": "62", LENGTH: "73", WIDTH: "56" },
        { SIZE: "L", "SLEEVE LENGTH": "63", LENGTH: "75", WIDTH: "58" },
        { SIZE: "XL", "SLEEVE LENGTH": "64", LENGTH: "77", WIDTH: "60" },
        { SIZE: "XXL", "SLEEVE LENGTH": "65", LENGTH: "79", WIDTH: "62" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "180K", materials: "FLEECE, BABY TERRY, FRENCH TERRY, (REQUEST)" },
      { quantity: "24-64", price: "175K", materials: "FLEECE, BABY TERRY, FRENCH TERRY, (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "FLEECE, BABY TERRY, FRENCH TERRY, (REQUEST)" }
    ]
  },
  {
    name: "SWEATER",
    icon: Waves,
    description: "Nikmati kenyamanan maksimal dengan sweater berkualitas tinggi yang bisa kamu custom sesuai selera! Dibuat dari bahan tebal namun tetap breathable, sweater ini cocok untuk menjaga tubuh tetap hangat saat cuaca dingin tanpa mengurangi gaya. Pilih sablon atau bordir eksklusif, kamu bisa menciptakan sweater dengan desain unik untuk komunitas, perusahaan, atau brand clothing-mu sendiri.",
    options: ["+5K OVERSIZE", "+5K RESLETING", "+5K-10K RIB", "+5K-10K 1 TITIK BORDIR", "MENYESUAIKAN SABLON"],
    sizeChart: {
      headers: ["SIZE", "SLEEVE LENGTH", "LENGTH", "WIDTH"],
      rows: [
        { SIZE: "S", "SLEEVE LENGTH": "61", LENGTH: "71", WIDTH: "54" },
        { SIZE: "M", "SLEEVE LENGTH": "62", LENGTH: "73", WIDTH: "56" },
        { SIZE: "L", "SLEEVE LENGTH": "63", LENGTH: "75", WIDTH: "58" },
        { SIZE: "XL", "SLEEVE LENGTH": "64", LENGTH: "77", WIDTH: "60" },
        { SIZE: "XXL", "SLEEVE LENGTH": "65", LENGTH: "79", WIDTH: "62" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "160K", materials: "FLEECE, BABY TERRY, FRENCH TERRY, (REQUEST)" },
      { quantity: "24-64", price: "155K", materials: "FLEECE, BABY TERRY, FRENCH TERRY, (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "FLEECE, BABY TERRY, FRENCH TERRY, (REQUEST)" }
    ]
  },
  {
    name: "PDH",
    icon: Shirt,
    description: "Tampilkan citra profesional dengan PDH berkualitas tinggi dari kami! Dibuat dari bahan premium yang nyaman dan tahan lama, PDH kami hadir dengan desain eksklusif yang bisa disesuaikan dengan identitas perusahaan, komunitas, atau organisasi anda. Dengan jahitan rapi dan detail presisi, seragam ini tidak hanya memberikan kenyamanan maksimal untuk aktivitas harian, segera pesan PDH terbaik untuk tim anda dan tingkatkan kebersamaan serta kebanggaan dalam setiap langkah!",
    options: ["+5K-10K 1 TITIK BORDIR", "+7K RESLETING", "+10K SCOTLIGHT", "+15K JAHITAN TAILOR", "+10K LENGAN PANJANG"],
    sizeChart: {
      headers: ["SIZE", "SLEEVE LENGTH", "LENGTH", "WIDTH"],
      rows: [
        { SIZE: "S", "SLEEVE LENGTH": "23/58cm", LENGTH: "68cm", WIDTH: "100cm" },
        { SIZE: "M", "SLEEVE LENGTH": "24/59cm", LENGTH: "70cm", WIDTH: "104cm" },
        { SIZE: "L", "SLEEVE LENGTH": "25/60cm", LENGTH: "72cm", WIDTH: "108cm" },
        { SIZE: "XL", "SLEEVE LENGTH": "26/62cm", LENGTH: "74cm", WIDTH: "112cm" },
        { SIZE: "XXL", "SLEEVE LENGTH": "27/63cm", LENGTH: "76cm", WIDTH: "116cm" },
        { SIZE: "XXXL", "SLEEVE LENGTH": "28/65cm", LENGTH: "78cm", WIDTH: "120cm" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "165K", materials: "AMERICAN, NAGATA, TROPICAL RIPSTOP, HISOFY (CUSTOM)" },
      { quantity: "24-64", price: "160K", materials: "AMERICAN, NAGATA, TROPICAL RIPSTOP, HISOFY (CUSTOM)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "AMERICAN, NAGATA, TROPICAL RIPSTOP, HISOFY (CUSTOM)" }
    ],
    include: "2 TITIK BORDIR"
  },
  {
    name: "BAJU SEKOLAH",
    icon: School,
    description: "Tampil rapi dan nyaman dengan seragam sekolah berkualitas! Kami menyediakan bahan berkualitas yang nyaman dikenakan sepanjang hari untuk SD, SMP, dan SMA. Tersedia dalam berbagai model dengan pilihan bordir atau sablon berkualitas tinggi untuk identitas sekolahmu. Sesuai dengan kebutuhan siswa, wujudkan seragam yang merepresentasikan kebanggaan dalam setiap langkah!",
    options: ["+5K-10K 1 TITIK BORDIR", "+15K JAHITAN TAILOR"],
    sizeChart: {
      headers: ["JENJANG", "SIZE", "SLEEVE LENGTH", "LENGTH", "WIDTH"],
      rows: [
        { JENJANG: "SD", SIZE: "7", "SLEEVE LENGTH": "16/40cm", LENGTH: "46cm", WIDTH: "39cm" },
        { JENJANG: "SD", SIZE: "8", "SLEEVE LENGTH": "17/42cm", LENGTH: "49cm", WIDTH: "41cm" },
        { JENJANG: "SD", SIZE: "9", "SLEEVE LENGTH": "18/44cm", LENGTH: "50cm", WIDTH: "43cm" },
        { JENJANG: "SMP", SIZE: "S", "SLEEVE LENGTH": "22/59cm", LENGTH: "64cm", WIDTH: "50cm" },
        { JENJANG: "SMP", SIZE: "M", "SLEEVE LENGTH": "23/58cm", LENGTH: "66cm", WIDTH: "52cm" },
        { JENJANG: "SMP", SIZE: "L", "SLEEVE LENGTH": "24/59cm", LENGTH: "68cm", WIDTH: "54cm" },
        { JENJANG: "SMA", SIZE: "S", "SLEEVE LENGTH": "24/56cm", LENGTH: "68cm", WIDTH: "100cm" },
        { JENJANG: "SMA", SIZE: "M", "SLEEVE LENGTH": "25/59cm", LENGTH: "70cm", WIDTH: "104cm" },
        { JENJANG: "SMA", SIZE: "L", "SLEEVE LENGTH": "26/60cm", LENGTH: "72cm", WIDTH: "108cm" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "85K", materials: "AMERICAN, NAGATA, PARASUT, DESVO, MAYER (REQUEST)" },
      { quantity: "24-64", price: "80K", materials: "AMERICAN, NAGATA, PARASUT, DESVO, MAYER (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "AMERICAN, NAGATA, PARASUT, DESVO, MAYER (REQUEST)" }
    ]
  },
  {
    name: "ALMAMATER",
    icon: GraduationCap,
    description: "Tunjukkan kebanggaan almamatermu dengan jaket almamater berkualitas tinggi! Terbuat dari bahan premium dengan jahitan rapi, jaket ini cocok untuk sekolah, kampus, atau komunitas yang ingin tampil lebih kompak dan profesional. Bisa diablon atau dibordir dengan logo dan nama institusi agar semakin eksklusif. Jangan tunda lagi, pesan sekarang dan ciptakan identitas unik bagi almamatermu!",
    options: ["+5K-10K 1 TITIK BORDIR", "+3K-5K LIST PINGGIRAN"],
    sizeChart: {
      headers: ["SIZE", "SLEEVE LENGTH", "LENGTH", "WIDTH"],
      rows: [
        { SIZE: "S", "SLEEVE LENGTH": "58cm", LENGTH: "68cm", WIDTH: "100cm" },
        { SIZE: "M", "SLEEVE LENGTH": "59cm", LENGTH: "70cm", WIDTH: "104cm" },
        { SIZE: "L", "SLEEVE LENGTH": "60cm", LENGTH: "72cm", WIDTH: "108cm" },
        { SIZE: "XL", "SLEEVE LENGTH": "62cm", LENGTH: "74cm", WIDTH: "112cm" },
        { SIZE: "XXL", "SLEEVE LENGTH": "63cm", LENGTH: "76cm", WIDTH: "116cm" },
        { SIZE: "XXXL", "SLEEVE LENGTH": "65cm", LENGTH: "78cm", WIDTH: "120cm" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "170K", materials: "AMERICAN, NAGATA, TROPICAL RIPSTOP, HISOFY (REQUEST)" },
      { quantity: "24-64", price: "165K", materials: "AMERICAN, NAGATA, TROPICAL RIPSTOP, HISOFY (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "AMERICAN, NAGATA, TROPICAL RIPSTOP, HISOFY (REQUEST)" }
    ],
    include: "1 TITIK BORDIR"
  },
  {
    name: "TOGA",
    icon: GraduationCap,
    description: "Rayakan momen kelulusan dengan toga berkualitas tinggi yang memberikan kesan elegan dan berwibawa! Dibuat dari bahan nyaman dengan desain yang anggun, toga kami tersedia dalam berbagai warna dan model sesuai kebutuhan institusi pendidikanmu. Dapatkan toga yang menjadikan momen wisudamu semakin berkesan dan tak terlupakan!",
    options: ["+5K-10K 1 TITIK BORDIR", "MENYESUAIKAN SYAL"],
    sizeChart: {
      headers: ["SIZE", "SLEEVE LENGTH", "LENGTH", "WIDTH"],
      rows: [
        { SIZE: "S", "SLEEVE LENGTH": "25/60cm", LENGTH: "104cm", WIDTH: "72cm" },
        { SIZE: "M", "SLEEVE LENGTH": "26/62cm", LENGTH: "105cm", WIDTH: "74cm" },
        { SIZE: "L", "SLEEVE LENGTH": "27/63cm", LENGTH: "106cm", WIDTH: "75cm" },
        { SIZE: "XL", "SLEEVE LENGTH": "28/65cm", LENGTH: "107cm", WIDTH: "78cm" },
        { SIZE: "XXL", "SLEEVE LENGTH": "28/65cm", LENGTH: "108cm", WIDTH: "80cm" },
        { SIZE: "XXXL", "SLEEVE LENGTH": "28/65cm", LENGTH: "109cm", WIDTH: "82cm" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "130K", materials: "SATIN TAFFETA, BELUDRU, GARBADIN, MATADOR, (REQUEST)" },
      { quantity: "24-64", price: "125K", materials: "SATIN TAFFETA, BELUDRU, GARBADIN, MATADOR, (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "SATIN TAFFETA, BELUDRU, GARBADIN, MATADOR, (REQUEST)" }
    ],
    include: "1 TITIK BORDIR"
  },
  {
    name: "TUNIK",
    icon: Flower2,
    description: "Tampil anggun dan tetap nyaman dengan tunik custom dari kami! Cocok untuk seragam kerja, event, atau kebutuhan komunitas, tunik kami tersedia dalam berbagai model dengan bahan premium yang adem dan nyaman dipakai sepanjang hari. Bisa disesuaikan dengan bordir atau sablon berkualitas tinggi untuk tampilan lebih eksklusif dan elegan.",
    options: [],
    sizeChart: {
      headers: ["SIZE", "SLEEVE LENGTH", "LENGTH", "WIDTH"],
      rows: [
        { SIZE: "S", "SLEEVE LENGTH": "25/60cm", LENGTH: "104cm", WIDTH: "100cm" },
        { SIZE: "M", "SLEEVE LENGTH": "26/62cm", LENGTH: "105cm", WIDTH: "104cm" },
        { SIZE: "L", "SLEEVE LENGTH": "27/63cm", LENGTH: "106cm", WIDTH: "108cm" },
        { SIZE: "XL", "SLEEVE LENGTH": "28/65cm", LENGTH: "107cm", WIDTH: "112cm" },
        { SIZE: "XXL", "SLEEVE LENGTH": "28/65cm", LENGTH: "108cm", WIDTH: "116cm" },
        { SIZE: "XXXL", "SLEEVE LENGTH": "28/65cm", LENGTH: "109cm", WIDTH: "120cm" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "170K", materials: "KATUN POPLIN, RAYON SATIN, WOLFIS, LINEN, (REQUEST)" },
      { quantity: "24-64", price: "165K", materials: "KATUN POPLIN, RAYON SATIN, WOLFIS, LINEN, (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "KATUN POPLIN, RAYON SATIN, WOLFIS, LINEN, (REQUEST)" }
    ]
  },
  {
    name: "WEAR PACK",
    icon: HardHat,
    description: "Lindungi diri dengan wearpack berkualitas tinggi yang nyaman dan aman digunakan! Dirancang untuk kebutuhan industri, wearpack kami dibuat dari bahan tahan lama yang kuat melindungi dari debu, kotoran, dan bahaya kerja lainnya. Dilengkapi dengan kantong fungsional serta desain ergonomis yang memastikan kenyamanan maksimal sepanjang hari. Cocok untuk bengkel, konstruksi, manufaktur, dan berbagai sektor lainnya!",
    options: ["+5K-10K 1 TITIK BORDIR", "+7K RESLETING", "+10K SCOTLIGHT", "+15K JAHITAN TAILOR"],
    sizeChart: {
      headers: ["UKURAN (BAJU)", "PANJANG BADAN", "LEBAR DADA", "LEBAR BAHU", "UKURAN (CELANA)", "LINGKAR PINGGANG", "LINGKAR PAHA", "PANJANG"],
      rows: [
        { "UKURAN (BAJU)": "M", "PANJANG BADAN": "66", "LEBAR DADA": "54", "LEBAR BAHU": "44", "UKURAN (CELANA)": "M", "LINGKAR PINGGANG": "95", "LINGKAR PAHA": "64", PANJANG: "94" },
        { "UKURAN (BAJU)": "L", "PANJANG BADAN": "68", "LEBAR DADA": "56", "LEBAR BAHU": "46", "UKURAN (CELANA)": "L", "LINGKAR PINGGANG": "100", "LINGKAR PAHA": "66", PANJANG: "96" },
        { "UKURAN (BAJU)": "XL", "PANJANG BADAN": "70", "LEBAR DADA": "59", "LEBAR BAHU": "48", "UKURAN (CELANA)": "XL", "LINGKAR PINGGANG": "106", "LINGKAR PAHA": "70", PANJANG: "98" },
        { "UKURAN (BAJU)": "XXL", "PANJANG BADAN": "72", "LEBAR DADA": "61", "LEBAR BAHU": "52", "UKURAN (CELANA)": "XXL", "LINGKAR PINGGANG": "112", "LINGKAR PAHA": "72", PANJANG: "100" },
        { "UKURAN (BAJU)": "XXXL", "PANJANG BADAN": "74", "LEBAR DADA": "63", "LEBAR BAHU": "52", "UKURAN (CELANA)": "XXXL", "LINGKAR PINGGANG": "118", "LINGKAR PAHA": "74", PANJANG: "100" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "240K", materials: "KATUN POPLIN, RAYON SATIN, WOLFIS, LINEN, (REQUEST)" },
      { quantity: "24-64", price: "235K", materials: "KATUN POPLIN, RAYON SATIN, WOLFIS, LINEN, (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "KATUN POPLIN, RAYON SATIN, WOLFIS, LINEN, (REQUEST)" }
    ],
    include: "2 TITIK BORDIR"
  },
  {
    name: "COACH JACKET",
    icon: CloudRain,
    description: "Jaket sporty dengan desain timeless yang wajib kamu miliki! Coach jacket kami dibuat dari bahan water-resistant yang ringan namun tetap memberikan perlindungan optimal. Cocok untuk aktivitas outdoor, komunitas, hingga fashion streetwear, jaket ini bisa kamu custom dengan bordir atau sablon eksklusif agar tampilanmu semakin standout. Jangan lewatkan kesempatan untuk tampil keren dan profesional dalam satu jaket!",
    options: ["+5K RESLETING", "+5K-10K 1 TITIK BORDIR", "MENYESUAIKAN SABLON"],
    sizeChart: {
      headers: ["SIZE", "SLEEVE LENGTH", "LENGTH", "WIDTH"],
      rows: [
        { SIZE: "S", "SLEEVE LENGTH": "58", LENGTH: "68", WIDTH: "53" },
        { SIZE: "M", "SLEEVE LENGTH": "59", LENGTH: "70", WIDTH: "55" },
        { SIZE: "L", "SLEEVE LENGTH": "60", LENGTH: "72", WIDTH: "56" },
        { SIZE: "XL", "SLEEVE LENGTH": "62", LENGTH: "74", WIDTH: "58" },
        { SIZE: "XXL", "SLEEVE LENGTH": "63", LENGTH: "76", WIDTH: "60" },
        { SIZE: "XXXL", "SLEEVE LENGTH": "65", LENGTH: "80", WIDTH: "63" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "165K", materials: "TASLAN, PARASUT, MAYER, KANVAS (REQUEST)" },
      { quantity: "24-64", price: "155K", materials: "TASLAN, PARASUT, MAYER, KANVAS (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "TASLAN, PARASUT, MAYER, KANVAS (REQUEST)" }
    ]
  },
  {
    name: "CELANA",
    icon: Move,
    description: "Tampilkan kesan profesional dengan celana formal berkualitas tinggi dari kami! Dibuat dari bahan premium yang nyaman, celana ini cocok untuk seragam kerja, formal, atau kebutuhan organisasi. Dengan potongan rapi dan desain yang bisa disesuaikan, celana ini memberikan tampilan elegan tanpa mengorbankan kenyamanan. Pesan sekarang untuk tampilan yang lebih berkelas!",
    options: [],
    sizeChart: {
      headers: ["SIZE", "LENGTH", "PING GANG", "PINGGUL", "CRESH KILL", "PAHA", "LUTUT", "LINGKAR KAKI"],
      rows: [
        { SIZE: "S", LENGTH: "97cm", "PING GANG": "72cm", PINGGUL: "92cm", "CRESH KILL": "64cm", PAHA: "28cm", LUTUT: "22cm", "LINGKAR KAKI": "18cm" },
        { SIZE: "M", LENGTH: "99cm", "PING GANG": "78cm", PINGGUL: "98cm", "CRESH KILL": "66cm", PAHA: "30cm", LUTUT: "24cm", "LINGKAR KAKI": "18cm" },
        { SIZE: "L", LENGTH: "101cm", "PING GANG": "90cm", PINGGUL: "104cm", "CRESH KILL": "68cm", PAHA: "32cm", LUTUT: "25cm", "LINGKAR KAKI": "19cm" },
        { SIZE: "XL", LENGTH: "103cm", "PING GANG": "94cm", PINGGUL: "108cm", "CRESH KILL": "70cm", PAHA: "34cm", LUTUT: "26cm", "LINGKAR KAKI": "20cm" },
        { SIZE: "XXL", LENGTH: "104cm", "PING GANG": "96cm", PINGGUL: "112cm", "CRESH KILL": "72cm", PAHA: "36cm", LUTUT: "27cm", "LINGKAR KAKI": "20cm" },
        { SIZE: "XXXL", LENGTH: "104cm", "PING GANG": "104cm", PINGGUL: "118cm", "CRESH KILL": "74cm", PAHA: "38cm", LUTUT: "28cm", "LINGKAR KAKI": "21cm" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "100K", materials: "AMERICAN, NAGATA, RIPSTOP, COTTON TWILL, (REQUEST)" },
      { quantity: "24-64", price: "95K", materials: "AMERICAN, NAGATA, RIPSTOP, COTTON TWILL, (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "AMERICAN, NAGATA, RIPSTOP, COTTON TWILL, (REQUEST)" }
    ]
  },
  {
    name: "VARSITY",
    icon: Award,
    description: "Jangan biarkan gaya biasa-biasa saja, upgrade tampilanmu dengan varsity jacket custom yang berkualitas! Kombinasi bahan premium dan desain klasik menjadikan varsity ini pilihan sempurna untuk komunitas, sekolah, atau brand fashion. Bisa dipersonalisasi dengan bordir logo atau desain khas yang membuat jaket ini semakin eksklusif.",
    options: ["+5K OVERSIZE", "MENYESUAIKAN KULIT SINTETIS (OSCAR)", "MENYESUAIKAN BORDIR", "MENYESUAIKAN FURING"],
    sizeChart: {
      headers: ["SIZE", "SLEEVE LENGTH", "LENGTH", "WIDTH"],
      rows: [
        { SIZE: "S", "SLEEVE LENGTH": "63cm", LENGTH: "63.5cm", WIDTH: "56.5cm" },
        { SIZE: "M", "SLEEVE LENGTH": "64cm", LENGTH: "66cm", WIDTH: "59cm" },
        { SIZE: "L", "SLEEVE LENGTH": "64cm", LENGTH: "68.5cm", WIDTH: "61.5cm" },
        { SIZE: "XL", "SLEEVE LENGTH": "66cm", LENGTH: "71cm", WIDTH: "64cm" },
        { SIZE: "XXL", "SLEEVE LENGTH": "67cm", LENGTH: "73.5cm", WIDTH: "66.5cm" }
      ]
    },
    pricing: [
      { quantity: "12-23", price: "165K", materials: "FLEECE, BABY TERRY, OSCAR, LOTTO (REQUEST)" },
      { quantity: "24-64", price: "160K", materials: "FLEECE, BABY TERRY, OSCAR, LOTTO (REQUEST)" },
      { quantity: ">65", price: "NEGOTIABLE", materials: "FLEECE, BABY TERRY, OSCAR, LOTTO (REQUEST)" }
    ],
    include: "2 TITIK BORDIR"
  }
];

const ProductCard = ({ product }: { product: Product }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = product.icon;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center p-3 md:p-4 rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-105 w-full h-[60px] md:h-[70px] group"
        style={{ backgroundColor: '#d4ff00' }}
      >
        <h3 className="text-xs md:text-sm lg:text-base font-bold text-black text-center px-2">{product.name}</h3>
        <div className="absolute top-1 right-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-black" />
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              {product.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {product.options.length > 0 && (
              <div>
                <h4 className="text-primary mb-3">Opsi Tambahan:</h4>
                <div className="flex flex-wrap gap-3">
                  {product.options.map((option, idx) => (
                    <span key={idx} className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg text-sm flex items-center gap-2 hover:bg-primary/20 transition-colors">
                      <Plus className="w-4 h-4" />
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-primary mb-3">Tabel Ukuran:</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-accent">
                      {product.sizeChart.headers.map((header, idx) => (
                        <th key={idx} className="px-3 py-2 text-foreground border border-foreground/20">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.sizeChart.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-secondary/30">
                        {Object.values(row).map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-3 py-2 text-center border border-border">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-primary mb-3">Harga:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {product.pricing.map((price, idx) => (
                  <div key={idx} className="border-2 border-accent rounded-xl p-4 text-center">
                    <div className="bg-accent text-foreground text-lg px-4 py-2 rounded-lg mb-3">
                      {price.quantity}
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {price.price}
                    </div>
                    {price.materials && (
                      <div className="text-xs text-muted-foreground">
                        {price.materials}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {product.include && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <span className="text-primary">INCLUDE: </span>
                <span className="text-foreground">{product.include}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Products = () => {
  return (
    <section id="products" className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-2 md:mb-3">
            Daftar Harga
          </h2>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 md:mb-6" style={{ color: '#343CCD' }}>
            Produk Konveksi
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Lihat detail lengkap harga, ukuran, dan spesifikasi produk kami. Klik pada setiap produk untuk melihat informasi selengkapnya.
          </p>
        </div>

        {/* Products Grid - 3 Columns */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {products.map((product, index) => (
            <div
              key={index}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
