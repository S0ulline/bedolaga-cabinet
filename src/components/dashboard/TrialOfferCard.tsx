import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { UseMutationResult } from '@tanstack/react-query';
import type { TrialInfo } from '../../types';
import { useCurrency } from '../../hooks/useCurrency';
import { useTheme } from '../../hooks/useTheme';
import { getGlassColors } from '../../utils/glassTheme';

interface TrialOfferCardProps {
  trialInfo: TrialInfo;
  balanceKopeks: number;
  balanceRubles: number;
  activateTrialMutation: UseMutationResult<unknown, unknown, void, unknown>;
  trialError: string | null;
}

export default function TrialOfferCard({
  trialInfo,
  balanceKopeks,
  balanceRubles,
  activateTrialMutation,
  trialError,
}: TrialOfferCardProps) {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();
  const { isDark } = useTheme();
  const g = getGlassColors(isDark);
  const isFree = !trialInfo.requires_payment;
  const canAfford = balanceKopeks >= trialInfo.price_kopeks;

  return (
    <div
      className="relative overflow-hidden rounded-3xl text-center"
      style={{
        background: g.cardBg,
        border: isDark
          ? `1px solid ${g.cardBorder}`
          : isFree
            ? '1px solid rgba(var(--color-accent-400), 0.2)'
            : '1px solid rgba(255,184,0,0.2)',
        boxShadow: isDark
          ? g.shadow
          : isFree
            ? '0 2px 16px rgba(var(--color-accent-400), 0.12), 0 0 0 1px rgba(var(--color-accent-400), 0.06)'
            : '0 2px 16px rgba(255,184,0,0.12), 0 0 0 1px rgba(255,184,0,0.06)',
        padding: '32px 28px 28px',
      }}
    >
      {/* Animated glow background */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: isFree
            ? 'radial-gradient(circle, rgba(var(--color-accent-400), 0.08) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255,184,0,0.07) 0%, transparent 70%)',
          transition: 'background 0.5s ease',
        }}
        aria-hidden="true"
      />
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: isDark ? 0.025 : 0.04,
          backgroundImage: isDark
            ? `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`
            : `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
               linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      {/* Icon */}
      <div
        className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: isDark
            ? isFree
              ? 'linear-gradient(135deg, rgba(var(--color-accent-900), 0.5), rgba(var(--color-accent-950), 0.6))'
              : 'linear-gradient(135deg, #3a3020, #282418)'
            : isFree
              ? 'linear-gradient(135deg, rgba(var(--color-accent-400), 0.15), rgba(var(--color-accent-400), 0.08))'
              : 'linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,184,0,0.08))',
          border: isFree
            ? '1px solid rgba(var(--color-accent-400), 0.25)'
            : '1px solid rgba(255,184,0,0.25)',
          transition: 'all 0.5s ease',
        }}
      >
        {isFree ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="26"
            height="26"
            viewBox="0 0 50 50"
            fill="rgb(var(--color-accent-400))"
          >
            <path d="M22.462 11.035l2.88 7.097c1.204 2.968 3.558 5.322 6.526 6.526l7.097 2.88c1.312.533 1.312 2.391 0 2.923l-7.097 2.88c-2.968 1.204-5.322 3.558-6.526 6.526l-2.88 7.097c-.533 1.312-2.391 1.312-2.923 0l-2.88-7.097c-1.204-2.968-3.558-5.322-6.526-6.526l-7.097-2.88c-1.312-.533-1.312-2.391 0-2.923l7.097-2.88c2.968-1.204 5.322-3.558 6.526-6.526l2.88-7.097C20.071 9.723 21.929 9.723 22.462 11.035zM39.945 2.701l.842 2.428c.664 1.915 2.169 3.42 4.084 4.084l2.428.842c.896.311.896 1.578 0 1.889l-2.428.842c-1.915.664-3.42 2.169-4.084 4.084l-.842 2.428c-.311.896-1.578.896-1.889 0l-.842-2.428c-.664-1.915-2.169-3.42-4.084-4.084l-2.428-.842c-.896-.311-.896-1.578 0-1.889l2.428-.842c1.915-.664 3.42-2.169 4.084-4.084l.842-2.428C38.366 1.805 39.634 1.805 39.945 2.701z"></path>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 640 640"
            fill="#FFB800"
          >
            <path d="M434.8 54.1C446.7 62.7 451.1 78.3 445.7 91.9L367.3 288L512 288C525.5 288 537.5 296.4 542.1 309.1C546.7 321.8 542.8 336 532.5 344.6L244.5 584.6C233.2 594 217.1 594.5 205.2 585.9C193.3 577.3 188.9 561.7 194.3 548.1L272.7 352L128 352C114.5 352 102.5 343.6 97.9 330.9C93.3 318.2 97.2 304 107.5 295.4L395.5 55.4C406.8 46 422.9 45.5 434.8 54.1z" />
          </svg>
        )}
        {/* Glow effect */}
        <div
          className="absolute inset-[-1px] animate-trial-glow rounded-2xl"
          style={{
            boxShadow: isFree
              ? '0 0 20px rgba(var(--color-accent-400), 0.15)'
              : '0 0 20px rgba(255,184,0,0.12)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h2 className="mb-1.5 text-[22px] font-bold tracking-tight text-dark-50">
        {isFree ? t('dashboard.trialOffer.freeTitle') : t('dashboard.trialOffer.paidTitle')}
      </h2>
      <p className="mb-5 text-sm text-dark-50/40">
        {isFree ? t('dashboard.trialOffer.freeDesc') : t('dashboard.trialOffer.paidDesc')}
      </p>

      {/* Price tag for paid trial */}
      {!isFree && trialInfo.price_rubles > 0 && (
        <div
          className="mb-5 inline-flex items-baseline gap-1 rounded-xl px-5 py-2"
          style={{
            background: 'rgba(255,184,0,0.08)',
            border: '1px solid rgba(255,184,0,0.15)',
          }}
        >
          <span
            className="text-[32px] font-extrabold leading-none tracking-tight"
            style={{ color: '#FFB800' }}
          >
            {trialInfo.price_rubles.toFixed(0)}
          </span>
          <span className="text-base font-semibold opacity-70" style={{ color: '#FFB800' }}>
            {currencySymbol}
          </span>
        </div>
      )}

      {/* Trial stats */}
      <div className="mb-7 flex justify-center gap-8">
        {[
          { value: String(trialInfo.duration_days), label: t('subscription.trial.days') },
          {
            value: trialInfo.traffic_limit_gb === 0 ? '∞' : String(trialInfo.traffic_limit_gb),
            label: t('common.units.gb'),
          },
          {
            value: trialInfo.device_limit === 0 ? '∞' : String(trialInfo.device_limit),
            label: t('subscription.trial.devices'),
          },
        ].map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-4xl font-extrabold leading-none tracking-tight text-dark-50">
              {stat.value}
            </div>
            <div className="mt-1 text-xs font-medium text-dark-50/30">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Balance info for paid trial */}
      {!isFree && trialInfo.price_rubles > 0 && (
        <div
          className="mb-4 space-y-2 rounded-xl p-4 text-left"
          style={{ background: g.innerBg, border: `1px solid ${g.innerBorder}` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-dark-50/40">{t('balance.currentBalance')}</span>
            <span
              className={`font-display text-sm font-semibold ${canAfford ? 'text-success-400' : 'text-warning-400'}`}
            >
              {formatAmount(balanceRubles)} {currencySymbol}
            </span>
          </div>
          {!canAfford && (
            <div className="text-xs text-warning-400">
              {t('subscription.trial.insufficientBalance')}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {trialError && (
        <div className="mb-4 rounded-xl border border-error-500/30 bg-error-500/10 p-3 text-center text-sm text-error-400">
          {trialError}
        </div>
      )}

      {/* CTA Button */}
      {!isFree && trialInfo.price_kopeks > 0 ? (
        canAfford ? (
          <button
            onClick={() => !activateTrialMutation.isPending && activateTrialMutation.mutate()}
            disabled={activateTrialMutation.isPending}
            className="w-full rounded-[14px] py-4 text-base font-bold tracking-tight transition-all duration-300 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #FFB800, #FF8C42)',
              color: '#1a1200',
              boxShadow: '0 4px 20px rgba(255,184,0,0.2)',
            }}
          >
            {activateTrialMutation.isPending
              ? t('common.loading')
              : t('subscription.trial.payAndActivate')}
          </button>
        ) : (
          <Link
            to="/balance"
            className="block w-full rounded-[14px] py-4 text-center text-base font-bold tracking-tight transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #FFB800, #FF8C42)',
              color: '#1a1200',
              boxShadow: '0 4px 20px rgba(255,184,0,0.2)',
            }}
          >
            {t('subscription.trial.topUpToActivate')}
          </Link>
        )
      ) : (
        <button
          onClick={() => !activateTrialMutation.isPending && activateTrialMutation.mutate()}
          disabled={activateTrialMutation.isPending}
          className="w-full rounded-[14px] py-4 text-base font-bold tracking-tight transition-all duration-300 disabled:opacity-50"
          style={
            isDark
              ? {
                  background:
                    'linear-gradient(135deg, rgba(var(--color-accent-400), 0.12) 0%, rgba(var(--color-accent-400), 0.04) 100%)',
                  border: '1px solid rgba(var(--color-accent-400), 0.25)',
                  color: '#fff',
                }
              : {
                  background:
                    'linear-gradient(135deg, rgb(var(--color-accent-400)), rgb(var(--color-accent-500)))',
                  color: '#0a2a1e',
                  boxShadow: '0 4px 20px rgba(var(--color-accent-400), 0.25)',
                }
          }
        >
          {activateTrialMutation.isPending ? t('common.loading') : t('subscription.trial.activate')}
        </button>
      )}
    </div>
  );
}
