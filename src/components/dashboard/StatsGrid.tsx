import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useCurrency } from '../../hooks/useCurrency';
import { useTheme } from '../../hooks/useTheme';
import { getGlassColors } from '../../utils/glassTheme';
import { cn } from '@/lib/utils.ts';

interface StatsGridProps {
  balanceRubles: number;
  referralCount: number;
  earningsRubles: number;
  refLoading: boolean;
}

const ChevronIcon = ({ color }: { color: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    <path
      d="M6 4l4 4-4 4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function StatsGrid({
  balanceRubles,
  referralCount,
  earningsRubles,
  refLoading,
}: StatsGridProps) {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();
  const { isDark } = useTheme();
  const g = getGlassColors(isDark);

  const accentColor = 'rgb(var(--color-accent-400))';
  const accentBg = 'rgba(var(--color-accent-400), 0.07)';

  const cards = [
    {
      label: t('dashboard.stats.balance'),
      value: `${formatAmount(balanceRubles)} ${currencySymbol}`,
      valueColor: accentColor,
      to: '/balance',
      icon: (color: string) => (
        <svg width="16"
             height="16" fill={color} viewBox="0 0 640 640">
          <path d="M128 96C92.7 96 64 124.7 64 160L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 256C576 220.7 547.3 192 512 192L136 192C122.7 192 112 181.3 112 168C112 154.7 122.7 144 136 144L520 144C533.3 144 544 133.3 544 120C544 106.7 533.3 96 520 96L128 96zM480 320C497.7 320 512 334.3 512 352C512 369.7 497.7 384 480 384C462.3 384 448 369.7 448 352C448 334.3 462.3 320 480 320z" />
        </svg>
      ),
      iconBg: accentBg,
      iconColor: accentColor,
      loading: false,
      onboarding: 'balance',
    },
    {
      label: t('dashboard.stats.referrals'),
      value: `${referralCount}`,
      valueColor: g.text,
      subtitle: `+${formatAmount(earningsRubles)} ${currencySymbol}`,
      subtitleColor: accentColor,
      to: '/referral',
      icon: (color: string) => (
        <svg width="16"
             height="16" fill={color} viewBox="0 0 640 640">
          <path d="M320 80C377.4 80 424 126.6 424 184C424 241.4 377.4 288 320 288C262.6 288 216 241.4 216 184C216 126.6 262.6 80 320 80zM96 152C135.8 152 168 184.2 168 224C168 263.8 135.8 296 96 296C56.2 296 24 263.8 24 224C24 184.2 56.2 152 96 152zM0 480C0 409.3 57.3 352 128 352C140.8 352 153.2 353.9 164.9 357.4C132 394.2 112 442.8 112 496L112 512C112 523.4 114.4 534.2 118.7 544L32 544C14.3 544 0 529.7 0 512L0 480zM521.3 544C525.6 534.2 528 523.4 528 512L528 496C528 442.8 508 394.2 475.1 357.4C486.8 353.9 499.2 352 512 352C582.7 352 640 409.3 640 480L640 512C640 529.7 625.7 544 608 544L521.3 544zM472 224C472 184.2 504.2 152 544 152C583.8 152 616 184.2 616 224C616 263.8 583.8 296 544 296C504.2 296 472 263.8 472 224zM160 496C160 407.6 231.6 336 320 336C408.4 336 480 407.6 480 496L480 512C480 529.7 465.7 544 448 544L192 544C174.3 544 160 529.7 160 512L160 496z" />
        </svg>
      ),
      iconBg: g.trackBg,
      iconColor: g.textSecondary,
      loading: refLoading,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {cards.map((card, i) => (
        <Link
          key={i}
          to={card.to}
          className="group relative overflow-hidden rounded-[18px] transition-all duration-200"
          style={{
            background: g.cardBg,
            border: `1px solid ${g.cardBorder}`,
            boxShadow: g.shadow,
            padding: '18px 20px 20px',
          }}
          data-onboarding={card.onboarding}
        >
          {/* Top row: icon + label + arrow */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] transition-colors duration-500"
                style={{ background: card.iconBg }}
              >
                {card.icon(card.iconColor)}
              </div>
              <span className="text-[13px] font-medium text-dark-50/45">{card.label}</span>
            </div>
            <ChevronIcon color={g.textFaint} />
          </div>

          {/* Value */}
          {card.loading ? (
            <div className="skeleton h-8 w-20" />
          ) : (
            <>
              <div
                className="text-[28px] font-bold leading-tight tracking-tight transition-colors duration-500"
                style={{ color: card.valueColor }}
              >
                {card.value}
              </div>
              {card.subtitle && (
                <div
                  className="mt-0.5 text-[13px] font-semibold"
                  style={{ color: card.subtitleColor }}
                >
                  {card.subtitle}
                </div>
              )}
            </>
          )}
        </Link>
      ))}
    </div>
  );
}
