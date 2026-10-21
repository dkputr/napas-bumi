// Kategori US AQI (EPA). Ini BUKAN ISPU Indonesia.
export function usAqiCategory(v) {
  if (v == null || Number.isNaN(v)) return null;
  if (v <= 50) return 'Baik'; if (v <= 100) return 'Sedang'; if (v <= 150) return 'Tidak sehat bagi kelompok sensitif';
  if (v <= 200) return 'Tidak sehat'; if (v <= 300) return 'Sangat tidak sehat'; return 'Berbahaya';
}
