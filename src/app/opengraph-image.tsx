import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Aegis Platform — Cybersecurity Learning, Research & Practice";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0F1012",
          color: "#F4F4F5",
          padding: "48px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#1A56DB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: 800,
              color: "white",
            }}
          >
            A
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Aegis Platform
            </span>
            <span style={{ fontSize: "12px", color: "#A1A1AA", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Cybersecurity Infrastructure
            </span>
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#17181B",
              border: "1px solid #2A2D32",
              borderRadius: "999px",
              padding: "6px 14px",
              fontSize: "11px",
              color: "#A1A1AA",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                backgroundColor: "#10B981",
              }}
            />
            All systems operational
          </div>
        </div>

        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              backgroundColor: "#1E293B",
              border: "1px solid #1E3A5F",
              color: "#60A5FA",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "6px 12px",
              borderRadius: "999px",
            }}
          >
            Professional • Verifiable • Enterprise-Ready
          </div>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Cybersecurity</span>
            <span style={{ color: "#3B82F6" }}>Learning, Research</span>
            <span> & Practice</span>
          </div>
          <div style={{ fontSize: "18px", lineHeight: "28px", color: "#A1A1AA", maxWidth: "760px" }}>
            Structured learning, isolated labs, peer-reviewed research and team operations — trusted by security teams
            worldwide.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #2A2D32",
            paddingTop: "20px",
            marginTop: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "#71717A" }}>aegis.example.com</span>
            <span style={{ width: "4px", height: "4px", borderRadius: "999px", backgroundColor: "#32363E" }} />
            <span style={{ fontSize: "12px", color: "#71717A" }}>180+ lessons • 124 labs • 1,204 challenges</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                backgroundColor: "#F4F4F5",
                color: "#0F1012",
                padding: "6px 12px",
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              Start learning →
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
