import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import ProductBuy from "@/components/ProductBuy";
import { getProducts, getConfig } from "@/lib/store";
import { productImg } from "@/lib/productImage";

export default async function ProductPage(props: PageProps<"/producto/[id]">) {
  const { id } = await props.params;
  const numId = Number(id);
  const [products, config] = await Promise.all([getProducts(), getConfig()]);
  const product = products.find((p) => p.id === numId);
  if (!product) notFound();

  const soldOut = product.badge === "agotado" || (product.stock ?? Infinity) <= 0;
  const lowStock = !soldOut && (product.stock ?? Infinity) <= 5;

  return (
    <div className="product-page container">
      <a href="/" className="product-back">← Volver a la tienda</a>
      <div className="product-detail">
        <div className="product-detail__media">
          <img src={productImg(product)} alt={product.name} />
        </div>
        <div className="product-detail__body">
          <span className="product-detail__category">{product.category}</span>
          <span className="product-detail__brand">{product.brand}</span>
          <h1>{product.name}</h1>
          <div className="product-detail__price-row">
            <span className="product-detail__price">{config.currency} {product.price.toFixed(2)}</span>
            {product.oldPrice ? <span className="product-detail__old">{config.currency} {product.oldPrice.toFixed(2)}</span> : null}
          </div>
          <p className="product-detail__desc">{product.desc}</p>
          {soldOut ? (
            <span className="product-detail__stock product-detail__stock--out">Agotado</span>
          ) : lowStock ? (
            <span className="product-detail__stock product-detail__stock--low">¡Solo quedan {product.stock} unidades!</span>
          ) : (
            <span className="product-detail__stock product-detail__stock--ok">Disponible</span>
          )}
          <ProductBuy product={product} config={config} />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata(props: PageProps<"/producto/[id]">): Promise<Metadata> {
  await connection();
  const { id } = await props.params;
  const numId = Number(id);
  const products = await getProducts();
  const product = products.find((p) => p.id === numId);
  if (!product) return {};
  return {
    title: `${product.name} | ${product.brand}`,
    description: product.desc,
    openGraph: {
      title: `${product.name} | ${product.brand}`,
      description: product.desc,
      images: product.image ? [product.image] : undefined,
      type: "website"
    }
  };
}
