import { ImageResponse } from 'next/og';

export const alt = 'Naru Closet — Tu estilo, a tu manera.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Imagen para compartir en redes: logotipo tipográfico sobre fondo Warm Ivory. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 80,
          background: '#f5f1eb',
          color: '#302b28',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 132, letterSpacing: -4, lineHeight: 1 }}>
          naru closet<span style={{ color: '#b98280' }}>.</span>
        </div>
        <div style={{ fontSize: 40, marginTop: 28, color: '#70645b', fontStyle: 'italic' }}>Tu estilo, a tu manera.</div>
      </div>
    ),
    size,
  );
}
