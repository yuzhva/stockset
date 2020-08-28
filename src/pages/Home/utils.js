export const syncSmaValuesWithStockDate = (
  smaPeriod,
  calculatedSmaValues,
  stockData
) => {
  const jsIndexShiftSize = 1;

  const stockSmaValues = calculatedSmaValues.map((smaValue, smaIndex) => {
    const matchingStockDataIndex = smaPeriod + smaIndex - jsIndexShiftSize;
    const matchingStockData = stockData[matchingStockDataIndex];

    return {
      value: smaValue,
      TIMESTAMP: matchingStockData.TIMESTAMP,
    };
  });

  return stockSmaValues;
};
