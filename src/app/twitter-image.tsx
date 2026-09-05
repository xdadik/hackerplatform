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
          justifyContent: "center",
          backgroundColor: "#0F1012",
          color: "#F4F4F5",
          padding: "56px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            backgroundColor: "#17181B",
            border: "1px solid #2A2D32",
            color: "#A1A1AA",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "6px 12px",
            borderRadius: "999px",
            marginBottom: "20px",
          }}
        >
          ● No credit card required • Free to start
        </div>

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "12px",
              backgroundColor: "#1A56DB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: 800,
              color: "white",
            }}
          >
            A
          </div>
          <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}>Aegis Platform</span>
          <span
            style={{
              fontSize: "11px",
              color: "#3B82F6",
              backgroundColor: "#1E293B",
              border: "1px solid #1E3A5F",
              padding: "4px 10px",
              borderRadius: "999px",
              fontWeight: 600,
            }}
          >
            v2.0
          </span>
        </div>

        <div
          style={{
            fontSize: "54px",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            display: "flex",
            flexDirection: "column",
            marginBottom: "16px",
          }}
        >
          <span>Professional</span>
          <span style={{ color: "#60A5FA" }}>cybersecurity training</span>
          <span>for security teams.</span>
        </div>

        <div style={{ fontSize: "16px", color: "#A1A1AA", lineHeight: "24px", maxWidth: "640px" }}>
          Labs, challenges, research & team operations — in one verifiable platform.
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#F4F4F5",
              color: "#0F1012",
              fontSize: "13px",
              fontWeight: 700,
              padding: "10px 18px",
              borderRadius: "10px",
            }}
          >
            Join Aegis →
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "12px",
              color: "#71717A",
              border: "1px solid #2A2D32",
              padding: "10px 14px",
              borderRadius: "10px",
            }}
          >
            aegis.example.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
