/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Włączenie kompresji Gzip / Brotli dla zasobów statycznych
  compress: true,
  // Usunięcie nagłówka x-powered-by (bezpieczeństwo + minimalizacja bajtów)
  poweredByHeader: false,
  // Usunięcie wywołań console.log z produkcyjnego buildu JS
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Kluczowa optymalizacja drzewa pakietów (usuwa nieużywane ikony lucide-react z głównego chunka)
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
