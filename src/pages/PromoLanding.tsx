import { useSearchParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
//import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { Card } from '@/components/data-display/Card';
import { Button } from '@/components/primitives/Button';
import { staggerContainer, staggerItem } from '@/components/motion/transitions';
import { useAuthStore } from '../store/auth';

// Импортируем API и типы (как в твоем админ-файле)
import { promocodesApi } from '../api/promocodes';

export default function PromoLanding() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const promocode = searchParams.get('promocode')?.trim() || '';

  // Получаем данные о конкретном промокоде.
  // Примечание: Убедись, что на бэкенде этот эндпоинт доступен без прав админа (публичный эндпоинт проверки).
  // Если публичного эндпоинта нет, ниже предусмотрен красивый fallback.
  const {
    data: promoInfo,
    isLoading,
    //isError,
  } = useQuery({
    queryKey: ['public-promocode', promocode],
    queryFn: () =>
      promocodesApi
        .getPromocodes({ limit: 100 })
        .then((res) => res.items.find((p) => p.code.toLowerCase() === promocode.toLowerCase())),
    enabled: !!promocode,
    staleTime: 10 * 60 * 1000, // Кэшируем на 10 минут
  });

  // Функция для генерации красивого описания бонуса
  const getPromoBonusText = () => {
    if (!promoInfo) return promocode;

    switch (promoInfo.type) {
      case 'balance':
        return `Пополнение баланса на +${promoInfo.balance_bonus_rubles} рублей`;
      case 'subscription_days':
        return `+${promoInfo.subscription_days} дней бесплатного доступа к VPN`;
      case 'trial_subscription':
        return `Пробный период на ${promoInfo.subscription_days} дней для новых пользователей`;
      case 'discount':
        return `Скидка ${promoInfo.balance_bonus_kopeks}% на подписку`;
      default:
        return `Специальный бонус по коду ${promocode}`;
    }
  };

  // Если в URL вообще забыли передать промокод
  if (!promocode) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <h2 className="text-xl font-bold text-dark-100">Упс! Промокод не найден</h2>
          <p className="mt-2 text-sm text-dark-400">
            Похоже, ссылка неполная. Перейдите в личный кабинет для управления балансом.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/balance')}>
            В личный кабинет
          </Button>
        </Card>
      </div>
    );
  }

  // Добавляем логику вычисления статуса перед рендером
  const isExhausted =
    promoInfo && promoInfo.max_uses > 0 && promoInfo.current_uses >= promoInfo.max_uses;
  const isExpired =
    promoInfo && promoInfo.valid_until && new Date(promoInfo.valid_until) < new Date();
  const isInactive = promoInfo && !promoInfo.is_active;

  const isPromoDead = isExhausted || isExpired || isInactive;

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md space-y-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Анимированное лого или иконка сверху */}
        <motion.div variants={staggerItem} className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-3xl shadow-lg shadow-accent-500/20">
            ✨
          </div>
          <h1 className="text-2xl font-black tracking-tight text-dark-50 sm:text-3xl">
            NUNK <span className="text-accent-400">CODE</span>
          </h1>
        </motion.div>

        {/* Главная карточка */}
        <motion.div variants={staggerItem}>
          <Card
            className="relative overflow-hidden border border-accent-500/20 bg-gradient-to-br from-dark-800 to-dark-900"
            glow
          >
            {/* Декоративный светящийся круг на фоне */}
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent-500/10 blur-2xl" />

            <div className="space-y-6">
              {/* Блок 1: Что это такое */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-accent-400">
                  Что это такое?
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-dark-200">
                  Это уникальный <span className="font-semibold text-dark-50">NUNK CODE</span>! С
                  его помощью ты сможешь получить доступ к самому быстрому VPN на планете. Он дарует
                  тебе силу, с помощью которой ты сможешь пользоваться интернетом без ограничений.
                </p>
              </div>

              {/* Блок 2: Что он дает */}
              <div className="rounded-xl border border-dark-700 bg-dark-900/50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-dark-400">
                  Статус промокода
                </h3>

                {isLoading ? (
                  <div className="mt-2 h-5 w-2/3 animate-pulse rounded bg-dark-700" />
                ) : isPromoDead ? (
                  <div className="mt-1 flex items-center gap-2 text-base font-medium text-error-400">
                    ❌ Промокод недействителен или исчерпан
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2 text-base font-semibold text-success-400">
                    🎁 {getPromoBonusText()}
                  </div>
                )}
              </div>

              {/* Блок 3: Как активировать */}
              <div className="pt-2">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-accent-500 to-accent-600 font-medium text-white shadow-lg shadow-accent-500/20 hover:from-accent-600 hover:to-accent-700 disabled:opacity-50"
                  onClick={() => navigate(`/balance?promocode=${encodeURIComponent(promocode)}`)}
                  disabled={isPromoDead} // <--- Блокируем кнопку, если код "мертв"
                >
                  {isPromoDead
                    ? 'Код недоступен'
                    : isAuthenticated
                      ? 'Активировать в 1 клик'
                      : 'Войти и активировать'}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Ссылка "Назад" на случай, если юзер передумал */}
        <motion.div variants={staggerItem} className="text-center">
          <button
            onClick={() => navigate('/balance')}
            className="text-sm text-dark-400 transition-colors hover:text-dark-200"
          >
            ← Просто перейти в кабинет
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
