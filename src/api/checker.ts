import axios from 'axios';

const CHECKER_API_URL =
  'https://xray-checker.nunk.space/xray/monitor/api/v1/public/proxies/history';

export interface CheckerHistoryItem {
  checkCount: number;
  online: boolean;
  latencyMs: number;
}

export interface CheckerProxy {
  stableId: string;
  name: string;
  history: CheckerHistoryItem[];
}

export interface CheckerResponse {
  success: boolean;
  data: CheckerProxy[];
}

// Обработанные данные для UI
export interface ProxyStatus {
  stableId: string;
  name: string;
  flag: string;
  countryCode: string | null;
  cleanName: string;
  // Последнее состояние
  online: boolean;
  latencyMs: number;
  // История (30 точек) для мини-графика
  history: CheckerHistoryItem[];
  // Аптайм за последние 30 проверок (%)
  uptimePercent: number;
  // Средний пинг (только онлайн-записи)
  avgLatencyMs: number;
}

/**
 * Из эмодзи-флага извлекает ISO-код страны для flag-icons.
 * Эмодзи-флаг = 2 символа Regional Indicator (U+1F1E6..U+1F1FF).
 * Каждый соответствует букве A-Z: 🇱 (U+1F1F1) → L. Вычитаем базу → код.
 * 🇱🇻 → "lv", 🇩🇪 → "de". Возвращает null если не флаг.
 */
const emojiFlagToCountryCode = (flag: string): string | null => {
  const codePoints = Array.from(flag).map((c) => c.codePointAt(0) ?? 0);
  if (codePoints.length !== 2) return null;
  const BASE = 0x1f1e6; // Regional Indicator Symbol Letter A
  const a = codePoints[0] - BASE;
  const b = codePoints[1] - BASE;
  if (a < 0 || a > 25 || b < 0 || b > 25) return null;
  return (String.fromCharCode(65 + a) + String.fromCharCode(65 + b)).toLowerCase();
};

export const extractFlagAndName = (
  fullName: string,
): { flag: string; countryCode: string | null; cleanName: string } => {
  const flagRegex = /^([\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF])/;
  const match = fullName.match(flagRegex);
  if (match) {
    return {
      flag: match[1],
      countryCode: emojiFlagToCountryCode(match[1]),
      cleanName: fullName.replace(flagRegex, '').trim(),
    };
  }
  return { flag: '🌐', countryCode: null, cleanName: fullName };
};

export const checkerApi = {
  getProxies: async (): Promise<ProxyStatus[]> => {
    const { data } = await axios.get<CheckerResponse>(CHECKER_API_URL);

    if (!data.success) throw new Error('Checker API returned success: false');

    return data.data.map((proxy): ProxyStatus => {
      const { flag, countryCode, cleanName } = extractFlagAndName(proxy.name);

      const last = proxy.history[proxy.history.length - 1];
      const online = last?.online ?? false;
      const latencyMs = last?.latencyMs ?? 0;

      const onlineCount = proxy.history.filter((h) => h.online).length;
      const uptimePercent =
        proxy.history.length > 0 ? Math.round((onlineCount / proxy.history.length) * 100) : 0;

      const onlineEntries = proxy.history.filter((h) => h.online && h.latencyMs > 0);
      const avgLatencyMs =
        onlineEntries.length > 0
          ? Math.round(onlineEntries.reduce((s, h) => s + h.latencyMs, 0) / onlineEntries.length)
          : 0;

      return {
        stableId: proxy.stableId,
        name: proxy.name,
        flag,
        countryCode,
        cleanName,
        online,
        latencyMs,
        history: proxy.history,
        uptimePercent,
        avgLatencyMs,
      };
    });
  },
};
