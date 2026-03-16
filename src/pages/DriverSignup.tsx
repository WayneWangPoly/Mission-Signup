import React, { useEffect, useMemo, useRef, useState } from "react";

type City = "Adelaide" | "Melbourne" | "Brisbane";
type Availability = "unavailable" | "available" | "preferred";
type MapPoint = { x: number; y: number };

type SignupPayload = {
  action: "submitSignup";
  deliveryDate: string;
  city: City;
  driverId: string;
  availability: Availability;
  maxLoad: number;
  vehicleTypes: string[];
  area: {
    point: MapPoint;
    coreRadius: number;
    extendRadius: number;
  };
  mapImage: string;
  adminNotice: string;
  notes: string;
  previewImage: string;
};

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxzpxaYr9nYe7FaTNiqV0PazRfBQW309RAlCBOrIzfO7TjPLuIolvArTkb7hApmmQOM-w/exec";

const cityList: City[] = ["Adelaide", "Melbourne", "Brisbane"];
const vehicleOptions = ["Sedan", "Hatchback", "SUV", "Van", "Ute", "Other"];

const DEFAULT_CITY: City = "Melbourne";
const DEFAULT_MAX_LOAD = 200;
const DEFAULT_CORE_RADIUS = 18;
const DEFAULT_EXTEND_RADIUS = 34;
const MIN_CORE_RADIUS = 8;
const GAP_RADIUS = 10;
const DEFAULT_NOTICE =
  "Please check the reward colors carefully before choosing your area.";
const DEFAULT_MAP_IMAGE = "/melbourne-task-base-map-v2.png";
const DATE_EDIT_PASSWORD = "1010";

function getDefaultTargetDate(): Date {
  return new Date();
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    missionId: params.get("missionId") ?? "",
    deliveryDate: params.get("deliveryDate") ?? "",
    city: params.get("city") ?? "",
    mapImage: params.get("mapImage") ?? "",
    notice: params.get("notice") ?? "",
  };
}

function getTargetDateFromQuery(raw: string): Date {
  if (!raw) return getDefaultTargetDate();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? getDefaultTargetDate() : parsed;
}

function formatBannerDate(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).toUpperCase();
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function sanitizeLoad(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MAX_LOAD;
  return Math.max(0, Math.round(value));
}

function sanitizeCoreRadius(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CORE_RADIUS;
  return Math.max(MIN_CORE_RADIUS, Math.round(value));
}

function sanitizeExtendRadius(value: number, coreRadius: number): number {
  if (!Number.isFinite(value)) {
    return Math.max(DEFAULT_EXTEND_RADIUS, coreRadius + GAP_RADIUS);
  }
  return Math.max(coreRadius + GAP_RADIUS, Math.round(value));
}

function sanitizePoint(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, value));
}

function normalizeCity(value: string): City {
  return cityList.includes(value as City) ? (value as City) : DEFAULT_CITY;
}

function normalizeImage(value: string): string {
  return value.trim() || DEFAULT_MAP_IMAGE;
}

function normalizeNotice(value: string): string {
  return value.trim() || DEFAULT_NOTICE;
}

