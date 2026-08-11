import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiTienda | Streetwear Premium",
  description: "Streetwear premium. Cada pieza es una declaración de estilo y resistencia.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
