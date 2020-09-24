// eslint-disable-next-line import/prefer-default-export
export const calcProbability = (stockData, mostProfitableSma) => {
  if (mostProfitableSma) {
    let upTrendNum = 0;
    let downTrendNum = 0;

    const lastStockData = stockData.slice(
      Math.max(stockData.length - mostProfitableSma, 0)
    );

    lastStockData.forEach((lastTick) => {
      if (lastTick.CLOSE > lastTick.OPEN) upTrendNum += 1;
      if (lastTick.CLOSE < lastTick.OPEN) downTrendNum += 1;
    });

    return {
      numOfUpTrend: upTrendNum,
      numOfDownTrend: downTrendNum,
      changeOfUpTrend: (upTrendNum / lastStockData.length) * 100,
      changeOfDownTrend: (downTrendNum / lastStockData.length) * 100,
    };
  }

  return {};
};
