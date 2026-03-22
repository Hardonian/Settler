import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Settler - Deterministic Reconciliation';
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
          {/* Checkmark Icon — matches canonical Settler logo mark */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
              boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
            >
              <path
                d="M12 25L20 33L36 17"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
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
            Deterministic Reconciliation Infrastructure
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
          {['Reconciliation', 'Audit Evidence', 'Policy Controls'].map((tag) => (
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
