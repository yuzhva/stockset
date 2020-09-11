import React from 'react';
import * as d3 from 'd3';
import { SMA } from 'technicalindicators';

import CandlestickChart from './CandlestickChart';

import { createStrategyActions, calculateProfitability } from './strategy';
import { syncSmaValuesWithStockDate } from './utils';

// import resAsJsonTmp from './resAsJson.json';

const FORM_API_RELATED_DEFAULT_VALUE = {
  timeFrame: 'daily',
};

const FORM_CHART_RELATED_DEFAULT_VALUE = {
  period: '36',
};

const SMA_PERIOD_MIN = 8;

const SMA_PERIOD_BY_DATE_RANGE = {
  '12': 365,
  '6': 180,
  '3': 90,
};

const SMA_PERIOD_BY_TIME_FRAME = {
  monthly: 12,
  weekly: 52,
};

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
  const [actionsProfit, setActionsProfit] = React.useState();

  const [inputApiRelatedValue, setInputApiRelatedValue] = React.useState(
    FORM_API_RELATED_DEFAULT_VALUE
  );
  const [inputChartRelatedValue, setInputChartRelatedValue] = React.useState(
    FORM_CHART_RELATED_DEFAULT_VALUE
  );
  const [mostProfitableSma, setMostProfitableSma] = React.useState('');

  const { calculationsStartDate, fetchDataStartDate } = React.useMemo(() => {
    const dateStamp = new Date().setMonth(
      new Date().getMonth() - Number(inputChartRelatedValue.period)
    );

    // NOTE: start date 2x larger to calculate MA
    const largerDateStamp = new Date().setMonth(
      new Date().getMonth() - Number(inputChartRelatedValue.period) * 2
    );
    return {
      calculationsStartDate: new Date(dateStamp).toISOString(),
      fetchDataStartDate: new Date(largerDateStamp).toISOString(),
    };
  }, [inputChartRelatedValue.period]);

  const smaMaxPeriod = React.useMemo(
    () =>
      SMA_PERIOD_BY_TIME_FRAME[inputApiRelatedValue.timeFrame] ||
      SMA_PERIOD_BY_DATE_RANGE[inputChartRelatedValue.period] ||
      SMA_PERIOD_BY_DATE_RANGE['12'],
    [inputApiRelatedValue.timeFrame, inputChartRelatedValue.period]
  );

  React.useEffect(() => {
    const apiEndPoint = API_ENDPOINT_BY_TIME_FRAME[
      inputApiRelatedValue.timeFrame
    ]
      .replace('%ticker%', 'xom')
      .replace('%startDate%', fetchDataStartDate.slice(0, 10))
      .replace('%timeFrame%', inputApiRelatedValue.timeFrame)
      .replace('%tiingoToken%', process.env.TIINGO_TOKEN);

    fetch(apiEndPoint)
      .then((res) => res.json())
      .then((resAsJson) => {
        // console.warn('resAsJson', resAsJson);
        const nextStockData = prepareTiingoData(resAsJson);
        setStockData(nextStockData);
      });
    // const nextStockData = prepareTiingoData(resAsJsonTmp);
    // setStockData(nextStockData);
  }, [inputApiRelatedValue.timeFrame]);

  const handleInputApiRelatedChange = React.useCallback(
    (e) => {
      setInputApiRelatedValue({
        ...inputApiRelatedValue,
        [e.currentTarget.name]: e.currentTarget.value,
      });
    },
    [inputApiRelatedValue]
  );

  const handleInputChartRelatedChange = React.useCallback(
    (e) => {
      setInputChartRelatedValue({
        ...inputChartRelatedValue,
        [e.currentTarget.name]: e.currentTarget.value,
      });
    },
    [inputChartRelatedValue]
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
    setActionsProfit(profitabilityBySmaPeriod[mostProfitableSmaPeriod]);

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
            value={inputApiRelatedValue.name}
            onChange={handleInputApiRelatedChange}
          />
        </label>
        <label htmlFor="period">
          period:
          <select
            name="period"
            id="period"
            defaultValue={FORM_CHART_RELATED_DEFAULT_VALUE.period}
            onChange={handleInputChartRelatedChange}
          >
            <option value="180">15 year</option>
            <option value="120">10 year</option>
            <option value="60">5 year</option>
            <option value="36">3 year</option>
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
            defaultValue={FORM_API_RELATED_DEFAULT_VALUE.timeFrame}
            onChange={handleInputApiRelatedChange}
          >
            {/* <option value="monthly">M</option> */}
            <option value="monthly">M</option>
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

      <CandlestickChart
        calculationsStartDate={calculationsStartDate}
        fetchedStockData={stockData}
        smaPeriod={mostProfitableSma}
        smaValues={smaValues}
        actionsProfit={actionsProfit}
      />
    </div>
  );
};

export default Home;
