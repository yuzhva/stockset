import React from 'react';
import * as d3 from 'd3';
import { SMA } from 'technicalindicators';

import CandlestickChart from './CandlestickChart';

import resAsJsonTmp from './resAsJson.json';

const prepareTiingoData = (resAsJson) =>
  resAsJson.map((candleStick) => ({
    TIMESTAMP: d3.isoParse(candleStick.date),
    LOW: candleStick.low,
    HIGH: candleStick.high,
    OPEN: candleStick.open,
    CLOSE: candleStick.close,
  }));

const Home = () => {
  const [stockData, setStockData] = React.useState();
  const [smaValues, setSmaValues] = React.useState();

  React.useEffect(() => {
    // fetch(
    //   `/api-tiingo/iex/aapl/prices?startDate=2020-01-01&resampleFreq=4hour&columns=open,high,low,close,volume&token=${process.env.TIINGO_TOKEN}`
    // )
    //   .then((res) => res.json())
    //   .then((resAsJson) => {
    //     const nextStockData = prepareTiingoData(resAsJson);
    //     setStockData(nextStockData);
    //   });
    const nextStockData = prepareTiingoData(resAsJsonTmp);
    setStockData(nextStockData);

    const smaPeriod = 35;

    const calculatedSmaValues = SMA.calculate({
      period: smaPeriod,
      values: nextStockData.map((sD) => sD.CLOSE),
    });

    const jsIndexShiftSize = 1;
    const stockSmaValues = calculatedSmaValues.map((smaValue, smaIndex) => {
      const matchingStockDataIndex = smaPeriod + smaIndex - jsIndexShiftSize;
      const matchingStockData = nextStockData[matchingStockDataIndex];

      return {
        value: smaValue,
        TIMESTAMP: matchingStockData.TIMESTAMP,
      };
    });

    setSmaValues(stockSmaValues);
  }, []);
  return (
    <CandlestickChart fetchedStockData={stockData} smaValues={smaValues} />
  );
};

export default Home;
