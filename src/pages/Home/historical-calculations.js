import { createStrategyActions, calculateProfitability } from './strategy';
import { sma } from './technical-analysis';
// import { SMA } from 'technicalindicators';
import { syncSmaValuesWithStockDate, modifyDate } from './utils';

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
    // const calculatedSmaValues = SMA.calculate({
    //   period: currentSmaPeriod,
    //   values: closePrices,
    // });

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
    // NOTE: {currentSmaPeriod} is {obj} key
    mostProfitableSmaPeriod: Number(mostProfitableSmaPeriod),
    mostProfitableSmaValues,
    mostProfitableActions,
    actionsProfitability,
  };
};

export const calcProbability = (stockData, mostProfitableSma) => {
  if (mostProfitableSma) {
    let upTrendNum = 0;
    let downTrendNum = 0;

    // get last N elements of array
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
      percentOfUpTrend: parseFloat(
        ((upTrendNum * 100) / lastStockData.length).toFixed(2)
      ),
      percentOfDownTrend: parseFloat(
        ((downTrendNum * 100) / lastStockData.length).toFixed(2)
      ),
      changeOfUpTrend: parseFloat(
        ((upTrendNum / lastStockData.length) * 100).toFixed(2)
      ),
      changeOfDownTrend: parseFloat(
        ((downTrendNum / lastStockData.length) * 100).toFixed(2)
      ),
    };
  }

  return {};
};

export const calcCandleMovesInfo = (stockData, mostProfitableSmaPeriod) => {
  // Step-1: entire and open to close change
  const candleMoves = stockData.map((candle) => {
    // Step-1.1: entire change
    const changeDown = parseFloat(
      (100 - (candle.LOW * 100) / candle.OPEN).toFixed(2)
    );
    const changeUp = parseFloat(
      (100 - (candle.HIGH * 100) / candle.OPEN).toFixed(2)
    );

    // const positiveChangeDown = changeDown < 0 ? changeDown * -1 : changeDown;
    // const positiveChangeUp = changeUp < 0 ? changeUp * -1 : changeUp;

    const positiveChangeDown = Math.abs(changeDown);
    const positiveChangeUp = Math.abs(changeUp);

    const entirePercentChange = parseFloat(
      (positiveChangeDown + positiveChangeUp).toFixed(2)
    );

    // Step-1.2: open to close change
    const openToClosePercentChange = parseFloat(
      ((candle.CLOSE * 100) / candle.OPEN - 100).toFixed(2)
    );
    return {
      entirePercentChange,
      openToClosePercentChange,
      TIMESTAMP: candle.TIMESTAMP,
    };
  });

  // Step-2: average for period
  const entirePercentChanges = [...candleMoves].map(
    ({ entirePercentChange }) => entirePercentChange
  );
  const smaHistMoves = sma(mostProfitableSmaPeriod, entirePercentChanges);

  const avgForPeriodHistMoves = syncSmaValuesWithStockDate(
    mostProfitableSmaPeriod,
    smaHistMoves,
    candleMoves
  );

  // Step-3: find peak changes
  const topHistMoves = [...candleMoves]
    .sort((a, b) => b.entirePercentChange - a.entirePercentChange) // sort descending
    .slice(0, 5);

  const sortedOpenToCloseChanges = [...candleMoves].sort(
    (a, b) => a.openToClosePercentChange - b.openToClosePercentChange
  ); // sort ascending

  const topHistLoses = sortedOpenToCloseChanges.slice(0, 5);

  const topHistGainers = sortedOpenToCloseChanges
    .slice(Math.max(sortedOpenToCloseChanges.length - 5, 0)) // get last N elements of array
    .sort((a, b) => b.openToClosePercentChange - a.openToClosePercentChange); // sort descending

  // Step-3.1 peak changes for period
  const candleForPeriodMoves = [...candleMoves].slice(
    Math.max(candleMoves.length - mostProfitableSmaPeriod, 0)
  );

  const topPeriodMoves = [...candleForPeriodMoves].sort(
    (a, b) => b.entirePercentChange - a.entirePercentChange
  );

  const topPeriodLoses = [...candleForPeriodMoves].sort(
    (a, b) => a.openToClosePercentChange - b.openToClosePercentChange
  );

  const topPeriodGainers = [...candleForPeriodMoves].sort(
    (a, b) => b.openToClosePercentChange - a.openToClosePercentChange
  );

  // Step-4: average
  // As single number
  // let avgHistoricalEntireChanges = 0;
  // candleMoves.forEach(({ entirePercentChange }) => {
  //   avgHistoricalEntireChanges = parseFloat(
  //     (avgHistoricalEntireChanges + entirePercentChange).toFixed(2)
  //   );
  // });

  // avgHistoricalEntireChanges = parseFloat(
  //   (avgHistoricalEntireChanges / candleMoves.length).toFixed(2)
  // );
  // As array
  // const avgHistoricalEntireChanges = candleMoves.map((_, candleIndex) => {
  //   let historicalEntireChanges = 0;

  //   for (let historyIndex = 0; historyIndex <= candleIndex; historyIndex += 1) {
  //     historicalEntireChanges = parseFloat(
  //       (
  //         historicalEntireChanges +
  //         candleMoves[historyIndex].entirePercentChange
  //       ).toFixed(2)
  //     );
  //   }

  //   return parseFloat((historicalEntireChanges / (candleIndex + 1)).toFixed(2));
  // });

  return {
    stockData,
    mostProfitableSmaPeriod,

    candleMoves,
    avgForPeriodHistMoves,

    topHistMoves,
    topHistLoses,
    topHistGainers,

    topPeriodMoves,
    topPeriodLoses,
    topPeriodGainers,
  };
};

