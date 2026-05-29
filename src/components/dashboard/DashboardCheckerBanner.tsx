import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { checkerApi } from '../../api/checker';
import { useTranslation } from 'react-i18next';

const ChevronRightIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

// Баннер статуса серверов для Dashboard.
// Использует тот же queryKey что и MetricsPage — данные шарятся из одного кэша React Query.
// Запрос делается максимум раз в 2 минуты на всё приложение.
export default function ServerStatusBanner() {
  const { data: proxies, isLoading } = useQuery({
    queryKey: ['checker-proxies'],
    queryFn: checkerApi.getProxies,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    // На дашборде грузим только если страница уже открыта,
    // не блокируем рендер — suspend: false
    retry: 1,
  });

  // Пока грузится — показываем нейтральный вариант
  const total = proxies?.length ?? 0;
  const online = proxies?.filter((p) => p.online).length ?? 0;
  const allOnline = !isLoading && proxies && online === total;

  const { t } = useTranslation();

  // Цвет индикатора
  const dotColor = isLoading ? 'bg-dark-500' : allOnline ? 'bg-success-500' : 'bg-warning-500';

  // Текст
  const statusText = isLoading
    ? t('metrics.checkServers', 'Проверяем серверы...')
    : allOnline
      ? t('metrics.allOnline', 'Все серверы работают исправно')
      : t('metrics.someOffline', 'Некоторые из серверов недоступны. Уже исправляем');

  return (
    <Link
      to="/checker"
      className="bento-card-hover group flex items-center justify-between rounded-xl border border-white/5 bg-dark-800/30 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center">
          {!isLoading && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotColor}`}
            />
          )}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotColor}`} />
        </div>
        <span className="text-sm font-medium text-dark-100">{statusText}</span>
      </div>
      <div className="text-dark-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent-400">
        <ChevronRightIcon />
      </div>
    </Link>
  );
}
