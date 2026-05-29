import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { checkerApi, type ProxyStatus } from '../api/checker';

// ── КОНСТАНТЫ ─────────────────────────────────────────────────────────────────

// Кэш 2 минуты — все пользователи в браузере получают одни данные без нового запроса.
// Для межпользовательского кэша настрой Cache-Control: public, max-age=120 на стороне
// xray-checker (nginx/caddy) — тогда браузерный HTTP-кэш тоже будет работать.
const CACHE_MS = 2 * 60 * 1000;

// ── ИКОНКИ ────────────────────────────────────────────────────────────────────

const ChevronLeftIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const RefreshIcon = ({ spinning }: { spinning?: boolean }) => (
  <svg
    className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

// ── ХЕЛПЕРЫ ───────────────────────────────────────────────────────────────────

const getLatencyColor = (online: boolean, latencyMs: number): string => {
  if (!online || latencyMs === 0) return 'text-dark-400';
  if (latencyMs < 500) return 'text-success-400';
  if (latencyMs < 1000) return 'text-warning-400';
  return 'text-error-400';
};

const getLatencyBg = (online: boolean, latencyMs: number): string => {
  if (!online || latencyMs === 0) return 'border-white/5 bg-dark-800/30';
  if (latencyMs < 500) return 'border-success-500/15 bg-success-500/5';
  if (latencyMs < 1000) return 'border-warning-500/15 bg-warning-500/5';
  return 'border-error-500/15 bg-error-500/5';
};

// Цвет одного «кирпичика» в мини-графике истории
const getBarColor = (item: { online: boolean; latencyMs: number }): string => {
  if (!item.online) return 'bg-dark-500/80';
  if (item.latencyMs < 500) return 'bg-success-500/80';
  if (item.latencyMs < 1000) return 'bg-warning-500/80';
  return 'bg-error-500/80';
};

// ── КОМПОНЕНТЫ ────────────────────────────────────────────────────────────────

// Мини-график из 30 столбиков — как на Statuspage/BetterUptime
function UptimeBar({ history }: { history: ProxyStatus['history'] }) {
  if (!history.length) return null;

  return (
    <div className="flex items-end gap-px" title="История последних 30 проверок">
      {history.map((item, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm transition-all ${getBarColor(item)}`}
          style={{
            // Высота пропорциональна пингу, мин 4px, макс 16px
            height: item.online
              ? `${Math.max(4, Math.min(16, Math.round((item.latencyMs / 1000) * 14) + 4))}px`
              : '6px',
          }}
          title={item.online ? `${item.latencyMs} ms` : 'Offline'}
        />
      ))}
    </div>
  );
}

// Карточка одного сервера
function ProxyCard({ proxy }: { proxy: ProxyStatus }) {
  const latencyColor = getLatencyColor(proxy.online, proxy.latencyMs);
  const cardStyle = getLatencyBg(proxy.online, proxy.latencyMs);

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-2xl border p-4 transition-all ${cardStyle} ${
        !proxy.online ? 'opacity-60' : ''
      }`}
    >
      {/* Верхняя строка: флаг + название + пинг */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
            {proxy.countryCode ? (
              <span
                className={`fi fis fi-${proxy.countryCode}`}
                style={{ display: 'block', width: '100%', height: '100%', backgroundSize: 'cover' }}
                title={proxy.cleanName}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-white/5 text-xl">
                {proxy.flag}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-dark-50" title={proxy.cleanName}>
              {proxy.cleanName}
            </h3>
            <p className="text-xs text-dark-500">{proxy.uptimePercent}% uptime</p>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          {proxy.online ? (
            <span className={`font-mono text-sm font-bold ${latencyColor}`}>
              {proxy.latencyMs} <span className="text-[10px] font-normal text-dark-400">ms</span>
            </span>
          ) : (
            <span className="rounded-full bg-error-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-error-400">
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Мини-график истории */}
      <div className="flex items-center justify-between gap-3">
        <UptimeBar history={proxy.history} />
        <span className="flex-shrink-0 text-[10px] text-dark-500">avg {proxy.avgLatencyMs} ms</span>
      </div>
    </div>
  );
}

// Скелетон
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-dark-800/30 p-4">
      <div className="flex items-center gap-3">
        <div className="skeleton h-9 w-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-28 rounded" />
          <div className="skeleton h-2.5 w-16 rounded" />
        </div>
        <div className="skeleton h-4 w-12 rounded" />
      </div>
      <div className="skeleton h-4 w-full rounded" />
    </div>
  );
}

// ── ГЛАВНЫЙ КОМПОНЕНТ ─────────────────────────────────────────────────────────

export default function MetricsPage() {
  const { t } = useTranslation();

  const {
    data: proxies,
    isLoading,
    isError,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useQuery<ProxyStatus[]>({
    queryKey: ['checker-proxies'],
    queryFn: checkerApi.getProxies,
    staleTime: CACHE_MS,
    refetchInterval: CACHE_MS,
    // Не рефетчить при фокусе окна — данные и так обновляются по интервалу
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Сводная статистика
  const stats = proxies
    ? {
        total: proxies.length,
        online: proxies.filter((p) => p.online).length,
        avgLatency: (() => {
          const online = proxies.filter((p) => p.online && p.latencyMs > 0);
          if (!online.length) return 0;
          return Math.round(online.reduce((s, p) => s + p.latencyMs, 0) / online.length);
        })(),
      }
    : null;

  const allOnline = stats && stats.online === stats.total;

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-6">
      {/* Хедер */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-dark-800/50 text-dark-400 transition-all hover:bg-dark-700 hover:text-dark-100"
        >
          <ChevronLeftIcon />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-dark-50 sm:text-2xl">
            {t('metrics.title', 'Статус серверов')}
          </h1>
          <p className="text-xs text-dark-400 sm:text-sm">
            {t('metrics.subtitle', 'Мониторинг доступности серверов')}
          </p>
        </div>
        {/* Кнопка ручного обновления */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-dark-800/50 text-dark-400 transition-all hover:bg-dark-700 hover:text-dark-100 disabled:opacity-40"
          title="Обновить"
        >
          <RefreshIcon spinning={isFetching} />
        </button>
      </div>

      {/* Состояние загрузки */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : isError || !proxies ? (
        <div className="rounded-2xl border border-error-500/20 bg-error-500/5 p-6 text-center">
          <p className="mb-3 text-sm font-medium text-error-400">
            {t('metrics.error', 'Не удалось загрузить данные о серверах')}
          </p>
          <button onClick={() => refetch()} className="text-xs text-accent-400 hover:underline">
            {t('common.retry', 'Попробовать снова')}
          </button>
        </div>
      ) : (
        <>
          {/* Общий статус-баннер */}
          <div
            className={`flex items-center gap-3 rounded-2xl border p-4 ${
              allOnline
                ? 'border-success-500/20 bg-success-500/5'
                : 'border-warning-500/20 bg-warning-500/5'
            }`}
          >
            <div className="relative flex h-3 w-3 flex-shrink-0">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  allOnline ? 'bg-success-500' : 'bg-warning-500'
                }`}
              />
              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${
                  allOnline ? 'bg-success-500' : 'bg-warning-500'
                }`}
              />
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${allOnline ? 'text-success-400' : 'text-warning-400'}`}
              >
                {allOnline
                  ? t('metrics.allOnline', 'Все серверы работают')
                  : t('metrics.someOffline', 'Некоторые из серверов недоступны. Уже исправляем')}
              </p>
              {updatedTime && (
                <p className="text-xs text-dark-500">
                  {t('metrics.updatedAt', 'Обновлено в')} {updatedTime}
                  {' · '}
                  {t('metrics.autoRefresh', 'авто-обновление каждые 2 мин')}
                </p>
              )}
            </div>
          </div>

          {/* Сводные цифры */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/5 bg-dark-800/30 p-4">
              <p className="text-xs font-medium text-dark-400">
                {t('metrics.stats.total', 'Всего')}
              </p>
              <p className="mt-1 text-xl font-bold text-dark-100">{stats?.total}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-dark-800/30 p-4">
              <p className="text-xs font-medium text-dark-400">
                {t('metrics.stats.online', 'В сети')}
              </p>
              <p className="mt-1 text-xl font-bold text-success-400">
                {stats?.online}
                <span className="text-xs font-normal text-dark-400"> / {stats?.total}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-dark-800/30 p-4">
              <p className="text-xs font-medium text-dark-400">
                {t('metrics.stats.latency', 'Ср. пинг')}
              </p>
              <p className="mt-1 text-xl font-bold text-accent-400">
                {stats?.avgLatency ? `${stats.avgLatency}` : '—'}
                {stats && stats.avgLatency > 0 && (
                  <span className="text-xs font-normal text-dark-400"> ms</span>
                )}
              </p>
            </div>
          </div>

          {/* Сетка серверов */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Сначала онлайн, потом офлайн */}
            {proxies.map((proxy) => (
              <ProxyCard key={proxy.stableId} proxy={proxy} />
            ))}
          </div>

          {/* Легенда графика */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/5 bg-dark-800/20 px-4 py-3">
            <span className="text-xs text-dark-500">{t('metrics.legend', 'График:')}</span>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-1.5 rounded-sm bg-success-500/80" />
              <span className="text-xs text-dark-400">&lt; 500 ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-1.5 rounded-sm bg-warning-500/80" />
              <span className="text-xs text-dark-400">500–1000 ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-1.5 rounded-sm bg-error-500/80" />
              <span className="text-xs text-dark-400">&gt; 1000 ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-1.5 rounded-sm bg-dark-500/80" />
              <span className="text-xs text-dark-400">
                {t('metrics.stats.offline', 'Недоступен')}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
