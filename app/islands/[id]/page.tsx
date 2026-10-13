import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import islandData from "../../islands_top50.json";
import { siteDescription, siteTitle } from "../../site-config";
import { loadPayload } from "../../load-payload";
import { SiteFooter, SiteHeader } from "../../site-chrome";
import { islandSpecialties } from "../../island-specialties";

type Island = (typeof islandData.islands)[number];
export const dynamic = "force-dynamic";

const dateTime = (value?: string | null) => value
  ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(value))
  : "更新待ち";

function findIsland(id: string): Island | undefined {
  return islandData.islands.find((island) => island.id === id);
}

export function generateStaticParams() {
  return islandData.islands.map((island) => ({ id: island.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const island = findIsland(id);
  if (!island) return { title: siteTitle, description: siteDescription };
  const title = `${island.name}｜人口・アクセス・賃貸物件情報`;
  const description = `${island.prefecture}の${island.name}について、人口、アクセス、有名スポット、賃貸物件情報を掲載しています。${island.description}`;
  return {
    title,
    description,
    alternates: { canonical: `/islands/${island.id}` },
    openGraph: { type: "article", locale: "ja_JP", url: `/islands/${island.id}`, siteName: "島ップ", title, description, images: [{ url: "/og-image.jpg", width: 1600, height: 840, alt: "海と集落のある日本の島の風景" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.jpg"] },
  };
}

export default async function IslandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const island = findIsland(id);
  if (!island) notFound();
  const islandIndex = islandData.islands.findIndex((item) => item.id === island.id);
  const previousIsland = islandData.islands[islandIndex - 1];
  const nextIsland = islandData.islands[islandIndex + 1];
  const payload = await loadPayload();
  const properties = payload.items.filter((item) => item.island_id === island.id);
  const status = payload.searchStatuses?.find((item) => item.islandId === island.id);
  const statusText = status?.status === "partial"
    ? properties.length ? `${properties.length}件（取得不完全）` : "取得不完全"
    : status?.status === "completed-empty" ? "0件（確認済み）"
      : status?.status === "completed" ? `${properties.length}件` : "物件一覧で確認";
  const specialties = islandSpecialties[island.id] || [];

  return <div className="app-shell">
    <SiteHeader active="islands" />
    <main id="main-content" className="page detail-page island-route-page">
      <Link className="back-link" href="/islands">← 島一覧へ戻る</Link>
      <div className="detail-hero"><div><p className="eyebrow">{island.rank}位 / {island.prefecture} / {island.area}</p><h1>{island.name}</h1>
        <p className="kana">{island.kana}</p><p>{island.description}</p></div>
        <dl className="stats-panel"><div><dt>人口</dt><dd>{island.population.value.toLocaleString("ja-JP")}人</dd></div>
          <div><dt>基準年</dt><dd>{island.population.year}年</dd></div><div><dt>現在の掲載データ</dt><dd>{statusText}</dd></div></dl></div>
      {status?.status === "partial" && <p className="data-status warning">前回の物件取得は完了していません。表示件数は一部のみ、または未取得の可能性があります。</p>}
      <div className="detail-grid"><section><h2>アクセス</h2>{island.access.map((item, index) => <p key={index}>{item.summary}</p>)}</section>
        <section><h2>有名スポット</h2><h3>{island.famousSpot.name}</h3><p>{island.famousSpot.summary}</p></section>
        {specialties.length > 0 && <section><h2>特産品・名物</h2><ul className="specialty-list">{specialties.map((item) => <li key={item.name}>{item.name}<a href={item.sourceUrl} target="_blank" rel="noreferrer">出典：{item.sourceName}</a></li>)}</ul></section>}</div>
      <p className="data-status">アクセス方法や施設情報は変更される場合があります。利用前に自治体・交通事業者・施設の公式情報をご確認ください。<Link href="/data#island-source">島データ・出典を見る</Link></p>
      <section className="island-property-summary"><h2>{island.name}の賃貸物件</h2><p>最終取得：{dateTime(status?.checkedAt || payload.generatedAt)}</p>
        <div className="hero-actions"><a className="button primary" href={`/properties?island=${island.id}`}>物件検索で確認する</a>
          <a className="button ghost" href={island.routeUrl} target="_blank" rel="noreferrer">Google Mapsで経路を見る</a></div></section>
      <div className="tag-cloud">{island.tags.map((item) => <span className="tag-badge" key={item}>{item}</span>)}</div>
      <nav className="island-pagination" aria-label="前後の島">
        {previousIsland ? <Link href={`/islands/${previousIsland.id}`}>← {previousIsland.rank}位 {previousIsland.name}</Link> : <span />}
        {nextIsland ? <Link href={`/islands/${nextIsland.id}`}>{nextIsland.rank}位 {nextIsland.name} →</Link> : null}
      </nav>
    </main>
    <SiteFooter />
  </div>;
}
