import React from 'react';
import AsyncSelect from 'react-select/async';
import { SMA } from 'technicalindicators';

import useCallbackDebounce from 'react-ui-elements/src/hooks/useCallbackDebounce';

import CandlestickChart from './CandlestickChart';

import { createStrategyActions, calculateProfitability } from './strategy';
import { syncSmaValuesWithStockDate } from './utils';

import { useTiingoAPI } from './tiingoAPI';
import { useIBAPI, postSymbolSearch } from './ibAPI';

import { PERIOD_TYPE, BAR_TYPE } from './constants';

const INSTANT_FORM_DEFAULT_VALUE = {
  // Tiingo API
  // ticker: 'spy',

  periodSize: '1',
  periodType: PERIOD_TYPE.M,

  barSize: '4',
  barType: BAR_TYPE.H,
};

const SMA_PERIOD_MIN = 8;

const Home = () => {
  const [smaValues, setSmaValues] = React.useState();
  const [actionsProfit, setActionsProfit] = React.useState();

  const [instantFormValue, setInstantFormValue] = React.useState(
    INSTANT_FORM_DEFAULT_VALUE
  );
  const [debounceFormValue, setDebounceFormValue] = React.useState({
    ...instantFormValue,
  });

  // Tiingo API
  // const [stockData, refreshStockData] = useTiingoAPI();

  // IB API
  const [stockData, refreshStockData] = useIBAPI();

  const [mostProfitableSma, setMostProfitableSma] = React.useState('');

  // Tiingo API
  // React.useEffect(() => {
  //   refreshStockData({
  //     ticker: debounceFormValue.ticker,

  //     periodSize: debounceFormValue.periodSize,
  //     periodType: debounceFormValue.periodType,

  //     barSize: debounceFormValue.barSize,
  //     barType: debounceFormValue.barType,
  //   });
  // }, [debounceFormValue]);

  // IB API
  React.useEffect(() => {
    refreshStockData({
      conid: debounceFormValue.conid,
      period: `${debounceFormValue.periodSize}${debounceFormValue.periodType}`,
      bar: `${debounceFormValue.barSize}${debounceFormValue.barType}`,
    });
  }, [debounceFormValue]);

  // Component handlers
  const handleDebounceFormChange = useCallbackDebounce(
    ({ current }) => {
      const [refDebounceFormValue, refInstantFormValue] = current;
      setDebounceFormValue({
        ...refDebounceFormValue,
        ...refInstantFormValue,
      });
    },
    [debounceFormValue, instantFormValue],
    3000
  );

  const handleInstantFormChange = React.useCallback(
    (e) => {
      setInstantFormValue({
        ...instantFormValue,
        [e.currentTarget.name]: e.currentTarget.value,
      });
      handleDebounceFormChange();
    },
    [instantFormValue]
  );

  const handleSelectChange = React.useCallback(
    (selectedOption, inputProps) => {
      if (selectedOption) {
        setDebounceFormValue({
          ...debounceFormValue,
          [inputProps.name]: selectedOption.value,
        });
      }
    },
    [debounceFormValue]
  );

  const onBtnCalcSmaClick = React.useCallback(() => {
    const smaByPeriod = {};
    const closePrices = stockData.map((sD) => sD.CLOSE);
    const smaMaxPeriod = Math.min(closePrices.length, 365); // days in 1 year

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

    // Step 4: save results
    setMostProfitableSma(mostProfitableSmaPeriod);
    setSmaValues(smaByPeriod[mostProfitableSmaPeriod]);
    setActionsProfit(profitabilityBySmaPeriod[mostProfitableSmaPeriod]);

    console.warn('taken actions', actionsBySmaPeriod[mostProfitableSmaPeriod]);
    console.warn(
      'actions profit',
      profitabilityBySmaPeriod[mostProfitableSmaPeriod]
    );
  }, [stockData]);

  const promiseSymbolOptions = useCallbackDebounce(
    (cbRef, inputValue, callback) => {
      if (!inputValue) return null;

      return postSymbolSearch({
        symbol: inputValue,
      }).then((resAsJson) => {
        const selectOptions = resAsJson.map((searchRes) => ({
          label: `${searchRes.symbol} - ${searchRes.companyHeader}`,
          value: searchRes.conid,
        }));
        callback(selectOptions);
      });
    },
    [],
    3000
  );

  return (
    <div>
      <div className="control">
        <div className="control__select">
          <p>ticker:</p>
          <AsyncSelect
            name="conid"
            loadOptions={promiseSymbolOptions}
            onChange={handleSelectChange}
            cacheOptions
            defaultOptions
            isClearable
          />
        </div>

        {/* // Tiingo API */}
        {/*
        <label htmlFor="ticker">
          ticker:
          <input
            id="ticker"
            name="ticker"
            type="text"
            maxLength={4}
            value={instantFormValue.ticker}
            onChange={handleInstantFormChange}
          />
        </label>
        */}
        {/*
        <label htmlFor="periodSize">
          period size:
          <input
            id="periodSize"
            name="periodSize"
            type="number"
            max={180}
            value={instantFormValue.periodSize}
            onChange={handleInstantFormChange}
          />
        </label>
        */}
        <div>
          <p>period:</p>
          <label htmlFor="periodSize">
            &nbsp;size&nbsp;
            <select
              name="periodSize"
              id="periodSize"
              defaultValue={INSTANT_FORM_DEFAULT_VALUE.periodSize}
              onChange={handleInstantFormChange}
            >
              <option value="15">15 | y</option>
              <option value="10">10 | y</option>
              <option value="6">6 | 0.5y</option>

              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </label>
          <label htmlFor="periodType">
            &nbsp;type&nbsp;
            <select
              name="periodType"
              id="periodType"
              defaultValue={INSTANT_FORM_DEFAULT_VALUE.periodType}
              onChange={handleInstantFormChange}
            >
              <option value={PERIOD_TYPE.Y}>{PERIOD_TYPE.Y}</option>
              <option value={PERIOD_TYPE.M}>{PERIOD_TYPE.M}</option>
              <option value={PERIOD_TYPE.W}>{PERIOD_TYPE.W}</option>
              <option value={PERIOD_TYPE.D}>{PERIOD_TYPE.D}</option>
              <option value={PERIOD_TYPE.H}>{PERIOD_TYPE.H}</option>
              <option value={PERIOD_TYPE.MIN}>{PERIOD_TYPE.MIN}</option>
            </select>
          </label>
        </div>
        <div>
          <p>bar:</p>
          {/*
          <label htmlFor="barSize">
            bar size:
            <input
              id="barSize"
              name="barSize"
              type="number"
              max={30}
              value={instantFormValue.barSize}
              onChange={handleInstantFormChange}
            />
          </label>
          */}
          <label htmlFor="barSize">
            &nbsp;size&nbsp;
            <select
              name="barSize"
              id="barSize"
              defaultValue={INSTANT_FORM_DEFAULT_VALUE.barSize}
              onChange={handleInstantFormChange}
            >
              <option value="15">15</option>
              <option value="4">4</option>
              <option value="1">1</option>
            </select>
          </label>
          <label htmlFor="barType">
            &nbsp;type&nbsp;
            <select
              name="barType"
              id="barType"
              defaultValue={INSTANT_FORM_DEFAULT_VALUE.barType}
              onChange={handleInstantFormChange}
            >
              <option value={BAR_TYPE.M}>{BAR_TYPE.M}</option>
              <option value={BAR_TYPE.W}>{BAR_TYPE.W}</option>
              <option value={BAR_TYPE.D}>{BAR_TYPE.D}</option>
              <option value={BAR_TYPE.H}>{BAR_TYPE.H}</option>
              <option value={BAR_TYPE.MIN}>{BAR_TYPE.MIN}</option>
            </select>
          </label>
        </div>
        <label htmlFor="sma">
          SMA:
          <input
            id="sma"
            name="sma"
            type="number"
            value={mostProfitableSma}
            readOnly
          />
        </label>
        <button type="button" onClick={onBtnCalcSmaClick}>
          Calc best SMA
        </button>
      </div>

      <CandlestickChart
        fetchedStockData={stockData}
        smaPeriod={mostProfitableSma}
        smaValues={smaValues}
        actionsProfit={actionsProfit}
      />
    </div>
  );
};

export default Home;
