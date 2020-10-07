import React from 'react';
import AsyncSelect from 'react-select/async';

import useCallbackDebounce from 'react-ui-elements/src/hooks/useCallbackDebounce';

import CandlestickChart from './CandlestickChart';
import HistoricalInfoTable from './HistoricalInfoTable';

import {
  findMostProfitableSMA,
  calcCandleMovesInfo,
  createNextCandlesBasedOnHistoryInfo,
} from './historical-calculations';

// Tiingo API
// import { useTiingoAPI } from './tiingoAPI';

// IB API
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

const NEXT_CANDLES_FORM_VALUE = {
  numOfRemovedHistoryCandles: '0',

  isNextCandlesEnabled: false,

  numOfCandles: '1',
  moveDirection: 'STRAIGHTFORWARD',
  moveSource: 'AVG_PERIOD',
  isDirectionInverted: false,
};

const Home = () => {
  const [smaValues, setSmaValues] = React.useState();
  const [actionsProfit, setActionsProfit] = React.useState();

  const [candleMovesInfo, setCandleMovesInfo] = React.useState();

  const [instantFormValue, setInstantFormValue] = React.useState(
    INSTANT_FORM_DEFAULT_VALUE
  );
  const [debounceFormValue, setDebounceFormValue] = React.useState({
    ...instantFormValue,
  });
  const [nextCandlesFormValue, setNextCandlesFormValue] = React.useState(
    NEXT_CANDLES_FORM_VALUE
  );

  // Tiingo API
  // const [stockData, refreshStockData] = useTiingoAPI();

  // IB API
  const [stockData, refreshStockData] = useIBAPI();

  const [mostProfitableSma, setMostProfitableSma] = React.useState();

  const possiblyCroppedStockData = React.useMemo(() => {
    if (!stockData) return null;

    const numOfRemovedHistoryCandles = Number(
      nextCandlesFormValue.numOfRemovedHistoryCandles
    );

    // NOTE: remove last N elements of array
    const croppedStockData = numOfRemovedHistoryCandles
      ? [...stockData].slice(0, stockData.length - numOfRemovedHistoryCandles)
      : stockData;

    return croppedStockData;
  }, [stockData, nextCandlesFormValue.numOfRemovedHistoryCandles]);

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

  const handleNextCandlesFormChange = React.useCallback(
    (e) => {
      setNextCandlesFormValue({
        ...nextCandlesFormValue,
        [e.currentTarget.name]: e.currentTarget.value,
      });
    },
    [nextCandlesFormValue]
  );

  const toggleNextCandlesFormCheckbox = React.useCallback(
    (e) => {
      setNextCandlesFormValue({
        ...nextCandlesFormValue,
        [e.currentTarget.name]: !nextCandlesFormValue[e.currentTarget.name],
      });
    },
    [nextCandlesFormValue]
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
    const {
      mostProfitableSmaPeriod,
      mostProfitableSmaValues,
      mostProfitableActions,
      actionsProfitability,
    } = findMostProfitableSMA(possiblyCroppedStockData);

    const candleMoves = calcCandleMovesInfo(
      possiblyCroppedStockData,
      mostProfitableSmaPeriod
    );

    // Save
    setMostProfitableSma(mostProfitableSmaPeriod);
    setSmaValues(mostProfitableSmaValues);
    setActionsProfit(mostProfitableActions);
    setCandleMovesInfo(candleMoves);

    console.warn('taken actions', mostProfitableActions);
    console.warn('actions profit', actionsProfitability);
  }, [possiblyCroppedStockData]);

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

  const nextCandles = React.useMemo(() => {
    if (!nextCandlesFormValue.isNextCandlesEnabled || !candleMovesInfo)
      return null;

    return createNextCandlesBasedOnHistoryInfo(candleMovesInfo, {
      numOfCandles: nextCandlesFormValue.numOfCandles,
      moveDirection: nextCandlesFormValue.moveDirection,
      moveSource: nextCandlesFormValue.moveSource,
      isDirectionInverted: nextCandlesFormValue.isDirectionInverted,
    });
  }, [candleMovesInfo, nextCandlesFormValue]);

  const combinedStockData = React.useMemo(
    () =>
      nextCandles
        ? [...possiblyCroppedStockData, ...nextCandles]
        : possiblyCroppedStockData,
    [nextCandles, possiblyCroppedStockData]
  );

  return (
    <div>
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

          <button type="button" onClick={onBtnCalcSmaClick}>
            Calc best SMA
          </button>
        </div>

        <br />
        <hr />
        <br />

        <div className="control">
          <label htmlFor="numOfRemovedHistoryCandles">
            &nbsp;numOfRemovedHistoryCandles&nbsp;
            <select
              name="numOfRemovedHistoryCandles"
              id="numOfRemovedHistoryCandles"
              defaultValue={NEXT_CANDLES_FORM_VALUE.numOfRemovedHistoryCandles}
              onChange={handleNextCandlesFormChange}
            >
              {mostProfitableSma && (
                <option value={mostProfitableSma}>
                  {mostProfitableSma} - SMA
                </option>
              )}
              <option value="130">130 | 15m*5d - 5d</option>
              <option value="40">40 | 4h*2*5 - 5d</option>
              <option value="26">26 | 15m - 1d</option>
              <option value="5">5 | 1d - 5d</option>
              <option value="1">1 | 1w - 5d</option>
              <option value="0">0 | Do NOT remove</option>
            </select>
          </label>
        </div>

        <br />
        <hr />

        <div className="control">
          <label htmlFor="isNextCandlesEnabled">
            Render Next Candles:
            <input
              id="isNextCandlesEnabled"
              name="isNextCandlesEnabled"
              type="checkbox"
              value={nextCandlesFormValue.isNextCandlesEnabled}
              onChange={toggleNextCandlesFormCheckbox}
            />
          </label>

          {/* <label htmlFor="numOfCandles">
            numOfCandles:
            <input
              id="numOfCandles"
              name="numOfCandles"
              type="number"
              value={nextCandlesFormValue.numOfCandles}
              onChange={handleNextCandlesFormChange}
            />
          </label> */}

          <label htmlFor="numOfCandles">
            &nbsp;numOfCandles&nbsp;
            <br />
            <select
              name="numOfCandles"
              id="numOfCandles"
              defaultValue={NEXT_CANDLES_FORM_VALUE.numOfCandles}
              onChange={handleNextCandlesFormChange}
            >
              {mostProfitableSma && (
                <option value={mostProfitableSma}>
                  {mostProfitableSma} - SMA
                </option>
              )}
              <option value="130">130 | 15m*5d - 5d</option>
              <option value="40">40 | 4h*2*5 - 5d</option>
              <option value="26">26 | 15m - 1d</option>
              <option value="5">5 | 1d - 5d</option>
              <option value="2">2 | 2w - 10d</option>
              <option value="1">1 | 1w - 5d</option>
            </select>
          </label>

          <div>
            <p>movement:</p>

            <label htmlFor="moveSource">
              &nbsp;source&nbsp;
              <select
                name="moveSource"
                id="moveSource"
                defaultValue={NEXT_CANDLES_FORM_VALUE.moveSource}
                onChange={handleNextCandlesFormChange}
              >
                <option value="AVG_PERIOD">AVG PERIOD</option>
                <option value="TOP_PERIOD">TOP PERIOD</option>
                <option value="TOP_HISTORY">TOP HISTORY</option>
              </select>
            </label>

            <label htmlFor="moveDirection">
              &nbsp;direction&nbsp;
              <select
                name="moveDirection"
                id="moveDirection"
                defaultValue={NEXT_CANDLES_FORM_VALUE.moveDirection}
                onChange={handleNextCandlesFormChange}
              >
                <option value="STRAIGHTFORWARD">STRAIGHTFORWARD</option>
                <option value="PERIOD_AVERAGE">PERIOD AVERAGE</option>
              </select>
            </label>
          </div>

          <label htmlFor="isDirectionInverted">
            Inverted:
            <input
              id="isDirectionInverted"
              name="isDirectionInverted"
              type="checkbox"
              value={nextCandlesFormValue.isDirectionInverted}
              onChange={toggleNextCandlesFormCheckbox}
            />
          </label>
        </div>
      </div>

      <CandlestickChart
        // fetchedStockData={stockData}
        fetchedStockData={combinedStockData}
        smaPeriod={mostProfitableSma}
        smaValues={smaValues}
        actionsProfit={actionsProfit}
      />

      <HistoricalInfoTable
        stockData={stockData}
        mostProfitableSma={mostProfitableSma}
      />
    </div>
  );
};

export default Home;
