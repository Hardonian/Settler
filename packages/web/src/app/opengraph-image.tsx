import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Settler - Financial Infrastructure for Developers';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Grid Background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            opacity: 0.5,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {/* Logo Mark */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
              boxShadow: '0 0 40px rgba(37, 99, 235, 0.5)',
            }}
          >
            <div
              style={{
                color: 'white',
                fontSize: 48,
                fontWeight: 800,
                fontFamily: 'sans-serif',
              }}
            >
              S
            </div>
          </div>

          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: 'white',
              marginBottom: 20,
              letterSpacing: '-0.025em',
              fontFamily: 'sans-serif',
              background: 'linear-gradient(90deg, #ffffff 0%, #94a3b8 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Settler
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: '#94a3b8',
              textAlign: 'center',
              maxWidth: 800,
              lineHeight: 1.4,
              fontFamily: 'sans-serif',
            }}
          >
            The API Infrastructure for Financial Evidence
          </div>
        </div>

        {/* Feature Tags */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 60,
            zIndex: 10,
          }}
        >
          {['Reconciliation', 'Receipts', 'Feature Flags'].map((tag) => (
            <div
              key={tag}
              style={{
                padding: '10px 24px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0',
                fontSize: 20,
                fontWeight: 500,
                fontFamily: 'sans-serif',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
