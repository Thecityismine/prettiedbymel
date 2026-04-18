import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            border: "4px solid #ff1aad",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 64,
              fontWeight: 900,
              fontFamily: "Georgia, serif",
              lineHeight: 1,
            }}
          >
            M
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
