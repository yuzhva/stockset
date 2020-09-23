import React from 'react';
import * as d3 from 'd3';

import resAsJsonTmp from './resAsJson.json';

const API_ENDPOINT_BY_KEY = {
  END_OF_DAY:
    '/api-tiingo/tiingo/daily/%ticker%/prices?startDate=%startDate%&resampleFreq=%timeFrame%&token=%tiingoToken%',
  INTRADAY:
    '/api-tiingo/iex/%ticker%/prices?startDate=%startDate%&resampleFreq=%timeFrame%&token=%tiingoToken%',
};

const API_ENDPOINT_BY_TIME_FRAME = {
  monthly: API_ENDPOINT_BY_KEY.END_OF_DAY,
  weekly: API_ENDPOINT_BY_KEY.END_OF_DAY,
  daily: API_ENDPOINT_BY_KEY.END_OF_DAY,
  '4hour': API_ENDPOINT_BY_KEY.INTRADAY,
  '1hour': API_ENDPOINT_BY_KEY.INTRADAY,
  '15min': API_ENDPOINT_BY_KEY.INTRADAY,
  '1min': API_ENDPOINT_BY_KEY.INTRADAY,
};

const refreshTiingoStockData = (
  { ticker, startDate, timeFrame },
  { isRealData = true } = {}
) => {
  const apiEndPoint = API_ENDPOINT_BY_TIME_FRAME[timeFrame]
    .replace('%ticker%', ticker)
    .replace('%startDate%', startDate.slice(0, 10))
    .replace('%timeFrame%', timeFrame)
    .replace('%tiingoToken%', process.env.TIINGO_TOKEN);

  return new Promise((resolve, reject) => {
    if (isRealData) {
      fetch(apiEndPoint)
        .then((res) => res.json())
        .then((resAsJson) => {
          console.warn('resAsJson', resAsJson);
          resolve(resAsJson);
        })
        .catch(reject);
    } else {
      resolve(resAsJsonTmp);
    }
  });
};

// React hook
export const prepareTiingoData = (resAsJson) =>
  resAsJson.map((candleStick) => ({
    TIMESTAMP: d3.isoParse(candleStick.date),
    LOW: candleStick.low,
    HIGH: candleStick.high,
    OPEN: candleStick.open,
    CLOSE: candleStick.close,
  }));

export const useTiingoAPI = () => {
  const [stockData, setStockData] = React.useState();

  const refreshStockData = React.useCallback(async (params) => {
    const resAsJson = await refreshTiingoStockData(params, {
      isRealData: false,
    });
    const nextStockData = prepareTiingoData(resAsJson);
    setStockData(nextStockData);
  }, []);

  return [stockData, refreshStockData];
};
