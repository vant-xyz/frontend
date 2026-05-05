import { getMarket, Market } from '@/lib/api';
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let market: Market;
  try {
    const res = await getMarket(params.id);
    market = res.market;
  } catch (e) {
    // Fallback image if market not found
    market = { title: "Vantic Market", current_price: 5000 } as any;
  }

  const yesPrice = Math.round((market.current_price ?? 50) / 100);
  const noPrice = 100 - yesPrice;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          color: 'white',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, #1f1f1f, #0a0a0a)',
            width: '100%',
            height: '100%',
            padding: '60px 80px',
            border: '24px solid #22c55e',
          }}
        >
          {/* Title */}
          <div style={{ 
            fontSize: 52, 
            fontWeight: 700, 
            textAlign: 'center', 
            lineHeight: 1.1,
            marginBottom: 48 
          }}>
            {market.title}
          </div>

          {/* Prices */}
          <div style={{ display: 'flex', gap: 60, marginBottom: 60 }}>
            <div style={{ 
              background: '#22c55e', 
              color: '#000', 
              padding: '18px 48px', 
              borderRadius: 999, 
              fontSize: 42, 
              fontWeight: 700 
            }}>
              YES {yesPrice}¢
            </div>
            <div style={{ 
              background: '#ef4444', 
              color: '#fff', 
              padding: '18px 48px', 
              borderRadius: 999, 
              fontSize: 42, 
              fontWeight: 700 
            }}>
              NO {noPrice}¢
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            fontSize: 28, 
            opacity: 0.85, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12 
          }}>
            Vantic • Fastest Prediction Market on Solana
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}