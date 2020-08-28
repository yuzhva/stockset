import React from 'react';
import * as d3 from 'd3';
import { SMA } from 'technicalindicators';

import CandlestickChart from './CandlestickChart';

import { createStrategyActions, calculateProfitability } from './strategy';
import { syncSmaValuesWithStockDate } from './utils';

import resAsJsonTmp from './resAsJson.tsla.json';

const FORM_DEFAULT_VALUE = {
  period: '12',
  timeFrame: '4hour',

  // sma: 50,
};

const SMA_PERIOD_MIN = 8;

const SMA_PERIOD_BY_DATE_RANGE = {
  '12': 365,
  '6': 180,
  '3': 90,
};

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

  const [inputValue, setInputValue] = React.useState(FORM_DEFAULT_VALUE);
  const [mostProfitableSma, setMostProfitableSma] = React.useState('');

  const { calculationsStartDate, fetchDataStartDate } = React.useMemo(() => {
    const dateStamp = new Date().setMonth(
      new Date().getMonth() - Number(inputValue.period)
    );

    // NOTE: start date 2x larger to calculate MA
    const largerDateStamp = new Date().setMonth(
      new Date().getMonth() - Number(inputValue.period) * 2
    );
    return {
      calculationsStartDate: new Date(dateStamp).toISOString(),
      fetchDataStartDate: new Date(largerDateStamp).toISOString(),
    };
  }, [inputValue.period]);

  const smaMaxPeriod = React.useMemo(
    () => SMA_PERIOD_BY_DATE_RANGE[inputValue.period],
    [inputValue.period]
  );

  React.useEffect(() => {
    // fetch(
    //   `/api-tiingo/iex/tsla/prices?startDate=${fetchDataStartDate.slice(0, 10)}&resampleFreq=${inputValue.timeFrame}&token=${process.env.TIINGO_TOKEN}`
    // )
    //   .then((res) => res.json())
    //   .then((resAsJson) => {
    //     console.warn('resAsJson', resAsJson);
    //     const nextStockData = prepareTiingoData(resAsJson);
    //     setStockData(nextStockData);
    //   });
    const nextStockData = prepareTiingoData(resAsJsonTmp);
    setStockData(nextStockData);
  }, []);

  const handleInputChange = React.useCallback(
    (e) => {
      setInputValue({
        ...inputValue,
        [e.currentTarget.name]: e.currentTarget.value,
      });
    },
    [inputValue]
  );

  const onBtnCalcSmaClick = React.useCallback(() => {
    const smaByPeriod = {};
    const closePrices = stockData.map((sD) => sD.CLOSE);

    // Step 1: calculate SMA for all periods
    for (
      let currentSmaPeriod = SMA_PERIOD_MIN;
      currentSmaPeriod <= smaMaxPeriod;
      currentSmaPeriod += 1
    ) {
      const calculatedSmaValues = SMA.calculate({
        period: currentSmaPeriod,
        values: closePrices,
      });

      smaByPeriod[currentSmaPeriod] = syncSmaValuesWithStockDate(
        currentSmaPeriod,
        calculatedSmaValues,
        stockData
      );
    }

    // Step 2: calculate SMA actions and their profitability
    const actionsBySmaPeriod = {};
    const profitabilityBySmaPeriod = {};
    const stockDataForCalculation = stockData.slice(
      stockData.findIndex(
        (sD) => sD.TIMESTAMP >= d3.isoParse(calculationsStartDate)
      )
    );

    Object.keys(smaByPeriod).forEach((currentSmaPeriod) => {
      const currentSma = smaByPeriod[currentSmaPeriod];

      const smaForCalculation = currentSma.slice(
        currentSma.findIndex(
          (sV) => sV.TIMESTAMP >= d3.isoParse(calculationsStartDate)
        )
      );

      actionsBySmaPeriod[currentSmaPeriod] = createStrategyActions(
        stockDataForCalculation,
        smaForCalculation
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

    // Step 4: save results
    setMostProfitableSma(mostProfitableSmaPeriod);
    setSmaValues(smaByPeriod[mostProfitableSmaPeriod]);

    console.warn('taken actions', actionsBySmaPeriod[mostProfitableSmaPeriod]);
    console.warn(
      'actions profit',
      profitabilityBySmaPeriod[mostProfitableSmaPeriod]
    );
  }, [stockData, calculationsStartDate]);

  return (
    <div>
      <div className="control">
        <label htmlFor="ticket">
          ticker:
          <input
            id="ticket"
            name="ticket"
            type="text"
            maxLength={4}
            value={inputValue.name}
            onChange={handleInputChange}
          />
        </label>
        <label htmlFor="period">
          period:
          <select
            name="period"
            id="period"
            defaultValue={FORM_DEFAULT_VALUE.period}
            onChange={handleInputChange}
          >
            <option value="12">1 year</option>
            <option value="6">6 month</option>
            <option value="3">1 quarter</option>
          </select>
        </label>
        <label htmlFor="timeFrame">
          time frame:
          <select
            name="timeFrame"
            id="timeFrame"
            defaultValue={FORM_DEFAULT_VALUE.timeFrame}
            onChange={handleInputChange}
          >
            {/* <option value="monthly">M</option> */}
            <option value="weekly">W</option>
            <option value="daily">D</option>
            <option value="4hour">4h</option>
            <option value="1hour">1h</option>
            <option value="15min">15m</option>
            <option value="1min">1m</option>
          </select>
        </label>
        <label htmlFor="ticket">
          SMA:
          <input
            id="sma"
            name="sma"
            type="number"
            max={smaMaxPeriod}
            value={mostProfitableSma}
            readOnly
          />
        </label>
        <button type="button" onClick={onBtnCalcSmaClick}>
          Calc best SMA
        </button>
      </div>

      <CandlestickChart fetchedStockData={stockData} smaValues={smaValues} />
    </div>
  );
};

export default Home;
