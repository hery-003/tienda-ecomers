import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Storefront from "@/components/Storefront";
import { getProducts, getConfig, getCoupons } from "@/lib/store";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <StorefrontLoader />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const config = await getConfig();
  return {
    title: `${config.brand} | Streetwear Premium`,
    description: "Streetwear premium. Cada pieza es una declaración de estilo y resistencia.",
    openGraph: {
      title: `${config.brand} | Streetwear Premium`,
      description: "Streetwear premium. Cada pieza es una declaración de estilo y resistencia.",
      type: "website"
    }
  };
}

async function StorefrontLoader() {
  const [products, config, coupons] = await Promise.all([getProducts(), getConfig(), getCoupons()]);
  return <Storefront products={products} config={config} coupons={coupons} />;
}

function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b0d",
        color: "#9b9ba1",
        fontFamily: "Segoe UI, system-ui, sans-serif"
      }}
    >
      <div className="preloader" id="preloader" style={{ position: "static", opacity: 1, visibility: "visible" }}>
        <div className="preloader__ring"></div>
      </div>
    </div>
  );
}
