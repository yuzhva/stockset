import React from 'react';
import * as d3 from 'd3';

import { DATE_SUBTRACTOR_BY_PERIOD_TYPE, BAR_TYPE } from './constants';
import resAsJsonTmp from './tiingoResAsJson.spy-1y-4h.json';

const API_ENDPOINT_BY_KEY = {
  END_OF_DAY:
    '/api-tiingo/tiingo/daily/%ticker%/prices?startDate=%startDate%&resampleFreq=%timeFrame%&token=%tiingoToken%',
  INTRADAY:
    '/api-tiingo/iex/%ticker%/prices?startDate=%startDate%&resampleFreq=%timeFrame%&token=%tiingoToken%&columns=open,high,low,close,volume',
};

const TIINGO_BAR_TYPE = {
  [BAR_TYPE.M]: 'monthly',
  [BAR_TYPE.W]: 'weekly',
  [BAR_TYPE.D]: 'daily',
  [BAR_TYPE.H]: 'hour',
  [BAR_TYPE.MIN]: 'min',
};

const refreshTiingoStockData = (
  { ticker, periodSize, periodType, barSize, barType },
  { isRealData = true } = {}
) => {
  const dateSubtractor = DATE_SUBTRACTOR_BY_PERIOD_TYPE[periodType];

  const startDateStamp = dateSubtractor(periodSize);
  const startDate = new Date(startDateStamp).toISOString().slice(0, 10);

  const isIntraDay = [BAR_TYPE.MIN, BAR_TYPE.H].includes(barType);

  const timeFrame = isIntraDay
    ? `${barSize}${TIINGO_BAR_TYPE[barType]}`
    : TIINGO_BAR_TYPE[barType];

  const apiEndPoint = isIntraDay
    ? API_ENDPOINT_BY_KEY.INTRADAY
    : API_ENDPOINT_BY_KEY.END_OF_DAY;

  const requestUrl = apiEndPoint
    .replace('%ticker%', ticker)
    .replace('%startDate%', startDate)
    .replace('%timeFrame%', timeFrame)
    .replace('%tiingoToken%', process.env.TIINGO_TOKEN);

  return new Promise((resolve, reject) => {
    if (isRealData) {
      fetch(requestUrl)
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
export const prepareTiingoData = (candleSticks) =>
  candleSticks.map((candleStick) => ({
    TIMESTAMP: d3.isoParse(candleStick.date),
    LOW: candleStick.low,
    HIGH: candleStick.high,
    OPEN: candleStick.open,
    CLOSE: candleStick.close,
    // bar chart
    TURNOVER: candleStick.volume,
    VOLATILITY: candleStick.volume,
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
