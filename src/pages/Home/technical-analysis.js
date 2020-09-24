// eslint-disable-next-line import/prefer-default-export
export const sma = (period, values) => {
  const slicedValues = values.slice(period - 1);
  return slicedValues.map((currentValue, smaIndex) => {
    let averageValue = 0;

    for (
      let valuesIndex = smaIndex;
      valuesIndex < period + smaIndex;
      valuesIndex += 1
    ) {
      averageValue += values[valuesIndex];
    }

    return averageValue / period;
  });
};
