import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 8,
        }}
      >
        <span
          style={{
            color: "#ff1aad",
            fontSize: 22,
            fontWeight: 900,
            fontFamily: "Georgia, serif",
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size }
  );
}
