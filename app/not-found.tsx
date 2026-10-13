import Link from "next/link";

export default function NotFound() {
  return <main id="main-content" className="system-page">
    <p className="eyebrow">404</p>
    <h1>ページが見つかりません</h1>
    <p>URLが変更されたか、入力したURLに誤りがある可能性があります。</p>
    <div className="hero-actions">
      <Link className="button primary" href="/">トップへ戻る</Link>
      <Link className="button ghost" href="/islands">島一覧を見る</Link>
    </div>
  </main>;
}
