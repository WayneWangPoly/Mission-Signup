import { useMemo, useState } from "react";

function getDefaultTargetDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    deliveryDate: params.get("deliveryDate") ?? getDefaultTargetDate(),
    city: params.get("city") ?? "Melbourne",
    mapImage: params.get("mapImage") ?? "/melbourne-task-base-map.png",
    notice:
      params.get("notice") ??
      "Please check the reward colors carefully before choosing your area.",
  };
}

export default function DriverSignup() {
  const query = useMemo(() => getQueryParams(), []);
  const [driverId, setDriverId] = useState("");
  const [availability, setAvailability] = useState("available");
  const [maxLoad, setMaxLoad] = useState(200);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!driverId.trim()) {
      alert("Please enter Driver ID");
      return;
    }

    const payload = {
      deliveryDate: query.deliveryDate,
      city: query.city,
      driverId,
      availability,
      maxLoad,
      notes,
    };

    console.log("Driver signup payload:", payload);
    setSubmitted(true);
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
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          background: "white",
          borderRadius: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
            Driver Signup
          </div>
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <div
            style={{
              background: "#dc2626",
              color: "white",
              borderRadius: 20,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
              }}
            >
              DELIVERY DATE
            </div>
            <div style={{ marginTop: 6, fontSize: 26, fontWeight: 900 }}>
              {query.deliveryDate}
            </div>
            <div
              style={{
                marginTop: 10,
                background: "rgba(255,255,255,0.16)",
                borderRadius: 14,
                padding: 10,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              This form is for the date above.
            </div>
          </div>
        </div>

        <div
          style={{
            margin: "0 16px 16px",
            background: "#fcd34d",
            borderRadius: 14,
            padding: 12,
            fontWeight: 700,
            color: "#1f2937",
          }}
        >
          {query.notice}
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, color: "#1f2937" }}>City</label>
            <div
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
              }}
            >
              {query.city}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, color: "#1f2937" }}>
              Driver ID
            </label>
            <input
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              placeholder="e.g. 1011"
              style={{
                width: "100%",
                marginTop: 8,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, color: "#1f2937" }}>
              Availability
            </label>
            <div
              style={{
                marginTop: 8,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
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
                  onClick={() => setAvailability(value)}
                  style={{
                    height: 46,
                    borderRadius: 12,
                    border:
                      availability === value
                        ? "1px solid #111827"
                        : "1px solid #cbd5e1",
                    background: availability === value ? "#111827" : "white",
                    color: availability === value ? "white" : "#334155",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, color: "#1f2937" }}>
              Max load
            </label>
            <input
              type="number"
              value={maxLoad}
              onChange={(e) => setMaxLoad(Number(e.target.value))}
              style={{
                width: "100%",
                marginTop: 8,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
            <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
              Experienced drivers can usually handle up to around 250 stops per
              day.
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, color: "#1f2937" }}>
              Reward map
            </label>
            <img
              src={query.mapImage}
              alt="Reward map"
              style={{
                width: "100%",
                marginTop: 8,
                borderRadius: 16,
                border: "1px solid #e2e8f0",
                display: "block",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, color: "#1f2937" }}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any note here"
              style={{
                width: "100%",
                marginTop: 8,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                fontSize: 16,
                minHeight: 100,
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              height: 50,
              borderRadius: 14,
              border: "none",
              background: "#111827",
              color: "white",
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
