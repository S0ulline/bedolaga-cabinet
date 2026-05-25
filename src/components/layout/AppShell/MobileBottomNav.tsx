import { useRef, useLayoutEffect, useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { usePlatform } from '@/platform';

import { HomeIcon, SubscriptionIcon, WalletIcon, UsersIcon, ChatIcon, WheelIcon } from './icons';

interface MobileBottomNavProps {
  isKeyboardOpen: boolean;
  referralEnabled?: boolean;
  wheelEnabled?: boolean;
}

const SPRING = { type: 'spring', stiffness: 380, damping: 30 } as const;
// Отступ таблетки за пределы Link с каждой стороны
const PILL_INSET = 5;

function getScale(width: number) {
  if (width < 360) return { iconSize: 22, fontSize: 9, py: 6, px: 4, shell: 4, inset: 12 };
  if (width < 390) return { iconSize: 24, fontSize: 10, py: 7, px: 5, shell: 5, inset: 14 };
  return { iconSize: 26, fontSize: 10, py: 8, px: 6, shell: 5, inset: 14 };
}

function useScreenWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 390,
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

export function MobileBottomNav({
  isKeyboardOpen,
  referralEnabled,
  wheelEnabled,
}: MobileBottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { haptic } = usePlatform();

  const screenWidth = useScreenWidth();
  const scale = useMemo(() => getScale(screenWidth), [screenWidth]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const coreItems = useMemo(
    () => [
      { path: '/', labelKey: 'nav.dashboard', icon: HomeIcon },
      { path: '/subscriptions', labelKey: 'nav.subscription', icon: SubscriptionIcon },
      { path: '/balance', labelKey: 'nav.balance', icon: WalletIcon },
      ...(referralEnabled
        ? [{ path: '/referral', labelKey: 'nav.referral', icon: UsersIcon }]
        : []),
      ...(wheelEnabled
        ? [{ path: '/wheel', labelKey: 'nav.wheel', icon: WheelIcon }]
        : [{ path: '/support', labelKey: 'nav.support', icon: ChatIcon }]),
    ],
    [referralEnabled, wheelEnabled],
  );

  const activeIndex = coreItems.findIndex((item) => isActive(item.path));

  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pillRect, setPillRect] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const el = itemRefs.current[activeIndex];
    const container = el?.parentElement;
    if (!el || !container) return;

    // Границы внутри shell — таблетка не выходит за padding острова
    const minLeft = scale.shell;
    const maxRight = container.offsetWidth - scale.shell;

    const rawLeft = el.offsetLeft - PILL_INSET;
    const rawRight = el.offsetLeft + el.offsetWidth + PILL_INSET;

    const left = Math.max(minLeft, rawLeft);
    const right = Math.min(maxRight, rawRight);

    setPillRect({ left, width: right - left });
  }, [activeIndex, coreItems.length, scale.iconSize, scale.shell]);

  return (
    <motion.nav
      className="fixed z-50 lg:hidden"
      style={{
        bottom: `calc(max(${scale.inset}px, env(safe-area-inset-bottom, 0px)))`,
        left: `${scale.inset}px`,
        right: `${scale.inset}px`,
      }}
      animate={{ opacity: isKeyboardOpen ? 0 : 1, y: isKeyboardOpen ? 8 : 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      aria-hidden={isKeyboardOpen}
    >
      <div
        className="relative flex w-full items-center rounded-full bg-dark-900 bg-opacity-80 backdrop-blur-md"
        style={{
          padding: `${scale.shell}px ${scale.shell * 2}px`,
          border: '0.5px solid rgba(255,255,255,0.07)',
          boxShadow:
            '0 12px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35), inset 0 0.5px 0 rgba(255,255,255,0.05)',
        }}
      >
        <AnimatePresence>
          {pillRect && (
            <motion.div
              className="absolute rounded-full bg-accent-500/15"
              style={{
                top: `${scale.shell}px`,
                bottom: `${scale.shell}px`,
              }}
              initial={false}
              animate={{ left: pillRect.left, width: pillRect.width }}
              transition={SPRING}
            />
          )}
        </AnimatePresence>

        {coreItems.map((item, i) => {
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              to={item.path}
              onClick={() => haptic.impact('light')}
              aria-current={active ? 'page' : undefined}
              // flex-1 — каждый пункт занимает равную долю острова
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-full"
              style={{
                paddingTop: `${scale.py}px`,
                paddingBottom: `${scale.py - 1}px`,
                paddingLeft: `${scale.px}px`,
                paddingRight: `${scale.px}px`,
              }}
            >
              <motion.div>
                <div style={{ width: scale.iconSize, height: scale.iconSize }}>
                  <item.icon
                    className={cn(
                      'h-full w-full shrink-0 transition-colors duration-150',
                      active ? 'text-accent-400' : 'text-dark-500 hover:text-dark-300',
                    )}
                  />
                </div>
              </motion.div>

              <span
                className={cn(
                  'w-full truncate text-center font-semibold leading-none tracking-[0.01em] transition-colors duration-150',
                  active ? 'text-accent-400' : 'text-dark-500 hover:text-dark-300',
                )}
                style={{ fontSize: `${scale.fontSize}px` }}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
