import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <h1 className="not-found__code">404</h1>
      <p>No encontramos lo que buscás.</p>
      <Link href="/" className="btn btn--primary">Volver a la tienda</Link>
    </main>
  );
}