import * as d3 from 'd3';

import barchart from './csbars';
import cschart from './cschart';
import csheader from './csheader';

export const TPeriod = '3M';
export const TIntervals = {
  '1M': 'day',
  '3M': 'day',
  '6M': 'day',
  '1Y': 'week',
  '2Y': 'week',
  '4Y': 'month',
};
export const TFormat = { day: "%d %b '%y", week: "%d %b '%y", month: "%b '%y" };
let genData;

function displayGen(mark) {
  const header = csheader();
  d3.select('#infobar').datum(genData.slice(mark)[0]).call(header);
}

function hoverAll() {
  d3.select('#chart1')
    .select('.bands')
    .selectAll('rect')
    .on('mouseover', function (d, i) {
      d3.select(this).classed('hoved', true);
      d3.select(`.stick${i}`).classed('hoved', true);
      d3.select(`.candle${i}`).classed('hoved', true);
      d3.select(`.volume${i}`).classed('hoved', true);
      d3.select(`.sigma${i}`).classed('hoved', true);
      displayGen(i);
    })
    .on('mouseout', function (d, i) {
      d3.select(this).classed('hoved', false);
      d3.select(`.stick${i}`).classed('hoved', false);
      d3.select(`.candle${i}`).classed('hoved', false);
      d3.select(`.volume${i}`).classed('hoved', false);
      d3.select(`.sigma${i}`).classed('hoved', false);
      displayGen(genData.length - 1);
    });
}

function displayCS(
  calculationsStartDate,
  fetchedStockData,
  smaPeriod,
  smaValues,
  actionsProfit
) {
  const chart = cschart(
    calculationsStartDate,
    fetchedStockData,
    smaPeriod,
    smaValues,
    actionsProfit
  ).Bheight(460);
  d3.select('#chart1').call(chart);
  // var chart       = barchart().mname("volume").margin(320).MValue("TURNOVER");
  // d3.select("#chart1").datum(fetchedStockData).call(chart);
  // var chart       = barchart().mname("sigma").margin(400).MValue("VOLATILITY");
  // d3.select("#chart1").datum(fetchedStockData).call(chart);
  hoverAll();
}

function displayAll(
  calculationsStartDate,
  fetchedStockData,
  smaPeriod,
  smaValues,
  actionsProfit
) {
  displayCS(
    calculationsStartDate,
    fetchedStockData,
    smaPeriod,
    smaValues,
    actionsProfit
  );
  displayGen(fetchedStockData.length - 1);
}

// https://medium.com/@anilnairxyz/candlestick-chart-using-d3-a7f978578cd7
export function drawD3Chart(
  calculationsStartDate,
  fetchedStockData,
  smaPeriod,
  smaValues,
  actionsProfit
) {
  genData = fetchedStockData;
  displayAll(
    calculationsStartDate,
    fetchedStockData,
    smaPeriod,
    smaValues,
    actionsProfit
  );
}
