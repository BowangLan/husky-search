// app/og/route.tsx
import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(req: Request) {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          position: "relative",
          background: "linear-gradient(135deg, #4b2e83 0%, #1a1a1a 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.4,
          }}
        />

        {/* Main content container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: "80px",
            zIndex: 1,
          }}
        >
          {/* App logo - W icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "120px",
              height: "120px",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              marginBottom: "40px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: "#2d2d2d",
                fontFamily: "Inter, system-ui, sans-serif",
                letterSpacing: "-0.05em",
              }}
            >
              W
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              color: "#f0f0f0",
              textAlign: "center",
              margin: "0 0 20px 0",
              textShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
              letterSpacing: "-0.02em",
            }}
          >
            Husky Search
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "32px",
              color: "rgba(240, 240, 240, 0.8)",
              textAlign: "center",
              margin: "0 0 40px 0",
              maxWidth: "800px",
              lineHeight: 1.3,
              fontWeight: 400,
            }}
          >
            Discover and explore University of Washington courses
          </p>

          {/* Search bar visual */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "50px",
              padding: "16px 32px",
              minWidth: "400px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                marginRight: "16px",
                color: "#666",
              }}
            >
              🔍
            </div>
            <div
              style={{
                fontSize: "24px",
                color: "#888",
                fontWeight: 400,
              }}
            >
              Search courses, majors, and more...
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "40px",
            display: "flex",
            alignItems: "center",
            color: "rgba(240, 240, 240, 0.6)",
            fontSize: "20px",
            fontWeight: 500,
          }}
        >
          huskysearch.fyi
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
