export const createStrategyActions = (stockData, smaValues) => {
  const actions = [];

  const indexOfFirstSmaValue = stockData.findIndex(
    (possibleStockData) =>
      possibleStockData.TIMESTAMP === smaValues[0].TIMESTAMP
  );

  const correlatedStockData = stockData.slice(indexOfFirstSmaValue);

  let isInPosition = false;
  smaValues.forEach((smaValue, smaIndex) => {
    const isLastAction = smaIndex === smaValues.length - 1;
    const relativeStockData = correlatedStockData[smaIndex];

    if (!isInPosition && relativeStockData.CLOSE > smaValue.value) {
      actions.push({
        type: 'BUY',
        price: relativeStockData.CLOSE,
        TIMESTAMP: relativeStockData.TIMESTAMP,
      });
      isInPosition = true;
    }

    if (
      (isInPosition && relativeStockData.CLOSE < smaValue.value) ||
      isLastAction
    ) {
      actions.push({
        type: 'SELL',
        price: relativeStockData.CLOSE,
        TIMESTAMP: relativeStockData.TIMESTAMP,
      });
      isInPosition = false;
    }
  });

  return actions;
};

export const calculateProfitability = (actions) => {
  const profitability = [];

  actions.forEach((action, actionIndex) => {
    const isIndexOdd = actionIndex % 2;
    const isCameOutOfPosition = Boolean(isIndexOdd);

    const prevProfitabilityResult = profitability[profitability.length - 1] || {
      actionChangeInPercent: 0,
      totalChangeInPercent: 0,
      timeStamp: action.TIMESTAMP,
    };

    if (isCameOutOfPosition) {
      const prevPrice = actions[actionIndex - 1].price;
      const currentPrice = action.price;

      const actionChangeInPercent = (currentPrice * 100) / prevPrice - 100;
      const totalChangeInPercent =
        prevProfitabilityResult.totalChangeInPercent + actionChangeInPercent;

      profitability.push({
        actionChangeInPercent,
        totalChangeInPercent,
        timeStamp: action.TIMESTAMP,
      });
    } else {
      profitability.push(prevProfitabilityResult);
    }
  });

  return profitability;
};
