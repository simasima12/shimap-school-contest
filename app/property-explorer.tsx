"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import islandData from "./islands_top50.json";
import { safePropertyTitle, sanitizeIslandName, sanitizeTransit } from "./property-normalization";
import { TileIslandMap } from "./tile-island-map";
import { SiteFooter, SiteHeader } from "./site-chrome";

export type Property = {
  external_id?: string; title?: string; monthly_rent_yen?: number | null;
  floor_plan?: string; building_area_m2?: number | null; built_text?: string;
  floor?: string | null; management_fee_yen?: number | null;
  address?: string; transit?: string; island_id?: string; island_name?: string;
  source_url?: string; source_urls?: string[]; duplicate_listing_count?: number; last_seen_at?: string | null;
};
export type PropertyPayload = {
  total: number; items: Property[];
  searchStatuses?: SearchStatus[];
  generatedAt?: string | null; notice?: string;
};
export type SearchStatus = {
  islandId?: string; islandName?: string; status?: "completed" | "completed-empty" | "partial" | string;
  count?: number; checkedAt?: string; reasons?: string[];
};
type Island = (typeof islandData.islands)[number];
export type View = "home" | "islands" | "map" | "properties" | "data";

const normalize = (value: unknown) =>
  String(value || "").toLowerCase().normalize("NFKC").replace(/[\s\u3000]+/g, "");
const numberFormat = new Intl.NumberFormat("ja-JP");
const money = (value?: number | null) => value ? `${numberFormat.format(value)}円` : "要確認";
const dateTime = (value?: string | null) => value
  ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(value))
  : "更新待ち";
const propertySortValues = new Set(["default", "rent-asc", "rent-desc", "area-desc"]);

function layoutMatches(value: string | undefined, group: string) {
  if (!group) return true;
  const plan = normalize(value).toUpperCase();
  if (group === "1r-1k") return /^1(?:R|K)(?:\+S)?$/u.test(plan);
  if (group === "1dk-1ldk") return /^1(?:DK|LDK)(?:\+S)?$/u.test(plan);
  if (group === "2dk-2ldk") return /^2(?:DK|LDK)(?:\+S)?$/u.test(plan);
  if (group === "3plus") return Number(plan.match(/^(\d+)/u)?.[1] || 0) >= 3;
  return true;
}

function compareOptionalNumber(a: number | null | undefined, b: number | null | undefined, direction: "asc" | "desc") {
  const aValid = typeof a === "number" && Number.isFinite(a);
  const bValid = typeof b === "number" && Number.isFinite(b);
  if (!aValid && !bValid) return 0;
  if (!aValid) return 1;
  if (!bValid) return -1;
  return direction === "asc" ? a - b : b - a;
}

function propertyStatusLabel(propertyCount: number, status?: SearchStatus) {
  if (status?.status === "partial") return propertyCount ? `${propertyCount}件（取得不完全）` : "取得不完全";
  if (status?.status === "completed-empty") return "0件（確認済み）";
  if (status?.status === "completed") return `${propertyCount}件`;
  return propertyCount ? `${propertyCount}件` : "物件一覧で確認";
}

function IslandCard({ island, propertyCount, searchStatus }: { island: Island; propertyCount: number; searchStatus?: SearchStatus }) {
  return <article className="island-card">
    <div className="card-heading"><div>
      <p className="eyebrow">{island.rank}位 / {island.prefecture} / {island.area}</p>
      <h3>{island.name}</h3><p className="kana">{island.kana}</p>
    </div><strong>{numberFormat.format(island.population.value)}人</strong></div>
    <dl className="card-meta">
      <div><dt>基準年</dt><dd>{island.population.year}年</dd></div>
      <div><dt>賃貸物件</dt><dd className={searchStatus?.status === "partial" ? "status-warning" : ""}>{propertyStatusLabel(propertyCount, searchStatus)}</dd></div>
    </dl>
    <p>{island.description}</p>
    <p className="spot-line">● {island.famousSpot.name}</p>
    <div className="tag-cloud compact">{island.tags.slice(0, 5).map((item) => <span className="tag-badge" key={item}>{item}</span>)}</div>
    <div className="card-actions"><Link className="button primary" href={`/islands/${island.id}`}>詳細を見る</Link>
      <a className="button ghost" href={island.routeUrl} target="_blank" rel="noreferrer">Google Mapsで経路を見る</a></div>
  </article>;
}

