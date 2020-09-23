import React from 'react';
import * as d3 from 'd3';

import resAsJsonTmp from './ibResAsJson.json';

export const postSymbolSearch = (body) =>
  fetch('/api-ib/iserver/secdef/search', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then((res) => res.json());

const refreshIBStockData = (
  { conid, period, bar },
  { isRealData = true } = {}
) => {
  const queryParams = `?conid=${conid}&period=${period}&bar=${bar}`;

  return new Promise((resolve, reject) => {
    if (isRealData) {
      fetch(`/api-ib/iserver/marketdata/history${queryParams}`, {
        headers: {
          accept: 'application/json',
        },
      })
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
const prepareIBData = (candleSticks) =>
  candleSticks.map((candleStick) => ({
    TIMESTAMP: d3.isoParse(candleStick.t),
    LOW: candleStick.l,
    HIGH: candleStick.h,
    OPEN: candleStick.o,
    CLOSE: candleStick.c,
  }));

export const useIBAPI = () => {
  const [stockData, setStockData] = React.useState();

  const refreshStockData = React.useCallback(async (params) => {
    // if (!params.conid) return false;

    const resAsJson = await refreshIBStockData(params, {
      isRealData: false,
    });
    const nextStockData = prepareIBData(resAsJson.data);
    setStockData(nextStockData);

    return true;
  }, []);

  return [stockData, refreshStockData];
};
