'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { X, Download} from 'lucide-react';
import { Position, Market } from '@/lib/api';
import { FaXTwitter } from "react-icons/fa6";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

interface SharePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  market: Market;
  pnl: number;
  pnlPct: number;
  avgPriceCents: number;
  currentPriceCents: number;
}

export function SharePositionModal({
  isOpen,
  onClose,
  position,
  market,
  pnl,
  pnlPct,
  avgPriceCents,
  currentPriceCents,
}: SharePositionModalProps) {
  const isMobile = useIsMobile();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const isWin = pnl >= 0;
  const sideColor = position.side === 'YES' ? '#22c55e' : '#ef4444';
  const sideBg = position.side === 'YES' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // retina quality
      });
      const link = document.createElement('a');
      link.download = `vantic-position-${position.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShareTwitter = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Generate image first
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });

      // Try Web Share API (works on mobile)
      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'vantic-position.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: `${isWin ? '+' : ''}$${Math.abs(pnl).toFixed(2)} on ${position.side} — "${market.title}" on @VanticApp`,
          });
          return;
        }
      }

      const tweetText = `${isWin ? '🟢' : '🔴'} ${isWin ? '+' : ''}$${Math.abs(pnl).toFixed(2)} (${isWin ? '+' : ''}${pnlPct.toFixed(1)}%) on ${position.side}\n\n"${market.title}"\n\nTrading on @VanticApp — fastest prediction market on Solana`;
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
        '_blank'
      );
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const content = (
    <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Share your position</p>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

        {/* Card — this is what gets exported */}
        <div
          ref={cardRef}
          style={{
            background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
            borderRadius: '2px',
            padding: '28px',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Background glow */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '200px',
            height: '200px',
            background: isWin ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span className='flex gap-2 items-center' style={{ color: '#ef4444', fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em' }}>
              <div className="w-5 h-5 bg-red-600 rounded"></div> VANTIC
            </span>
            <span style={{
              background: sideBg,
              color: sideColor,
              border: `1px solid ${sideColor}40`,
              padding: '2px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}>
              {position.side}
            </span>
          </div>

          <p style={{
            color: '#6b7280',
            fontSize: '12px',
            marginBottom: '12px',
            lineHeight: 1.4,
            maxWidth: '100%',
          }}>
            {market.title}
          </p>

          <div style={{ marginBottom: '20px' }}>
            <div style={{
              color: isWin ? '#22c55e' : '#ef4444',
              fontSize: '48px',
              fontWeight: 900,
              lineHeight: 1,
              fontFamily: 'monospace',
              marginBottom: '4px',
            }}>
              {isWin ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
            </div>
            <div style={{
              color: isWin ? '#16a34a' : '#dc2626',
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'monospace',
            }}>
              ({isWin ? '+' : ''}{pnlPct.toFixed(1)}%)
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
            {[
              { label: 'Shares', value: position.shares.toString() },
              { label: 'Avg Entry', value: `${avgPriceCents.toFixed(1)}¢` },
              { label: 'Current', value: `${currentPriceCents.toFixed(1)}¢` },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ color: '#4b5563', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {stat.label}
                </div>
                <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom accent line */}
          <div style={{
            height: '2px',
            background: `linear-gradient(90deg, ${sideColor}, transparent)`,
            borderRadius: '999px',
          }} />

          {/* Watermark */}
          <div style={{
            marginTop: '12px',
            color: '#374151',
            fontSize: '11px',
            textAlign: 'right',
            letterSpacing: '0.05em',
          }}>
            vantic.xyz
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleShareTwitter}
            disabled={downloading}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/8 hover:bg-white/15 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <FaXTwitter size={15} />
            Share on X
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Download size={15} />
            {downloading ? 'Saving...' : 'Download'}
          </button>
        </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="bg-black border-white/10 text-white px-3 pb-4">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Share your position</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-black border-white/10 text-white p-0 max-w-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>Share your position</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
