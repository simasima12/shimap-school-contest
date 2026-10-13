"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteFooter, SiteHeader } from "../site-chrome";

type Island = { id: string; name: string; prefecture: string; area: string; description: string; tags: string[]; campTags: string[]; access: { summary: string }[]; famousSpot: { name: string; summary: string }; routeUrl: string };
const questions = [
  ["pace", "どんな毎日を送りたい？", [["静かな自然", "nature"], ["便利さも欲しい", "convenience"], ["地域との交流", "community"]]],
  ["move", "島への行きやすさは？", [["できるだけ行きやすく", "access"], ["少し時間がかかっても平気", "remote"]]],
  ["weather", "気候で大切なのは？", [["温暖さ", "warm"], ["四季や涼しさ", "cool"], ["まずは自分で調べたい", "research"]]],
  ["life", "島で楽しみたいことは？", [["海・自然", "sea"], ["食・まち歩き", "town"], ["仕事や二地域居住", "work"]]],
  ["home", "住まい探しは？", [["まず物件を見たい", "property"], ["旅から考えたい", "travel"]]],
  ["islandType", "移動手段の希望は？", [["橋で渡れる島も含めたい", "bridge"], ["船や飛行機の島を選びたい", "ferry"], ["特に決めていない", "any"]]],
  ["region", "気になる地域は？", [["北海道・北陸", "north"], ["瀬戸内・中国・近畿", "west"], ["九州・奄美・沖縄", "south"], ["伊豆諸島", "izu"], ["全国から探す", "all"]]],
  ["interest", "島で見たいものは？", [["自然や海", "nature"], ["歴史や文化", "culture"], ["体験・アート", "activity"]]],
] as const;

function score(island: Island, answers: Record<string, string>, count: number) {
  const text = `${island.description} ${island.tags.join(" ")} ${island.campTags.join(" ")} ${island.access.map((item) => item.summary).join(" ")}`;
  let value = Math.min(count, 10) / 10;
  if (answers.pace === "nature" && /自然|海|温暖|離島/.test(text)) value += 3;
  if (answers.pace === "convenience" && /アクセス|橋|都市|交通/.test(text)) value += 3;
  if (answers.pace === "community" && /文化|まち|歴史|産業/.test(text)) value += 3;
  if (answers.move === "access" && /橋|アクセス|空港|フェリー/.test(text)) value += 2;
  if (answers.move === "remote" && /離島|自然|静か/.test(text)) value += 2;
  if (answers.weather === "warm" && /温暖|南国|海/.test(text)) value += 2;
  if (answers.weather === "cool" && /北海道|北陸|四季/.test(text)) value += 2;
  if (answers.life === "sea" && /海|自然|ビーチ|マリン/.test(text)) value += 3;
  if (answers.life === "town" && /食|文化|歴史|まち/.test(text)) value += 3;
  if (answers.life === "work" && count > 0) value += 2;
  if (answers.home === "property" && count > 0) value += 3;
  if (answers.islandType === "bridge" && island.tags.includes("架橋島")) value += 4;
  if (answers.islandType === "ferry" && !island.tags.includes("架橋島")) value += 2;
  if (answers.interest === "nature" && island.tags.includes("自然")) value += 4;
  if (answers.interest === "culture" && island.tags.includes("歴史文化")) value += 4;
  if (answers.interest === "activity" && (island.tags.includes("体験活動") || island.tags.includes("アート"))) value += 4;
  return value;
}

export function IslandLivingDiagnosis({ islands, propertyCounts }: { islands: Island[]; propertyCounts: Record<string, number> }) {
  const [step, setStep] = useState(0); const [answers, setAnswers] = useState<Record<string, string>>({});
  const done = step === questions.length; const question = questions[step];
  const results = useMemo(() => {
    if (!done) return [];
    const regionMatches = (island: Island) => answers.region === "north" ? /北海道周辺|北陸/.test(island.area)
      : answers.region === "west" ? /近畿|中国|四国周辺/.test(island.area)
        : answers.region === "south" ? /九州|奄美|沖縄/.test(island.area)
          : answers.region === "izu" ? island.area === "伊豆諸島" : true;
    return islands.filter(regionMatches).sort((a, b) => score(b, answers, propertyCounts[b.id] || 0) - score(a, answers, propertyCounts[a.id] || 0) || a.name.localeCompare(b.name, "ja")).slice(0, 3);
  }, [answers, done, islands, propertyCounts]);
  return <div className="app-shell diagnosis-shell"><SiteHeader active="diagnosis" /><main id="main-content" className="page diagnosis-page"><p className="eyebrow">島暮らし診断</p><h1>暮らし方から、島を選ぶ</h1><p className="diagnosis-lead">8つの質問から、希望に近い島を表示します。住まい、アクセス、島の特徴を比較するための参考情報です。</p>{!done && question && <section className="diagnosis-panel"><p className="diagnosis-progress">質問 {step + 1} / {questions.length}</p><h2>{question[1]}</h2><div className="answer-grid">{question[2].map(([label, value]) => <button className="answer-button" key={value} onClick={() => { setAnswers((current) => ({ ...current, [question[0]]: value })); setStep((current) => current + 1); }}>{label}</button>)}</div>{step > 0 && <button className="back-link" onClick={() => setStep((current) => current - 1)}>← 前の質問へ</button>}</section>}{done && <section><div className="diagnosis-result-heading"><div><p className="eyebrow">島暮らし診断の結果</p><h2>希望に近い島</h2><p className="living-note">この結果は参考情報です。</p></div><button className="button ghost" onClick={() => { setAnswers({}); setStep(0); }}>もう一度診断する</button></div><div className="living-card-grid">{results.map((island) => <article className="living-card" key={island.id}><p className="eyebrow">{island.prefecture} / {island.area}</p><h3>{island.name}</h3><p>{island.description}</p><div className="living-card-list"><div><strong>住まい</strong><span>保存済み物件 {propertyCounts[island.id] || 0}件</span></div><div><strong>アクセス</strong><span>{island.access[0]?.summary || "詳細は公式情報で確認"}</span></div><div><strong>見どころ</strong><span>{island.famousSpot.name} — {island.famousSpot.summary}</span></div></div><p className="living-note">移住支援、気候、台風・自然災害の情報は、検討前に各自治体・公的機関の最新情報を確認してください。</p><div className="card-actions"><Link className="button primary" href={`/properties?island=${island.id}`}>この島の物件を見る</Link><a className="button ghost" href={island.routeUrl} target="_blank" rel="noreferrer">行き方を調べる</a></div></article>)}</div></section>}</main><SiteFooter /></div>;
}
