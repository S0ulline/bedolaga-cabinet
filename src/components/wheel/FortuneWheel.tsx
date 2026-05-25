import { useEffect, useLayoutEffect, useRef, useState, memo } from 'react';
import type { WheelPrize } from '../../api/wheel';

interface FortuneWheelProps {
  prizes: WheelPrize[];
  isSpinning: boolean;
  targetRotation: number | null;
  onSpinComplete: () => void;
}

// Геометрия вертикального барабана.
// ITEM_HEIGHT — шаг сетки слотов, по которому считается математика спина.
// Не менять — визуальный gap создаётся через padding внутри слота.
const ITEM_HEIGHT = 96;
const SLOT_GAP = 8;
const VISIBLE_ITEMS = 3; // центр = выигрыш
const REPEAT_COUNT = 30;
const FULL_CYCLES = 6;

// Фиолетовая палитра в тон UI
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

// Дефолтные акцентные цвета (фиолетовые) — для idle и spinning состояний
const DEFAULT_ACCENT = '#A855F7';
const DEFAULT_ACCENT_LIGHT = '#C084FC';
const DEFAULT_ACCENT_PALE = '#E9D5FF';

const getPrizeColor = (index: number, baseColor?: string) =>
  baseColor || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

/** Смешивает hex-цвет с белым на amount (0..1) — даёт «светлую» вариацию. */
const lighten = (hex: string, amount: number): string => {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`;
};

/** HEX → "r, g, b" для rgba(...) */
const hexToRgb = (hex: string): string => {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

const FortuneWheel = memo(function FortuneWheel({
                                                  prizes,
                                                  isSpinning,
                                                  targetRotation,
                                                  onSpinComplete,
                                                }: FortuneWheelProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  const middleOffset =
    prizes.length > 0 ? Math.floor(REPEAT_COUNT / 2) * prizes.length * ITEM_HEIGHT : 0;

  const accumulatedOffset = useRef(middleOffset);
  const [displayOffset, setDisplayOffset] = useState(middleOffset);
  const [winFlash, setWinFlash] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);

  // Защита от двойного запуска: запоминаем targetRotation, для которого
  // уже стартовал спин. Если useEffect триггернётся снова с тем же значением
  // (например, родитель пересоздал onSpinComplete) — игнорируем.
  // null = сейчас спин не идёт.
  const activeSpinRotation = useRef<number | null>(null);

  // Флаг: только что нормализовали смещение → следующий рендер без анимации.
  const skipNextTransition = useRef(false);

  // Свежий ref на onSpinComplete — чтобы не триггерить useEffect его пересозданием.
  const onSpinCompleteRef = useRef(onSpinComplete);
  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
  }, [onSpinComplete]);

  // ── ЗАПУСК СПИНА ──
  useEffect(() => {
    if (!isSpinning || targetRotation === null || prizes.length === 0) return;
    // Если для этого же targetRotation спин уже запущен — пропускаем.
    if (activeSpinRotation.current === targetRotation) return;

    activeSpinRotation.current = targetRotation;
    setWinFlash(false);
    setWinnerIndex(null);

    const sectorAngle = 360 / prizes.length;
    // Сервер возвращает угол поворота колеса по часовой стрелке.
    // Под указателем оказывается сектор, противоположный направлению вращения.
    const normalizedAngle = (((360 - targetRotation) % 360) + 360) % 360;
    const targetIndex = Math.floor(normalizedAngle / sectorAngle) % prizes.length;
    const totalItems = prizes.length;

    const currentItemPos = accumulatedOffset.current / ITEM_HEIGHT;
    const currentIndexMod = ((Math.round(currentItemPos) % totalItems) + totalItems) % totalItems;

    let deltaItems = targetIndex - currentIndexMod;
    if (deltaItems < 0) deltaItems += totalItems;

    const newItemPos = currentItemPos + FULL_CYCLES * totalItems + deltaItems;
    const newOffset = newItemPos * ITEM_HEIGHT;

    accumulatedOffset.current = newOffset;
    setDisplayOffset(newOffset);

    const spinTimeout = setTimeout(() => {
      setWinnerIndex(targetIndex);
      setWinFlash(true);
      activeSpinRotation.current = null;
      onSpinCompleteRef.current();

      // Нормализация смещения к середине ленты без визуального скачка.
      setTimeout(() => {
        const period = totalItems * ITEM_HEIGHT;
        const driftFromMiddle = accumulatedOffset.current - middleOffset;
        const periodsToShift = Math.round(driftFromMiddle / period);

        if (periodsToShift !== 0) {
          const normalized = accumulatedOffset.current - periodsToShift * period;
          skipNextTransition.current = true;
          accumulatedOffset.current = normalized;
          setDisplayOffset(normalized);
        }
      }, 0);
    }, 5000);

    return () => {
      // ВАЖНО: при cleanup НЕ сбрасываем activeSpinRotation и НЕ чистим таймер.
      // Если useEffect просто переоценился (родитель перерендерился) — таймер
      // должен продолжать тикать, иначе onSpinComplete никогда не вызовется
      // и кнопка зависнет. Cleanup при анмаунте компонента — мы и так не хотим
      // вызывать setState после размонтирования, но spinTimeout сам отработает
      // и React просто проигнорирует setState на размонтированном компоненте
      // (выдаст ворнинг, но это безопаснее, чем зависший спин).
      // Делаем cleanup пустым специально.
      void spinTimeout;
    };
  }, [isSpinning, targetRotation, prizes.length, middleOffset]);

  // После рендера сбрасываем флаг пропуска анимации
  useLayoutEffect(() => {
    if (skipNextTransition.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          skipNextTransition.current = false;
        });
      });
    }
  }, [displayOffset]);

  // Win-эффект гаснет через 2.4s
  useEffect(() => {
    if (!winFlash) return;
    const t = setTimeout(() => setWinFlash(false), 3000);
    return () => clearTimeout(t);
  }, [winFlash]);

  if (prizes.length === 0) {
    return (
      <div
        className="mx-auto flex w-full items-center justify-center"
        style={{ height: `${ITEM_HEIGHT * VISIBLE_ITEMS}px` }}
      >
        <p className="text-sm text-neutral-500">No prizes configured</p>
      </div>
    );
  }

  const stripItems = Array.from({ length: REPEAT_COUNT }, () => prizes).flat();
  const stripHeight = stripItems.length * ITEM_HEIGHT;
  const viewportHeight = VISIBLE_ITEMS * ITEM_HEIGHT;

  const baseShift = (viewportHeight - ITEM_HEIGHT) / 2;
  const translateY = baseShift - displayOffset;

  const stripTransition =
    isSpinning && !skipNextTransition.current
      ? 'transform 5s cubic-bezier(0.15, 0.6, 0.1, 1)'
      : 'none';

  // ── АКЦЕНТНЫЕ ЦВЕТА ──
  // При winFlash переключаемся на цвет приза, иначе — дефолтный фиолет.
  const winnerBase =
    winFlash && winnerIndex !== null
      ? getPrizeColor(winnerIndex, prizes[winnerIndex]?.color)
      : DEFAULT_ACCENT;
  const accent = winnerBase;
  const accentLight = winFlash ? lighten(winnerBase, 0.35) : DEFAULT_ACCENT_LIGHT;
  const accentPale = winFlash ? lighten(winnerBase, 0.7) : DEFAULT_ACCENT_PALE;
  const accentRgb = hexToRgb(accent);
  const accentLightRgb = hexToRgb(accentLight);

  return (
    <div
      className="relative w-full select-none"
      style={
        {
          ['--accent' as string]: accent,
          ['--accent-light' as string]: accentLight,
          ['--accent-pale' as string]: accentPale,
          ['--accent-rgb' as string]: accentRgb,
          ['--accent-light-rgb' as string]: accentLightRgb,
        } as React.CSSProperties
      }
    >
      <style>
        {`
          @keyframes nunkArrowPulse {
            0%, 100% { opacity: 0.7; transform: translateY(-50%) translateX(0); }
            50% { opacity: 1; transform: translateY(-50%) translateX(var(--nudge, 2px)); }
          }
          @keyframes nunkWinFlash {
            0% { opacity: 0; transform: scale(0.95); }
            15% { opacity: 1; transform: scale(1.02); }
            100% { opacity: 0; transform: scale(1.08); }
          }
          @keyframes nunkWinGlow {
            0%, 100% {
              box-shadow:
                inset 0 0 30px rgba(var(--accent-rgb), 0.4),
                0 0 30px rgba(var(--accent-rgb), 0.5);
            }
            50% {
              box-shadow:
                inset 0 0 50px rgba(var(--accent-light-rgb), 0.65),
                0 0 60px rgba(var(--accent-light-rgb), 0.75);
            }
          }
          @keyframes nunkSparkle {
            0% { transform: translate(0, 0) scale(0); opacity: 1; }
            100% {
              transform: translate(var(--dx), var(--dy)) scale(1);
              opacity: 0;
            }
          }
          .nunk-arrow { animation: nunkArrowPulse 2.4s ease-in-out infinite; }
          .nunk-arrow-spinning { animation: nunkArrowPulse 0.5s ease-in-out infinite; }
          .nunk-win-glow { animation: nunkWinGlow 1.2s ease-in-out infinite; }
          .nunk-win-flash { animation: nunkWinFlash 1.2s ease-out forwards; }
          .nunk-sparkle { animation: nunkSparkle 1.4s cubic-bezier(0.2, 0.7, 0.3, 1) forwards; }
        `}
      </style>

      {/* Внешнее свечение — окрашивается в акцентный цвет */}
      <div
        className={`pointer-events-none absolute inset-[-24px] ${
          isSpinning || winFlash ? 'opacity-100' : 'opacity-60'
        }`}
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(var(--accent-rgb), 0.3) 0%, rgba(var(--accent-rgb), 0.13) 50%, transparent 75%)',
          filter: 'blur(34px)',
          transition: 'opacity 0.5s ease, background 0.4s ease',
        }}
      />

      {/* Корпус барабана — обводка корпуса в акцентном цвете */}
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{
          height: `${viewportHeight}px`,
          background: 'linear-gradient(180deg, #0f0a1f 0%, #1a1230 50%, #0f0a1f 100%)',
          boxShadow:
            'inset 0 1px 0 rgba(var(--accent-light-rgb), 0.2), 0 20px 50px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(var(--accent-rgb), 0.55)',
          transition: 'box-shadow 0.4s ease',
        }}
      >
        {/* Подсветка центральной зоны */}
        <div
          className={`pointer-events-none absolute left-0 right-0 z-0 h-full ${
            winFlash ? 'nunk-win-glow' : ''
          }`}
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(var(--accent-rgb), 0.22) 0%, transparent 70%)',
            transition: 'background 0.4s ease',
          }}
        />

        {/* Лента призов */}
        <div
          ref={stripRef}
          className="absolute left-0 top-0 w-full will-change-transform"
          style={{
            height: `${stripHeight}px`,
            transform: `translate3d(0, ${translateY}px, 0)`,
            transition: stripTransition,
          }}
        >
          {stripItems.map((prize, index) => {
            const localIndex = index % prizes.length;
            const color = getPrizeColor(localIndex, prize.color);
            const name =
              (prize as { display_name?: string; name?: string }).display_name ??
              (prize as { name?: string }).name ??
              `Prize ${localIndex + 1}`;

            return (
              <div
                key={`item-${index}`}
                className="flex items-center px-4"
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  paddingTop: `${SLOT_GAP / 2}px`,
                  paddingBottom: `${SLOT_GAP / 2}px`,
                }}
              >
                <div
                  className="flex h-full w-full flex-row items-center justify-center gap-1.5 rounded-xl p-2"
                  style={{
                    background: `linear-gradient(160deg, ${color}40 0%, ${color}1a 100%)`,
                    border: `1px solid ${color}`,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{ fontSize: '30px', lineHeight: 1 }}
                  >
                    {prize.emoji}
                  </div>
                  <span className="max-w-[80%] truncate text-sm font-medium text-white">
                    {name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Затухание сверху/снизу */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10"
          style={{
            height: `${baseShift}px`,
            background:
              'linear-gradient(180deg, rgba(15, 10, 31, 0.92) 0%, rgba(15, 10, 31, 0.55) 60%, transparent 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
          style={{
            height: `${baseShift}px`,
            background:
              'linear-gradient(0deg, rgba(15, 10, 31, 0.92) 0%, rgba(15, 10, 31, 0.55) 60%, transparent 100%)',
          }}
        />

        {/* Левая стрелка — градиент в акцентном цвете */}
        <div
          className={`pointer-events-none absolute left-1 z-30 ${
            isSpinning ? 'nunk-arrow-spinning' : 'nunk-arrow'
          }`}
          style={
            {
              top: `${baseShift + ITEM_HEIGHT / 2}px`,
              transform: 'translateY(-50%)',
              ['--nudge' as string]: '4px',
            } as React.CSSProperties
          }
        >
          <svg width="20" height="26" viewBox="0 0 20 26" fill="none">
            <defs>
              <linearGradient id="nunkArrowLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                {/* stop-color через CSS-style, чтобы он реагировал на смену акцента
                    с плавным transition. Атрибут stop-color этого не умеет. */}
                <stop offset="0%" style={{ stopColor: accent, transition: 'stop-color 0.4s ease' }} />
                <stop offset="50%" style={{ stopColor: accentLight, transition: 'stop-color 0.4s ease' }} />
                <stop offset="100%" style={{ stopColor: accentPale, transition: 'stop-color 0.4s ease' }} />
              </linearGradient>
              <filter id="nunkArrowLeftGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feFlood floodColor={accentLight} floodOpacity="0.9" />
                <feComposite in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M18 13 L2 2 L6 13 L2 24 Z"
              fill="url(#nunkArrowLeftGrad)"
              filter="url(#nunkArrowLeftGlow)"
            />
          </svg>
        </div>

        {/* Правая стрелка */}
        <div
          className={`pointer-events-none absolute right-1 z-30 ${
            isSpinning ? 'nunk-arrow-spinning' : 'nunk-arrow'
          }`}
          style={
            {
              top: `${baseShift + ITEM_HEIGHT / 2}px`,
              transform: 'translateY(-50%)',
              ['--nudge' as string]: '-4px',
            } as React.CSSProperties
          }
        >
          <svg width="20" height="26" viewBox="0 0 20 26" fill="none">
            <defs>
              <linearGradient id="nunkArrowRightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: accent, transition: 'stop-color 0.4s ease' }} />
                <stop offset="50%" style={{ stopColor: accentLight, transition: 'stop-color 0.4s ease' }} />
                <stop offset="100%" style={{ stopColor: accentPale, transition: 'stop-color 0.4s ease' }} />
              </linearGradient>
              <filter id="nunkArrowRightGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feFlood floodColor={accentLight} floodOpacity="0.9" />
                <feComposite in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M2 13 L18 2 L14 13 L18 24 Z"
              fill="url(#nunkArrowRightGrad)"
              filter="url(#nunkArrowRightGlow)"
            />
          </svg>
        </div>

        {/* Верхний блик корпуса — в акцентном цвете */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(var(--accent-light-rgb), 0.6) 50%, transparent 100%)',
            transition: 'background 0.4s ease',
          }}
        />

        {/* WIN-эффект: вспышка в акцентном цвете */}
        {winFlash && (
          <div
            className="nunk-win-flash pointer-events-none absolute left-3 right-3 z-40 rounded-xl"
            style={{
              top: `${baseShift}px`,
              height: `${ITEM_HEIGHT}px`,
              background:
                'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(var(--accent-light-rgb), 0.4) 40%, transparent 75%)',
            }}
          />
        )}

        {/* WIN-эффект: частицы из палитры цвета приза */}
        {winFlash && winnerIndex !== null && (
          <div
            className="pointer-events-none absolute left-1/2 z-40"
            style={{
              top: `${baseShift + ITEM_HEIGHT / 2}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i / 16) * Math.PI * 2;
              const distance = 90 + (i % 3) * 25;
              const dx = Math.cos(angle) * distance;
              const dy = Math.sin(angle) * distance;
              // Палитра конфетти строится из акцентного цвета + один тёплый блик
              const palette = [accent, accentLight, accentPale, '#FDE68A'];
              const dotColor = palette[i % palette.length];
              return (
                <div
                  key={`spark-${i}`}
                  className="nunk-sparkle absolute h-1.5 w-1.5 rounded-full"
                  style={
                    {
                      background: dotColor,
                      boxShadow: `0 0 6px ${dotColor}`,
                      animationDelay: `${(i % 4) * 0.05}s`,
                      '--dx': `${dx}px`,
                      '--dy': `${dy}px`,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default FortuneWheel;