import { memo } from 'react';
import type { WheelPrize } from '../../api/wheel';

interface WheelLegendProps {
  prizes: WheelPrize[];
}

// Та же палитра, что и в FortuneWheel — для визуальной консистентности
const FALLBACK_COLORS = [
  '#A855F7',
  '#8B5CF6',
  '#7C3AED',
  '#9333EA',
  '#C026D3',
  '#A855F7',
  '#8B5CF6',
  '#7C3AED',
];

const getPrizeColor = (index: number, baseColor?: string) =>
  baseColor || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

const WheelLegend = memo(function WheelLegend({ prizes }: WheelLegendProps) {
  return (
    <div className="space-y-2">
      {prizes.map((prize, index) => {
        const color = getPrizeColor(index, prize.color);
        return (
          <div
            key={prize.id}
            className="flex items-center gap-3 rounded-xl p-2.5 transition-all hover:brightness-125"
            style={{
              background: `linear-gradient(160deg, ${color}40 0%, ${color}1a 100%)`,
              border: `1px solid ${color}`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* Эмодзи */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center"
              style={{
                fontSize: '22px',
                lineHeight: 1,
              }}
            >
              {prize.emoji}
            </div>

            {/* Название */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{prize.display_name}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default WheelLegend;