export const createNextCandlesBasedOnHistoryInfo = (
  {
    stockData,
    mostProfitableSmaPeriod,

    candleMoves,
    avgForPeriodHistMoves,

    topHistMoves,
    topHistLoses,
    topHistGainers,

    topPeriodMoves,
    topPeriodLoses,
    topPeriodGainers,
  },
  {
    numOfCandles = 1,
    moveDirection = 'STRAIGHTFORWARD', // 'PERIOD_AVERAGE'
    moveSource = 'AVG_PERIOD', // 'TOP_PERIOD' || 'TOP_HISTORY'
    isDirectionInverted = false, // false => 'UPTREND', true => 'DOWNTREND'
  } = {}
) => {
  const nextCandles = [];
  let tomorrowTimeStamp = modifyDate('d', 1, 'add');

  const { percentOfUpTrend } =
    moveDirection === 'PERIOD_AVERAGE'
      ? calcProbability(stockData, mostProfitableSmaPeriod)
      : {};

  // let avgPeriodPercentChange = 0;

  // if (moveSource === 'AVG_PERIOD') {
  //   topPeriodMoves.forEach(({ entirePercentChange }) => {
  //     avgPeriodPercentChange += entirePercentChange;
  //   });

  //   avgPeriodPercentChange = parseFloat(
  //     (avgPeriodPercentChange / topPeriodMoves.length).toFixed(2)
  //   );
  // }

  for (let candleIndex = 0; candleIndex < numOfCandles; candleIndex += 1) {
    const MOVE_SIZE_BY_SOURCE = {
      AVG_PERIOD: avgForPeriodHistMoves[avgForPeriodHistMoves.length - 1].value,
      TOP_PERIOD: topPeriodMoves[0].entirePercentChange,
      TOP_HISTORY: topHistMoves[0].entirePercentChange,
    };

    const prevCandle =
      candleIndex === 0
        ? stockData[stockData.length - 1]
        : nextCandles[candleIndex - 1];

    const moveSizePercent = MOVE_SIZE_BY_SOURCE[moveSource];
    const nextCandleMovePoints = parseFloat(
      ((prevCandle.CLOSE * moveSizePercent) / 100).toFixed(2)
    );

    let candleDirection = isDirectionInverted ? 'DOWN_TREND' : 'UP_TREND';

    // NOTE: switch direction for {PERIOD_AVERAGE} move direction
    if (moveDirection === 'PERIOD_AVERAGE') {
      const candleIndexAsPercent = parseFloat(
        ((candleIndex * 100) / numOfCandles).toFixed(2)
      );

      if (candleIndexAsPercent <= percentOfUpTrend) {
        candleDirection = isDirectionInverted ? 'DOWN_TREND' : 'UP_TREND';
      } else {
        candleDirection = isDirectionInverted ? 'UP_TREND' : 'DOWN_TREND';
      }
    }

    const nextCandlesClose =
      candleDirection === 'UP_TREND'
        ? parseFloat((prevCandle.CLOSE + nextCandleMovePoints).toFixed(2))
        : parseFloat((prevCandle.CLOSE - nextCandleMovePoints).toFixed(2));

    nextCandles.push({
      OPEN: prevCandle.CLOSE,
      CLOSE: nextCandlesClose,
      LOW: candleDirection === 'UP_TREND' ? prevCandle.CLOSE : nextCandlesClose,
      HIGH:
        candleDirection === 'UP_TREND' ? nextCandlesClose : prevCandle.CLOSE,
      TIMESTAMP: tomorrowTimeStamp,
    });

    tomorrowTimeStamp = modifyDate('d', 1, 'add', tomorrowTimeStamp);
  }

  return nextCandles;
};
