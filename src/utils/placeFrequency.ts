interface FrequencyValue {
  frequency: number;
}

export function getFrequencyCutoffThreshold<T extends FrequencyValue>(
  places: T[],
  percentile: number
): number | null {
  if (places.length === 0 || percentile <= 0) return null;
  const boundedPercentile = Math.min(99, percentile);
  const frequencies = places
    .map((place) => place.frequency)
    .sort((a, b) => a - b);
  const index = Math.floor((boundedPercentile / 100) * (frequencies.length - 1));
  return frequencies[index];
}

export function filterByFrequencyCutoff<T extends FrequencyValue>(
  places: T[],
  percentile: number
): T[] {
  const threshold = getFrequencyCutoffThreshold(places, percentile);
  return threshold === null
    ? places
    : places.filter((place) => place.frequency > threshold);
}
