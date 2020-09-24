import { createStrategyActions, calculateProfitability } from './strategy';
import { sma } from './technical-analysis';
import { syncSmaValuesWithStockDate } from './utils';

const SMA_PERIOD_MIN = 8;

export const findMostProfitableSMA = (
  stockData,
  smaPeriodMin = SMA_PERIOD_MIN
) => {
  const smaByPeriod = {};
  const closePrices = stockData.map((sD) => sD.CLOSE);
  const smaMaxPeriod = Math.min(closePrices.length, 365); // days in 1 year

  // Step 1: calculate SMA for all periods
  for (
    let currentSmaPeriod = smaPeriodMin;
    currentSmaPeriod <= smaMaxPeriod;
    currentSmaPeriod += 1
  ) {
    const calculatedSmaValues = sma(currentSmaPeriod, closePrices);

    smaByPeriod[currentSmaPeriod] = syncSmaValuesWithStockDate(
      currentSmaPeriod,
      calculatedSmaValues,
      stockData
    );
  }

  // Step 2: calculate SMA actions and their profitability
  const actionsBySmaPeriod = {};
  const profitabilityBySmaPeriod = {};

  Object.keys(smaByPeriod).forEach((currentSmaPeriod) => {
    const currentSma = smaByPeriod[currentSmaPeriod];

    actionsBySmaPeriod[currentSmaPeriod] = createStrategyActions(
      stockData,
      currentSma
    );

    profitabilityBySmaPeriod[currentSmaPeriod] = calculateProfitability(
      actionsBySmaPeriod[currentSmaPeriod]
    );
  });

  // Step 3: find most profitable SMA
  let mostProfitableSmaPeriod = 0;
  let mostTotalChangeInPercent = 0;
  Object.keys(profitabilityBySmaPeriod).forEach((currentSmaPeriod) => {
    const currentProfitability = profitabilityBySmaPeriod[currentSmaPeriod];
    const { totalChangeInPercent } = currentProfitability[
      currentProfitability.length - 1
    ];

    if (totalChangeInPercent > mostTotalChangeInPercent) {
      mostProfitableSmaPeriod = currentSmaPeriod;
      mostTotalChangeInPercent = totalChangeInPercent;
    }
  });

  const mostProfitableSmaValues = smaByPeriod[mostProfitableSmaPeriod];
  const mostProfitableActions = actionsBySmaPeriod[mostProfitableSmaPeriod];
  const actionsProfitability =
    profitabilityBySmaPeriod[mostProfitableSmaPeriod];

  return {
    mostProfitableSmaPeriod,
    mostProfitableSmaValues,
    mostProfitableActions,
    actionsProfitability,
  };
};

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