function NoticeTicker({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  const content = `${text}   •   ${text}   •   ${text}`;

  return (
    <div
      onClick={onClick}
      style={{
        margin: "0 16px 16px",
        overflow: "hidden",
        borderRadius: 16,
        border: "1px solid #fcd34d",
        background: "#fcd34d",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          whiteSpace: "nowrap",
          padding: "10px 0",
          fontSize: 14,
          fontWeight: 700,
          color: "#111827",
          display: "inline-block",
          animation: "marquee 16s linear infinite",
        }}
      >
        {content}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(15%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

function StaticMapSelector({
  imageUrl,
  point,
  setPoint,
  coreRadius,
  setCoreRadius,
  extendRadius,
  setExtendRadius,
}: {
  imageUrl: string;
  point: MapPoint;
  setPoint: (value: MapPoint) => void;
  coreRadius: number;
  setCoreRadius: (value: number) => void;
  extendRadius: number;
  setExtendRadius: (value: number) => void;
}) {
  const mapRef = useRef<HTMLButtonElement | null>(null);
  const [mapSize, setMapSize] = useState({ width: 320, height: 240 });

  useEffect(() => {
    const updateSize = () => {
      if (!mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setMapSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const timer = window.setTimeout(updateSize, 120);
    window.addEventListener("resize", updateSize);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const cx = (mapSize.width * point.x) / 100;
  const cy = (mapSize.height * point.y) / 100;
  const base = Math.max(240, Math.min(mapSize.width, mapSize.height));
  const corePx = (base * coreRadius) / 100 / 2;
  const extendPx = (base * extendRadius) / 100 / 2;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          overflow: "hidden",
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          background: "#fff",
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            fontSize: 12,
            color: "#475569",
          }}
        >
          Tap the latest reward map to choose your area.
        </div>

        <button
          type="button"
          ref={mapRef}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = sanitizePoint(((e.clientX - rect.left) / rect.width) * 100);
            const y = sanitizePoint(((e.clientY - rect.top) / rect.height) * 100);
            setPoint({ x, y });
          }}
          style={{
            position: "relative",
            display: "block",
            width: "100%",
            background: "#f1f5f9",
            border: "none",
            padding: 0,
            cursor: "crosshair",
          }}
        >
          <img
            src={imageUrl}
            alt="Latest reward map"
            crossOrigin="anonymous"
            style={{ display: "block", width: "100%", height: "auto" }}
            onLoad={() => {
              if (!mapRef.current) return;
              const rect = mapRef.current.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setMapSize({ width: rect.width, height: rect.height });
              }
            }}
          />

          <svg
            style={{
              pointerEvents: "none",
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
            viewBox={`0 0 ${mapSize.width} ${mapSize.height}`}
            preserveAspectRatio="none"
          >
            <circle
              cx={cx}
              cy={cy}
              r={extendPx}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="3"
              strokeDasharray="10 8"
            />
            <circle
              cx={cx}
              cy={cy}
              r={corePx}
              fill="none"
              stroke="#0f172a"
              strokeWidth="4"
            />
          </svg>
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <div
          style={{
            border: "1px solid #e2e8f0",
            background: "#fff",
            borderRadius: 16,
            padding: 12,
          }}
        >
          <div
            style={{
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#1e293b",
            }}
          >
            Preferred area size
          </div>
          <input
            type="range"
            value={coreRadius}
            min={MIN_CORE_RADIUS}
            max={32}
            step={1}
            onChange={(e) => {
              const nextCore = sanitizeCoreRadius(Number(e.target.value));
              setCoreRadius(nextCore);
              setExtendRadius(sanitizeExtendRadius(extendRadius, nextCore));
            }}
            style={{ width: "100%" }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
            Solid circle
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e2e8f0",
            background: "#fff",
            borderRadius: 16,
            padding: 12,
          }}
        >
          <div
            style={{
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#1e293b",
            }}
          >
            Extended area size
          </div>
          <input
            type="range"
            value={extendRadius}
            min={coreRadius + GAP_RADIUS}
            max={52}
            step={1}
            onChange={(e) =>
              setExtendRadius(sanitizeExtendRadius(Number(e.target.value), coreRadius))
            }
            style={{ width: "100%" }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
            Dashed circle
          </div>
        </div>
      </div>
    </div>
  );
}

async function generateMapPreviewImage(
  imageUrl: string,
  point: { x: number; y: number },
  coreRadius: number,
  extendRadius: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const maxWidth = 420;
        const scale = maxWidth / img.width;
        const width = maxWidth;
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const cx = (point.x / 100) * width;
        const cy = (point.y / 100) * height;

        const base = Math.min(width, height);
        const corePx = ((base * coreRadius) / 100) / 2;
        const extendPx = ((base * extendRadius) / 100) / 2;

        ctx.beginPath();
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#94a3b8";
        ctx.arc(cx, cy, extendPx, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#0f172a";
        ctx.arc(cx, cy, corePx, 0, Math.PI * 2);
        ctx.stroke();

        const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Failed to load map image for preview"));
    img.src = imageUrl;
  });
}

export default function DriverSignup() {
  const query = useMemo(() => getQueryParams(), []);
  const initialTargetDate = useMemo(
    () => getTargetDateFromQuery(query.deliveryDate),
    [query.deliveryDate]
  );

  const [targetDate, setTargetDate] = useState<Date>(initialTargetDate);
  const targetDateText = useMemo(() => formatBannerDate(targetDate), [targetDate]);
  const deliveryDateIso = useMemo(() => formatIsoDate(targetDate), [targetDate]);

  const defaultCity = useMemo(() => normalizeCity(query.city), [query.city]);
  const initialNotice = useMemo(
    () => normalizeNotice(decodeURIComponent(query.notice || "")),
    [query.notice]
  );

  const [embeddedMapImage, setEmbeddedMapImage] = useState(
    normalizeImage(query.mapImage)
  );
  const [editableNotice, setEditableNotice] = useState(initialNotice);

  const [city, setCity] = useState<City>(defaultCity);
  const [driverId, setDriverId] = useState("");
  const [availability, setAvailability] = useState<Availability>("available");
  const [maxLoad, setMaxLoad] = useState<number>(DEFAULT_MAX_LOAD);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(["Van"]);
  const [point, setPoint] = useState<MapPoint>({ x: 50, y: 50 });
  const [coreRadius, setCoreRadius] = useState<number>(DEFAULT_CORE_RADIUS);
  const [extendRadius, setExtendRadius] = useState<number>(DEFAULT_EXTEND_RADIUS);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const normalized = normalizeImage(query.mapImage);
    setEmbeddedMapImage(normalized);
  }, [query.mapImage]);

  useEffect(() => {
    setEditableNotice(initialNotice);
  }, [initialNotice]);

  const requestPassword = () => {
    const input = window.prompt("Enter password");
    if (input === null) return false;

    if (input !== DATE_EDIT_PASSWORD) {
      alert("Incorrect password.");
      return false;
    }

    return true;
  };

  const changeDateWithPassword = (days: number) => {
    if (!requestPassword()) return;

    setTargetDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  const editNoticeWithPassword = () => {
    if (!requestPassword()) return;

    const next = window.prompt("Edit notice text", editableNotice);
    if (next === null) return;

    setEditableNotice(next.trim() || DEFAULT_NOTICE);
  };

  const toggleVehicle = (type: string) => {
    setVehicleTypes((prev) => {
      if (prev.includes(type)) {
        const next = prev.filter((v) => v !== type);
        return next.length > 0 ? next : prev;
      }
      return [...prev, type];
    });
  };

  const resetForm = () => {
    setCity(defaultCity);
    setDriverId("");
    setAvailability("available");
    setMaxLoad(DEFAULT_MAX_LOAD);
    setVehicleTypes(["Van"]);
    setPoint({ x: 50, y: 50 });
    setCoreRadius(DEFAULT_CORE_RADIUS);
    setExtendRadius(DEFAULT_EXTEND_RADIUS);
    setNotes("");
    setTargetDate(initialTargetDate);
    setEditableNotice(initialNotice);
    setSubmitted(false);
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!driverId.trim()) {
      alert("Please enter Driver ID");
      return;
    }

    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
      alert("Apps Script URL is not configured yet.");
      return;
    }

    setSubmitting(true);

    try {
      const previewImage = await generateMapPreviewImage(
        embeddedMapImage,
        point,
        coreRadius,
        extendRadius
      );

      const payload: SignupPayload = {
        action: "submitSignup",
        deliveryDate: deliveryDateIso,
        city,
        driverId,
        availability,
        maxLoad,
        vehicleTypes,
        area: {
          point,
          coreRadius,
          extendRadius,
        },
        mapImage: embeddedMapImage,
        adminNotice: editableNotice,
        notes,
        previewImage,
      };

      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!result.ok) {
        throw new Error(result.error || "Submit failed");
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Submit failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "white",
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
            Signup Submitted
          </div>
          <div style={{ marginTop: 12, color: "#475569", lineHeight: 1.5 }}>
            Your availability for the delivery mission has been recorded.
          </div>
          <div style={{ marginTop: 10, fontSize: 14, color: "#64748b" }}>
            You may close this page. Dispatch will confirm assignments later.
          </div>

          <button
            onClick={() => setSubmitted(false)}
            style={{
              marginTop: 24,
              width: "100%",
              height: 48,
              borderRadius: 14,
              border: "none",
              background: "#111827",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: 16,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          background: "white",
          borderRadius: 28,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <div style={{ background: "white", padding: "20px 20px 16px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <img
              src="/microexpress-logo.png"
              alt="MicroExpress"
              style={{ marginBottom: 12, height: 64, width: "auto" }}
            />
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
              Driver Signup
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px 12px" }}>
          <div
            style={{
              borderRadius: 24,
              border: "2px solid #fecaca",
              background: "#dc2626",
              padding: 16,
              textAlign: "center",
              color: "white",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "52px 1fr 52px",
                alignItems: "center",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => changeDateWithPassword(-1)}
                style={{
                  height: 42,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  fontSize: 22,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                -
              </button>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                  }}
                >
                  DELIVERY DATE
                </div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 900 }}>
                  {targetDateText}
                </div>
              </div>

              <button
                type="button"
                onClick={() => changeDateWithPassword(1)}
                style={{
                  height: 42,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  fontSize: 22,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <NoticeTicker text={editableNotice} onClick={editNoticeWithPassword} />

        <div style={{ display: "grid", gap: 20, padding: 20 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
              City
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginTop: 8,
              }}
            >
              {cityList.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCity(item)}
                  style={{
                    height: 48,
                    borderRadius: 16,
                    border: city === item ? "1px solid #111827" : "1px solid #cbd5e1",
                    background: city === item ? "#111827" : "white",
                    color: city === item ? "white" : "#334155",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
              Driver ID
            </label>
            <input
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              placeholder="e.g. 1011"
              style={{
                width: "100%",
                marginTop: 8,
                height: 48,
                borderRadius: 16,
                border: "1px solid #cbd5e1",
                padding: "0 12px",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
              Availability
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginTop: 8,
              }}
            >
              {[
                ["unavailable", "Unavailable"],
                ["available", "Available"],
                ["preferred", "Priority Me!"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAvailability(value as Availability)}
                  style={{
                    height: 48,
                    borderRadius: 16,
                    border:
                      availability === value
                        ? "1px solid #111827"
                        : "1px solid #cbd5e1",
                    background: availability === value ? "#111827" : "white",
                    color: availability === value ? "white" : "#334155",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
              Max load
            </label>
            <input
              type="number"
              value={maxLoad}
              onChange={(e) => setMaxLoad(sanitizeLoad(Number(e.target.value)))}
              style={{
                width: "100%",
                marginTop: 8,
                height: 48,
                borderRadius: 16,
                border: "1px solid #cbd5e1",
                padding: "0 12px",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
            <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
              Experienced drivers can usually handle up to around 250 stops per day.
            </div>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
              Vehicle type
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 8,
              }}
            >
              {vehicleOptions.map((type) => {
                const active = vehicleTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleVehicle(type)}
                    style={{
                      height: 40,
                      borderRadius: 12,
                      border: active ? "1px solid #111827" : "1px solid #cbd5e1",
                      background: active ? "#111827" : "white",
                      color: active ? "white" : "#334155",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
              Delivery area
            </label>
            <div
              style={{
                marginTop: 8,
                borderRadius: 16,
                background: "#f8fafc",
                padding: "10px 12px",
                fontSize: 12,
                color: "#475569",
              }}
            >
              Solid circle = preferred area. Dashed circle = extended area.
            </div>
          </div>

          <StaticMapSelector
            imageUrl={embeddedMapImage}
            point={point}
            setPoint={setPoint}
            coreRadius={coreRadius}
            setCoreRadius={setCoreRadius}
            extendRadius={extendRadius}
            setExtendRadius={setExtendRadius}
          />

          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any note here"
              style={{
                width: "100%",
                marginTop: 8,
                minHeight: 100,
                borderRadius: 16,
                border: "1px solid #cbd5e1",
                padding: 12,
                fontSize: 16,
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 8, paddingTop: 4 }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 16,
                border: "none",
                background: submitting ? "#475569" : "#111827",
                color: "white",
                fontWeight: 700,
                fontSize: 16,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>

            <button
              onClick={resetForm}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 16,
                border: "1px solid #cbd5e1",
                background: "white",
                color: "#0f172a",
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>

          <div
            style={{
              borderRadius: 16,
              background: "#f8fafc",
              padding: 12,
              fontSize: 12,
              color: "#64748b",
            }}
          >
            Final job allocation is based on overall operations.
          </div>
        </div>
      </div>
    </div>
  );
}
