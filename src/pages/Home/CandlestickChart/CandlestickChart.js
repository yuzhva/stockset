import React from 'react';

import { drawD3Chart } from './csmain';

const CandlestickChart = ({
  fetchedStockData,
  smaPeriod,
  smaValues,
  actionsProfit,
}) => {
  React.useEffect(() => {
    if (fetchedStockData)
      drawD3Chart(fetchedStockData, smaPeriod, smaValues, actionsProfit);
  }, [fetchedStockData, smaPeriod, smaValues, actionsProfit]);

  return (
    <div id="demobox">
      <div id="csbox">
        <div id="infobar">
          <div id="infodate" className="infohead" />
          <div id="infoopen" className="infobox" />
          <div id="infohigh" className="infobox" />
          <div id="infolow" className="infobox" />
          <div id="infoclose" className="infobox" />
          <div id="infosma" className="infobox" />
        </div>
        <div id="chart1" />
      </div>
    </div>
  );
};

export default CandlestickChart;
