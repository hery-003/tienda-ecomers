"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="not-found">
      <h1 className="not-found__code">Ups</h1>
      <p>Algo salió mal procesando esta página.</p>
      <button className="btn btn--primary" onClick={() => retry()}>Reintentar</button>
    </main>
  );
}