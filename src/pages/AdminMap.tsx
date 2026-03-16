import React, { useMemo, useRef, useState } from "react";
import { toJpeg } from "html-to-image";

type City = "Adelaide" | "Melbourne" | "Brisbane";
type RewardLevel = "normal" | "medium" | "high";
type ToolType = "suburb" | "circle" | "star" | "zone";

type OverlayItem = {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  reward: RewardLevel;
};

const cityList: City[] = ["Adelaide", "Melbourne", "Brisbane"];
const cityBaseImages: Record<City, string> = {
  Adelaide: "/adelaide-task-base-map.png",
  Melbourne: "/melbourne-task-base-map.png",
  Brisbane: "/brisbane-task-base-map.png",
};

const DRIVER_BASE = "/driver-signup";

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function rewardStyle(level: RewardLevel) {
  if (level === "high") return { border: "#dc2626", fill: "rgba(220,38,38,0.22)", chip: "#dc2626" };
  if (level === "medium") return { border: "#f59e0b", fill: "rgba(245,158,11,0.22)", chip: "#f59e0b" };
  return { border: "#0ea5e9", fill: "rgba(14,165,233,0.18)", chip: "#0ea5e9" };
}

function safeBase64Encode(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}

function OverlayShape({ item }: { item: OverlayItem }) {
  const style = rewardStyle(item.reward);

  if (item.type === "circle") {
    return (
      <div
        style={{
          position: "absolute",
          left: `${item.x}%`,
          top: `${item.y}%`,
          width: `${item.w}%`,
          height: `${item.w}%`,
          transform: "translate(-50%, -50%)",
          borderRadius: "999px",
          border: `3px solid ${style.border}`,
          background: style.fill,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: style.chip,
            color: "white",
            borderRadius: 999,
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {item.label || item.reward}
        </div>
      </div>
    );
  }

  if (item.type === "star") {
    return (
      <div
        style={{
          position: "absolute",
          left: `${item.x}%`,
          top: `${item.y}%`,
          transform: "translate(-50%, -50%)",
          background: style.fill,
          border: `2px solid ${style.border}`,
          borderRadius: 999,
          padding: "4px 8px",
          color: style.border,
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        ★ {item.label || "Hot reward"}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `${item.x}%`,
        top: `${item.y}%`,
        width: `${item.w}%`,
        height: `${item.h}%`,
        transform: "translate(-50%, -50%)",
        borderRadius: 18,
        border: `3px solid ${style.border}`,
        background: style.fill,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          background: style.chip,
          color: "white",
          borderRadius: 999,
          padding: "2px 8px",
          fontSize: 10,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {item.label || (item.type === "zone" ? "Task zone" : "Suburb")}
      </div>
    </div>
  );
}

export default function AdminMap() {
  const [city, setCity] = useState<City>("Melbourne");
  const [deliveryDate, setDeliveryDate] = useState(tomorrowIso());
  const [notice, setNotice] = useState("Please check the reward colors carefully before choosing your area.");
  const [tool, setTool] = useState<ToolType>("suburb");
  const [reward, setReward] = useState<RewardLevel>("high");
  const [label, setLabel] = useState("High reward");
  const [size, setSize] = useState(18);
  const [driverBaseUrl, setDriverBaseUrl] = useState(DRIVER_BASE);
  const [generatedLink, setGeneratedLink] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const baseMap = cityBaseImages[city];

  const addOverlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const next: OverlayItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: tool,
      x,
      y,
      w: tool === "star" ? 12 : size,
      h: tool === "zone" || tool === "suburb" ? Math.max(12, Math.round(size * 0.65)) : size,
      label,
      reward,
    };
    setOverlays((prev) => [...prev, next]);
  };

  const generateSignupLink = async () => {
    if (!mapRef.current) return;
    try {
      setPublishing(true);
      const screenshot = await toJpeg(mapRef.current, {
        quality: 0.72,
        pixelRatio: 0.9,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const overlaysEncoded = safeBase64Encode(JSON.stringify(overlays));
      const params = new URLSearchParams({
        deliveryDate,
        city,
        mapImage: screenshot,
        notice,
        overlays: overlaysEncoded,
      });

      const link = `${driverBaseUrl}?${params.toString()}`;
      setGeneratedLink(link);
      await navigator.clipboard.writeText(link);
      alert("Driver signup link generated and copied.");
    } catch (err) {
      console.error(err);
      alert("Failed to generate signup link.");
    } finally {
      setPublishing(false);
    }
  };

  const rewardLegend = useMemo(
    () => [
      { key: "normal", label: "Normal", color: "#0ea5e9" },
      { key: "medium", label: "Medium", color: "#f59e0b" },
      { key: "high", label: "High", color: "#dc2626" },
    ],
    []
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 20, gridTemplateColumns: "minmax(360px, 430px) 1fr" }}>
        <div style={{ background: "white", borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.08)", padding: 20, display: "grid", gap: 16 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>Admin Reward Map</div>
            <div style={{ marginTop: 6, color: "#64748b", fontSize: 14 }}>Set reward areas, then generate a driver link with the updated map.</div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>City</div>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {cityList.map((item) => (
                <button key={item} type="button" onClick={() => setCity(item)} style={{ height: 44, borderRadius: 14, border: city === item ? "1px solid #111827" : "1px solid #cbd5e1", background: city === item ? "#111827" : "white", color: city === item ? "white" : "#334155", fontWeight: 700, cursor: "pointer" }}>{item}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Delivery date</div>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={{ width: "100%", marginTop: 8, height: 46, borderRadius: 14, border: "1px solid #cbd5e1", padding: "0 12px", boxSizing: "border-box" }} />
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Notice</div>
            <textarea value={notice} onChange={(e) => setNotice(e.target.value)} style={{ width: "100%", marginTop: 8, minHeight: 86, borderRadius: 14, border: "1px solid #cbd5e1", padding: 12, boxSizing: "border-box", resize: "vertical" }} />
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 18, padding: 14, background: "#f8fafc" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Reward colors</div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {rewardLegend.map((item) => (
                <span key={item.key} style={{ background: item.color, color: "white", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>{item.label}</span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Tool</div>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["suburb", "Highlight suburb"],
                ["circle", "Circle area"],
                ["star", "Star marker"],
                ["zone", "Task zone overlay"],
              ].map(([key, text]) => (
                <button key={key} type="button" onClick={() => setTool(key as ToolType)} style={{ height: 44, borderRadius: 14, border: tool === key ? "1px solid #111827" : "1px solid #cbd5e1", background: tool === key ? "#111827" : "white", color: tool === key ? "white" : "#334155", fontWeight: 700, cursor: "pointer" }}>{text}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Reward level</div>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {(["normal", "medium", "high"] as RewardLevel[]).map((item) => (
                <button key={item} type="button" onClick={() => setReward(item)} style={{ height: 44, borderRadius: 14, border: reward === item ? "1px solid #111827" : "1px solid #cbd5e1", background: reward === item ? "#111827" : "white", color: reward === item ? "white" : "#334155", fontWeight: 700, cursor: "pointer" }}>{item}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Label</div>
            <input value={label} onChange={(e) => setLabel(e.target.value)} style={{ width: "100%", marginTop: 8, height: 46, borderRadius: 14, border: "1px solid #cbd5e1", padding: "0 12px", boxSizing: "border-box" }} />
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Area size</div>
            <input type="range" value={size} min={10} max={36} step={1} onChange={(e) => setSize(Number(e.target.value))} style={{ width: "100%", marginTop: 10 }} />
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Driver signup base URL</div>
            <input value={driverBaseUrl} onChange={(e) => setDriverBaseUrl(e.target.value)} style={{ width: "100%", marginTop: 8, height: 46, borderRadius: 14, border: "1px solid #cbd5e1", padding: "0 12px", boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <button type="button" onClick={generateSignupLink} disabled={publishing} style={{ height: 48, borderRadius: 16, border: "none", background: publishing ? "#475569" : "#111827", color: "white", fontWeight: 800, cursor: publishing ? "not-allowed" : "pointer" }}>
              {publishing ? "Generating..." : "Generate Driver Link"}
            </button>
            <button type="button" onClick={() => setOverlays([])} style={{ height: 44, borderRadius: 16, border: "1px solid #cbd5e1", background: "white", color: "#0f172a", fontWeight: 700, cursor: "pointer" }}>
              Clear all reward marks
            </button>
          </div>

          {generatedLink && (
            <div style={{ borderRadius: 16, background: "#f8fafc", padding: 12, fontSize: 12, color: "#475569", wordBreak: "break-all" }}>
              {generatedLink}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.08)", padding: 16 }}>
            <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Click the map to add reward marks</div>
            <div ref={mapRef} style={{ position: "relative", overflow: "hidden", borderRadius: 18, border: "1px solid #e2e8f0", background: "white" }}>
              <button type="button" onClick={addOverlay} style={{ position: "relative", display: "block", width: "100%", border: "none", padding: 0, background: "#f8fafc", cursor: "crosshair" }}>
                <img src={baseMap} alt={`${city} base map`} style={{ display: "block", width: "100%", height: "auto" }} />
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  {overlays.map((item) => <OverlayShape key={item.id} item={item} />)}
                </div>
              </button>
            </div>
          </div>

          <div style={{ background: "white", borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.08)", padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Current reward marks</div>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {overlays.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>No reward marks yet.</div>}
              {overlays.map((item, index) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 14, padding: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>#{index + 1} · {item.type}</div>
                    <div style={{ marginTop: 3, fontSize: 12, color: "#64748b" }}>{item.label || "No label"} · {item.reward}</div>
                  </div>
                  <button type="button" onClick={() => setOverlays((prev) => prev.filter((x) => x.id !== item.id))} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: 12, padding: "6px 10px", cursor: "pointer" }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
