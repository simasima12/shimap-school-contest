import Link from "next/link";

type Section = "home" | "map" | "properties" | "islands" | "diagnosis" | "data";

export function SiteHeader({ active }: { active: Section }) {
  return <header className="site-header">
    <Link className="brand" href="/" aria-label="島ップのホームへ戻る">島ップ</Link>
    <nav className="main-nav" aria-label="主なナビゲーション">
      <Link className={active === "map" ? "active" : ""} href="/map">地図から探す</Link>
      <Link className={active === "properties" ? "active" : ""} href="/properties">物件を探す</Link>
      <Link className={active === "islands" ? "active" : ""} href="/islands">島を探す</Link>
      <Link className={active === "diagnosis" ? "active" : ""} href="/diagnosis">島暮らし診断</Link>
      <Link className={active === "data" ? "active" : ""} href="/data">データ・出典</Link>
    </nav>
  </header>;
}

export function SiteFooter() {
  return <footer className="site-footer"><p>島ップ — 離島の住まいと島情報を探す</p><Link href="/data">データと出典</Link></footer>;
}
