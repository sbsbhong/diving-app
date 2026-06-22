export const formatDate = (seconds?: number, locale = 'ko', unknownLabel = '알 수 없는 날짜') => {
  if (!seconds) {
    return unknownLabel;
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(seconds * 1000));
};

export const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remainder).padStart(2, '0')}`;
};

export const formatDepth = (meters?: number) => {
  if (meters === undefined) {
    return '--.- m';
  }

  return `${meters.toFixed(1)} m`;
};

export const formatLength = (meters?: number) => {
  if (meters === undefined) {
    return '--.- m';
  }

  return `${meters.toFixed(1)} m`;
};

export const formatTemperature = (celsius?: number) => {
  if (celsius === undefined) {
    return '--.- °C';
  }

  return `${celsius.toFixed(1)} °C`;
};

export const formatRating = (rating?: number, notRatedLabel = '평가 없음') => {
  if (!rating) {
    return notRatedLabel;
  }

  return '★'.repeat(Math.max(1, Math.min(5, rating)));
};