export function PropertyExplorer({ payload, initialIslandId, initialPropertyQuery = "", initialView = "home" }: { payload: PropertyPayload; initialIslandId?: string; initialPropertyQuery?: string; initialView?: View }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const islands = islandData.islands;
  const validInitialIslandId = initialIslandId && islands.some((island) => island.id === initialIslandId) ? initialIslandId : undefined;
  const view: View = validInitialIslandId ? "properties" : initialView;
  const [keyword, setKeyword] = useState(""); const [prefecture, setPrefecture] = useState("");
  const [area, setArea] = useState(""); const [tag, setTag] = useState("");
  const [campTag, setCampTag] = useState(""); const [sort, setSort] = useState("rank");
  const [propertyQuery, setPropertyQuery] = useState(initialPropertyQuery); const [propertyIsland, setPropertyIsland] = useState(validInitialIslandId || "all");
  const [maxRent, setMaxRent] = useState("all");
  const [propertyLayout, setPropertyLayout] = useState("");
  const [minimumArea, setMinimumArea] = useState("all");
  const [propertyLimit, setPropertyLimit] = useState(30);
  const initialPropertySort = searchParams.get("sort") || "default";
  const [propertySort, setPropertySort] = useState(propertySortValues.has(initialPropertySort) ? initialPropertySort : "default");

  const changePropertySort = (value: string) => {
    setPropertySort(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "default") params.delete("sort"); else params.set("sort", value);
    router.replace(params.size ? `?${params.toString()}` : "/properties", { scroll: false });
  };

  const propertyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    payload.items.forEach((item) => { if (item.island_id) counts.set(item.island_id, (counts.get(item.island_id) || 0) + 1); });
    return counts;
  }, [payload.items]);
  const searchStatuses = useMemo(() => new Map(
    (payload.searchStatuses || []).filter((item) => item.islandId).map((item) => [item.islandId as string, item])
  ), [payload.searchStatuses]);
  const islandResults = useMemo(() => {
    const needle = normalize(keyword);
    return islands.filter((island) => {
      if (prefecture && island.prefecture !== prefecture) return false;
      if (area && island.area !== area) return false;
      if (tag && !island.tags.includes(tag)) return false;
      if (campTag && !island.campTags.includes(campTag)) return false;
      if (!needle) return true;
      return [island.name, island.kana, island.prefecture, island.area, island.description,
        island.famousSpot.name, island.famousSpot.type, ...island.aliases, ...island.tags,
        ...island.campTags, ...island.access.map((item) => item.summary)].map(normalize).join("|").includes(needle);
    }).sort((a, b) => sort === "population-asc" ? a.population.value - b.population.value
      : sort === "population-desc" ? b.population.value - a.population.value
      : sort === "name" ? a.name.localeCompare(b.name, "ja") : a.rank - b.rank);
  }, [islands, keyword, prefecture, area, tag, campTag, sort]);
  const properties = useMemo(() => {
    const needle = normalize(propertyQuery); const ceiling = maxRent === "all" ? Infinity : Number(maxRent);
    const areaFloor = minimumArea === "all" ? 0 : Number(minimumArea);
    const filtered = payload.items.filter((item) => (!needle || normalize([item.title, item.island_name, item.address, item.floor_plan, item.floor, item.transit].join(" ")).includes(needle))
      && (propertyIsland === "all" || item.island_id === propertyIsland)
      && (!item.monthly_rent_yen || item.monthly_rent_yen <= ceiling)
      && layoutMatches(item.floor_plan, propertyLayout)
      && (!areaFloor || (typeof item.building_area_m2 === "number" && item.building_area_m2 >= areaFloor)));
    return filtered.map((item, index) => ({ item, index })).sort((a, b) => {
      if (propertySort === "rent-asc") return compareOptionalNumber(a.item.monthly_rent_yen, b.item.monthly_rent_yen, "asc") || a.index - b.index;
      if (propertySort === "rent-desc") return compareOptionalNumber(a.item.monthly_rent_yen, b.item.monthly_rent_yen, "desc") || a.index - b.index;
      if (propertySort === "area-desc") return compareOptionalNumber(a.item.building_area_m2, b.item.building_area_m2, "desc") || a.index - b.index;
      return a.index - b.index;
    }).map(({ item }) => item);
  }, [payload.items, propertyQuery, propertyIsland, maxRent, propertyLayout, minimumArea, propertySort]);
  const visibleProperties = properties.slice(0, propertyLimit);
  const resetPropertyFilters = () => { setPropertyQuery(""); setPropertyIsland("all"); setMaxRent("all"); setPropertyLayout(""); setMinimumArea("all"); setPropertySort("default"); setPropertyLimit(30); };

  const prefectures = [...new Set(islands.map((item) => item.prefecture))].sort((a, b) => a.localeCompare(b, "ja"));
  const areas = [...new Set(islands.map((item) => item.area))].sort((a, b) => a.localeCompare(b, "ja"));
  const tags = [...new Set(islands.flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b, "ja"));
  const campTags = [...new Set(islands.flatMap((item) => item.campTags))].sort((a, b) => a.localeCompare(b, "ja"));
  const propertyIslands = islands
    .map((island) => ({ id: island.id, name: island.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
  return <div className="app-shell">
    <SiteHeader active={view} />
    <main id="main-content">
      {view === "home" && <>
        <section className="hero home-search-hero"><div className="hero-inner"><p className="eyebrow">離島の賃貸・島情報</p><h1 className="home-hero-title"><span>島の賃貸を、</span><span>地図から探す</span></h1>
          <p>離島の物件、場所、アクセス、島の特徴をまとめて確認できます。</p>
          <form className="home-search" onSubmit={(event) => { event.preventDefault(); router.push(`/properties?query=${encodeURIComponent(propertyQuery)}`); }}><label><span>物件を検索</span><input value={propertyQuery} onChange={(event) => setPropertyQuery(event.target.value)} placeholder="島名・住所・間取りで検索" /></label><button className="button primary" type="submit">物件を探す</button></form>
          <div className="hero-actions"><Link className="text-action" href="/map">地図から島を探す</Link><Link className="text-action" href="/islands">島の一覧を見る</Link><Link className="text-action" href="/diagnosis">島暮らし診断をする</Link></div></div></section>
        <section className="section"><div className="section-heading"><div><p className="eyebrow">Top 50</p><h2>人口上位の島</h2></div>
          <Link className="text-link" href="/islands">すべて見る</Link></div>
          <div className="card-grid">{islands.slice(0, 3).map((item) => <IslandCard key={item.id} island={item} propertyCount={propertyCounts.get(item.id) || 0} searchStatus={searchStatuses.get(item.id)} />)}</div></section>
        <section className="feature-band"><div><p className="eyebrow">使い方</p><h2>島を選び、物件と暮らしの情報を比べる</h2>
          <p>地図、島一覧、物件検索から目的に合う島を探せます。掲載情報の出典と更新時点はデータページで確認できます。</p></div></section>
      </>}

      {view === "islands" && <section className="page">
        <div className="page-heading"><div><p className="eyebrow">Island list</p><h1>島一覧</h1></div><p>{islandResults.length}件の島が見つかりました。</p></div>
        <section className="filter-panel" aria-label="検索条件">
          <label className="search-bar"><span aria-hidden="true">⌕</span><input aria-label="島をキーワードで検索" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="島名・読み・別名・都道府県・タグ・アクセス方法で検索" /></label>
          <div className="select-grid">
            <label>都道府県<select value={prefecture} onChange={(e) => setPrefecture(e.target.value)}><option value="">すべて</option>{prefectures.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>地域<select value={area} onChange={(e) => setArea(e.target.value)}><option value="">すべて</option>{areas.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>並び替え<select value={sort} onChange={(e) => setSort(e.target.value)}><option value="rank">順位順</option><option value="population-desc">人口が多い順</option><option value="population-asc">人口が少ない順</option><option value="name">名前順</option></select></label>
          </div>
          <details className="filter-group" open={Boolean(tag)}><summary>特徴から探す{tag ? `：${tag}` : ""}</summary>
            <div className="tag-cloud"><button className={`tag-badge ${!tag ? "active" : ""}`} aria-pressed={!tag} onClick={() => setTag("")}>すべて</button>{tags.map((item) => <button className={`tag-badge ${tag === item ? "active" : ""}`} aria-pressed={tag === item} key={item} onClick={() => setTag(tag === item ? "" : item)}>{item}</button>)}</div>
          </details>
          <details className="filter-group" open={Boolean(campTag)}><summary>合宿用途から探す{campTag ? `：${campTag}` : ""}</summary>
            <div className="tag-cloud"><button className={`tag-badge camp ${!campTag ? "active" : ""}`} aria-pressed={!campTag} onClick={() => setCampTag("")}>合宿すべて</button>{campTags.map((item) => <button className={`tag-badge camp ${campTag === item ? "active" : ""}`} aria-pressed={campTag === item} key={item} onClick={() => setCampTag(campTag === item ? "" : item)}>{item}</button>)}</div>
          </details>
        </section>
        <div className="card-grid">{islandResults.map((item) => <Fragment key={item.id}>
          <IslandCard island={item} propertyCount={propertyCounts.get(item.id) || 0} searchStatus={searchStatuses.get(item.id)} />
        </Fragment>)}</div>
      </section>}

      {view === "map" && <section className="page">
        <div className="page-heading"><div><p className="eyebrow">Island map</p><h1>地図から探す</h1></div><p>マーカーの数字は人口順位です。島を選ぶと人口・アクセス・物件情報を確認できます。</p></div>
        <TileIslandMap islands={islands} propertyCounts={propertyCounts} searchStatuses={searchStatuses} onSelect={(island) => router.push(`/islands/${island.id}`)} />
      </section>}

      {view === "properties" && <section className="page">
        <div className="page-heading"><div><p className="eyebrow">Property search</p><h1>移住向け物件検索</h1></div><p>最終更新：{dateTime(payload.generatedAt)}</p></div>
        <section className="filter-panel"><label className="search-bar"><span aria-hidden="true">⌕</span><input aria-label="物件をキーワードで検索" value={propertyQuery} onChange={(e) => setPropertyQuery(e.target.value)} placeholder="島名・住所・間取り・交通で検索" /></label>
          <div className="select-grid property-selects"><label>島<select value={propertyIsland} onChange={(e) => setPropertyIsland(e.target.value)}><option value="all">すべての島</option>{propertyIslands.map((item) => <option key={item.id} value={item.id}>{item.name}（{propertyStatusLabel(propertyCounts.get(item.id) || 0, searchStatuses.get(item.id))}）</option>)}</select></label>
            <label>家賃上限<select value={maxRent} onChange={(e) => setMaxRent(e.target.value)}><option value="all">指定なし</option><option value="50000">5万円</option><option value="70000">7万円</option><option value="100000">10万円</option><option value="150000">15万円</option></select></label>
            <label>間取り<select value={propertyLayout} onChange={(e) => setPropertyLayout(e.target.value)}><option value="">指定なし</option><option value="1r-1k">1R / 1K</option><option value="1dk-1ldk">1DK / 1LDK</option><option value="2dk-2ldk">2DK / 2LDK</option><option value="3plus">3DK / 3LDK以上</option></select></label>
            <label>面積<select value={minimumArea} onChange={(e) => setMinimumArea(e.target.value)}><option value="all">指定なし</option><option value="20">20㎡以上</option><option value="30">30㎡以上</option><option value="50">50㎡以上</option><option value="70">70㎡以上</option></select></label>
            <label>並び替え<select value={propertySort} onChange={(e) => changePropertySort(e.target.value)}><option value="default">掲載順</option><option value="rent-asc">家賃が安い順</option><option value="rent-desc">家賃が高い順</option><option value="area-desc">面積が広い順</option></select></label>
          </div></section>
        {propertyIsland !== "all" && searchStatuses.get(propertyIsland)?.status === "partial" && <p className="data-status warning" role="status">この島は前回の取得が完了していません。表示件数は一部のみ、または未取得の可能性があります。</p>}
        {propertyIsland !== "all" && searchStatuses.get(propertyIsland)?.status === "completed-empty" && <p className="data-status empty" role="status">前回の取得では、住所まで確認できる掲載物件は0件でした。</p>}
        <div className="result-summary" aria-live="polite"><span>掲載物件データ（重複統合後）</span><strong>{properties.length}件</strong></div>
        {properties.length === 0 ? <div className="data-status empty"><p>条件に一致する物件はありません。</p><button className="button ghost" onClick={resetPropertyFilters}>条件を解除する</button></div> : <><div className="property-grid">{visibleProperties.map((item, index) => {
          const officialIslandName = islands.find((island) => island.id === item.island_id)?.name || sanitizeIslandName(item.island_name) || "島名確認中";
          const validTransit = sanitizeTransit(item.transit);
          return <Fragment key={item.external_id || index}>
          <article className="property-card">
          <div className="card-topline"><span className="island-pill">{officialIslandName}</span>{item.duplicate_listing_count && item.duplicate_listing_count > 1 ? <span className="duplicate">{item.duplicate_listing_count}件の掲載情報を統合</span> : null}</div>
          <h3>{safePropertyTitle(item.title, officialIslandName)}</h3><p className="address">{item.address || "住所は掲載元で確認"}</p>
          {item.floor && !["-", "—"].includes(item.floor.trim()) && <p className="room-position">所在階：{item.floor}</p>}
          <div className="rent"><strong>{money(item.monthly_rent_yen)}</strong><span>/ 月</span></div>
          <dl><div><dt>間取り</dt><dd>{item.floor_plan || "—"}</dd></div><div><dt>面積</dt><dd>{item.building_area_m2 ? `${item.building_area_m2}㎡` : "—"}</dd></div><div><dt>築年</dt><dd>{item.built_text || "—"}</dd></div></dl>
          {validTransit && <p className="transit">{validTransit}</p>}<p className="property-checked">掲載情報の確認日：{dateTime(item.last_seen_at || payload.generatedAt)}</p>{item.source_url && <a className="source-link" href={item.source_url} target="_blank" rel="noreferrer">掲載元で最新情報を確認</a>}<Link className="property-data-link" href="/data#property-source">物件データ・出典について</Link>
          </article>
        </Fragment>;})}</div>{properties.length > visibleProperties.length && <div className="load-more"><button className="button ghost" onClick={() => setPropertyLimit((limit) => limit + 30)}>さらに30件表示</button><span>{visibleProperties.length} / {properties.length}件を表示</span></div>}</>}
      </section>}

      {view === "data" && <section className="page text-page">
        <div className="page-heading"><div><p className="eyebrow">About data</p><h1>データについて</h1></div></div>
        <section><h2>島ップについて</h2><p>島ップは、日本の有人離島を人口、地域、特徴、地図、賃貸物件情報から探せるWebアプリです。島を知るきっかけづくりと、観光・地域学習・移住先探しの参考情報を提供します。</p></section>
        <section id="island-source"><h2>島データと出典</h2><p>本州・北海道・四国・九州・沖縄島を除く有人島を対象に、2020年人口の多い順で50島を収録しています。人口は、2020年国勢調査などを基に整理された公開資料を参考にしています。座標は地図表示用の概算中心点です。アクセス方法や見どころは複数の公開情報を基に要約した参考情報です。運航状況、営業時間、利用条件などは公式情報をご確認ください。</p>
          <ul className="source-list">
            <li><a href="https://www.stat.go.jp/data/kokusei/2020/kekka.html" target="_blank" rel="noreferrer">総務省統計局「令和2年国勢調査」</a></li>
            <li><a href="https://uub.jp/prf/island1.html" target="_blank" rel="noreferrer">日本の有人島一覧（2020年人口順）</a></li>
            <li><a href="https://www.mlit.go.jp/kokudoseisaku/chirit/content/001477518.pdf" target="_blank" rel="noreferrer">国土交通省「日本の島嶼の構成」</a></li>
          </ul></section>
        <section id="property-source"><h2>賃貸物件データ</h2><p>保存済みデータを表示しています。自動取得やバックグラウンド更新は行いません。現在{payload.items.length}件です。表示件数は、収録時点に指定条件で確認できた保存データの件数であり、地域内のすべての募集物件数を示すものではありません。</p><p>画像・説明文・電話番号は保存していません。地図ページでは表示時に国土地理院の地理院タイルを読み込み、島の概算中心座標にマーカーを表示します。</p>
          <ul className="source-list"><li><a href="https://suumo.jp/chintai/" target="_blank" rel="noreferrer">SUUMO 賃貸住宅情報</a></li><li><a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院 地理院タイル一覧</a></li></ul></section>
        <section><h2>更新について</h2><p>表示内容は収録データの取得時点に基づきます。物件の掲載終了、新着、価格変更などは自動反映されません。表示される更新時刻はデータの確認時刻であり、現在の空室を保証するものではありません。</p></section>
        <section><h2>利用上の注意・免責事項</h2><p>本サイトは、島や住まいに関する参考情報を提供しています。掲載情報の完全性、正確性、最新性は保証されません。物件の募集状況、価格、契約条件、交通情報、施設情報などは変更される場合があります。重要な判断を行う際は、掲載元、不動産会社、自治体、交通事業者などの公式情報をご確認ください。</p><p>本サイトの情報を利用した判断と行動は、利用者自身の責任で行ってください。本サイトの利用または掲載情報に関連して生じた損害について、運営者は、法令上免責が認められない場合を除き、責任を負いません。</p><p>外部リンク先の情報とサービスは各サイトの運営者が提供しています。SUUMOは株式会社リクルートのサービスです。物件の最新情報はSUUMOの掲載ページで確認してください。</p></section>
      </section>}
    </main>
    <SiteFooter />
  </div>;
}
