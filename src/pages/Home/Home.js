import React from 'react';
import * as d3 from 'd3';

import CandlestickChart from './CandlestickChart';

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

  React.useEffect(() => {
    fetch(
      `/api-tiingo/iex/aapl/prices?startDate=2020-01-01&resampleFreq=4hour&columns=open,high,low,close,volume&token=${process.env.TIINGO_TOKEN}`
    )
      .then((res) => res.json())
      .then((resAsJson) => {
        const nextStockData = prepareTiingoData(resAsJson);
        setStockData(nextStockData);
      });
  }, []);
  return <CandlestickChart fetchedStockData={stockData} />;
};

export default Home;
