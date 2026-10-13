"use client";

import { useEffect, useRef } from "react";
import type { SearchStatus } from "./property-explorer";
import islandData from "./islands_top50.json";

type Island = (typeof islandData.islands)[number];

function statusLabel(count: number, status?: SearchStatus) {
  if (status?.status === "partial") return count ? `${count}件（取得未完了）` : "取得未完了";
  if (status?.status === "completed-empty") return "0件（確認済み）";
  return `${count}件`;
}

export function TileIslandMap({
  islands,
  propertyCounts,
  searchStatuses,
  onSelect,
}: {
  islands: Island[];
  propertyCounts: Map<string, number>;
  searchStatuses: Map<string, SearchStatus>;
  onSelect: (island: Island) => void;
}) {
  const mapElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapElement.current) return;
    let disposed = false;
    let map: import("leaflet").Map | undefined;

    void import("leaflet").then((module) => {
      if (disposed || !mapElement.current) return;
      const L = module.default;
      map = L.map(mapElement.current, {
        scrollWheelZoom: true,
        zoomControl: true,
        minZoom: 4,
        maxZoom: 13,
      }).setView([34.5, 135.5], 5);

      L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
        attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">地理院タイル</a>',
        minZoom: 4,
        maxZoom: 13,
        tileSize: 256,
      }).addTo(map);

      islands.forEach((island) => {
        const count = propertyCounts.get(island.id) || 0;
        const label = statusLabel(count, searchStatuses.get(island.id));
        const icon = L.divIcon({
          className: "island-rank-pin-wrap",
          html: `<span class="island-rank-pin" data-rank="${island.rank}" aria-hidden="true"></span>`,
          iconSize: [28, 34],
          iconAnchor: [14, 32],
          popupAnchor: [0, -31],
          tooltipAnchor: [0, -27],
        });
        const marker = L.marker([island.location.lat, island.location.lng], {
          icon,
          title: `${island.rank}位 ${island.name}`,
          keyboard: true,
          riseOnHover: true,
          zIndexOffset: 1000 - island.rank,
        }).addTo(map!);
        marker.bindTooltip(`<strong>${island.rank}位 ${island.name}</strong><br><span>${island.prefecture}｜賃貸物件 ${label}</span>`, {
          direction: "top",
          offset: [0, -4],
          opacity: 1,
          sticky: true,
          className: "island-map-tooltip",
        });
        marker.bindPopup(`<strong>${island.rank}位 ${island.name}</strong><br>${island.prefecture}<br>人口 ${island.population.value.toLocaleString("ja-JP")}人<br>賃貸物件 ${label}<br><small>クリックすると詳細を表示します</small>`);
        marker.on("click", () => {
          marker.openPopup();
          window.setTimeout(() => onSelect(island), 250);
        });
      });
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [islands, onSelect, propertyCounts, searchStatuses]);

  return <section aria-labelledby="island-map-title">
    <div className="svg-map-heading">
      <div><strong id="island-map-title">日本の有人離島 地理院地図</strong><span>数字は人口順位です。マーカーを選ぶと人口・アクセス・物件情報を確認できます。</span></div>
      <span className="map-legend"><i aria-hidden="true" /> 島（数字は人口順位）</span>
    </div>
    <div ref={mapElement} className="island-map detailed-island-map" aria-label="日本の有人離島地図" />
  </section>;
}
