"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <main id="main-content" className="system-page">
    <p className="eyebrow">Error</p>
    <h1>ページを表示できませんでした</h1>
    <p>一時的な問題の可能性があります。少し時間をおいて、もう一度お試しください。</p>
    <button className="button primary" onClick={reset}>もう一度試す</button>
  </main>;
}
