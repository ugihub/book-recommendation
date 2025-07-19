// src/data/mockData.js
export const mockBooks = [
  {
    id: 1,
    judul: "Bumi Manusia",
    sinopsis: "Kisah Minke di zaman kolonial, seorang pribumi terpelajar yang berjuang melawan ketidakadilan.",
    cover_url: "https://placehold.co/300x400?text=Bumi+Manusia",
    tahun_terbit: 1980,
    author: { id: 101, nama_author: "Pramoedya Ananta Toer" },
    genres: ["Sejarah", "Fiksi"],
    avg_rating: 4.8,
    comments: [
      { id: 101, user: { name: "Budi" }, text: "Buku ini membuka wawasan!" },
      { id: 102, user: { name: "Ana" }, text: "Karya sastra yang luar biasa." }
    ]
  },
  {
    id: 2,
    judul: "Laskar Pelangi",
    sinopsis: "Kisah inspiratif 10 anak dari keluarga miskin di Belitung yang berjuang untuk pendidikan.",
    cover_url: "https://placehold.co/300x400?text=Laskar+Pelangi",
    tahun_terbit: 2005,
    author: { id: 102, nama_author: "Andrea Hirata" },
    genres: ["Inspiratif", "Fiksi"],
    avg_rating: 4.7,
    comments: [
      { id: 201, user: { name: "Citra" }, text: "Sangat menginspirasi dan mengharukan." }
    ]
  },
  {
    id: 3,
    judul: "Cantik Itu Luka",
    sinopsis: "Kisah epik tentang kutukan dan kecantikan seorang perempuan di masa pra-kemerdekaan.",
    cover_url: "https://placehold.co/300x400?text=Cantik+Itu+Luka",
    tahun_terbit: 2002,
    author: { id: 103, nama_author: "Eka Kurniawan" },
    genres: ["Fiksi", "Magical Realism"],
    avg_rating: 4.6,
    comments: []
  },
  {
    id: 4,
    judul: "Filosofi Teras",
    sinopsis: "Sebuah pengantar filsafat Stoisisme kuno yang relevan untuk mengatasi emosi negatif di zaman modern.",
    cover_url: "https://placehold.co/300x400?text=Filosofi+Teras",
    tahun_terbit: 2018,
    author: { id: 104, nama_author: "Henry Manampiring" },
    genres: ["Pengembangan Diri", "Filsafat"],
    avg_rating: 4.9,
    comments: []
  },
  {
    id: 5,
    judul: "Laut Bercerita",
    sinopsis: "Mengisahkan tentang sekelompok aktivis mahasiswa yang diculik pada masa Orde Baru.",
    cover_url: "https://placehold.co/300x400?text=Laut+Bercerita",
    tahun_terbit: 2017,
    author: { id: 105, nama_author: "Leila S. Chudori" },
    genres: ["Sejarah", "Fiksi"],
    avg_rating: 4.9,
    comments: []
  },
  {
    id: 6,
    judul: "Saman",
    sinopsis: "Novel kontroversial yang mendobrak tabu dan membahas isu-isu sosial politik di Indonesia.",
    cover_url: "https://placehold.co/300x400?text=Saman",
    tahun_terbit: 1998,
    author: { id: 106, nama_author: "Ayu Utami" },
    genres: ["Fiksi", "Sastra"],
    avg_rating: 4.5,
    comments: []
  },
  {
    id: 7,
    judul: "Gadis Kretek",
    sinopsis: "Pencarian jejak seorang perempuan misterius di industri kretek Jawa Tengah pada masa lalu.",
    cover_url: "https://placehold.co/300x400?text=Gadis+Kretek",
    tahun_terbit: 2012,
    author: { id: 107, nama_author: "Ratih Kumala" },
    genres: ["Sejarah", "Fiksi"],
    avg_rating: 4.7,
    comments: []
  },
  {
    id: 8,
    judul: "Pulang",
    sinopsis: "Kisah seorang pemuda yang terpaksa menjadi eksil politik di Paris setelah peristiwa G30S.",
    cover_url: "https://placehold.co/300x400?text=Pulang",
    tahun_terbit: 2013,
    author: { id: 105, nama_author: "Leila S. Chudori" },
    genres: ["Sejarah", "Fiksi"],
    avg_rating: 4.8,
    comments: []
  },
  {
    id: 9,
    judul: "Sebuah Seni untuk Bersikap Bodo Amat",
    sinopsis: "Buku pengembangan diri yang mengajak pembaca untuk fokus pada hal-hal yang benar-benar penting.",
    cover_url: "https://placehold.co/300x400?text=Seni+Bodo+Amat",
    tahun_terbit: 2018,
    author: { id: 108, nama_author: "Mark Manson" },
    genres: ["Pengembangan Diri"],
    avg_rating: 4.6,
    comments: []
  }
];