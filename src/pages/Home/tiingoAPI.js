import React from 'react';
import * as d3 from 'd3';

import { BAR_TYPE } from './constants';
import resAsJsonTmp from './tiingoResAsJson.json';

const API_ENDPOINT_BY_KEY = {
  END_OF_DAY:
    '/api-tiingo/tiingo/daily/%ticker%/prices?startDate=%startDate%&resampleFreq=%timeFrame%&token=%tiingoToken%',
  INTRADAY:
    '/api-tiingo/iex/%ticker%/prices?startDate=%startDate%&resampleFreq=%timeFrame%&token=%tiingoToken%',
};

const TIINGO_BAR_TYPE = {
  [BAR_TYPE.M]: 'monthly',
  [BAR_TYPE.W]: 'weekly',
  [BAR_TYPE.D]: 'daily',
  [BAR_TYPE.H]: 'hour',
  [BAR_TYPE.MIN]: 'min',
};

const refreshTiingoStockData = (
  { ticker, period, barSize, barType },
  { isRealData = true } = {}
) => {
  // NOTE: start date 2x larger to calculate MA
  const startDateStamp = new Date().setMonth(
    new Date().getMonth() - Number(period) * 2
  );
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
