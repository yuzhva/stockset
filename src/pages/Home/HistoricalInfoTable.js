import React from 'react';

import { calcProbability } from './historical-calculations';

const HistoricalInfoTable = ({ stockData, mostProfitableSma }) => {
  const {
    numOfUpTrend,
    numOfDownTrend,
    changeOfUpTrend,
    changeOfDownTrend,
  } = React.useMemo(() => calcProbability(stockData, mostProfitableSma), [
    stockData,
    mostProfitableSma,
  ]);

  return (
    <table>
      <thead>
        <tr>
          <th colSpan="2">SMA</th>
          <th colSpan="4">Trend</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          {/* SMA */}
          <td rowSpan="2">Most profitable period:</td>
          <td rowSpan="2">{mostProfitableSma}</td>

          {/* Trend */}
          <td>Up trend:</td>
          <td>{numOfUpTrend}</td>
          <td>probability:</td>
          <td>{`${changeOfUpTrend || 'x'} %`}</td>
        </tr>

        <tr>
          {/* Trend */}
          <td>Down trend:</td>
          <td>{numOfDownTrend}</td>
          <td>probability:</td>
          <td>{`${changeOfDownTrend || 'x'} %`}</td>
        </tr>
      </tbody>
    </table>
  );
};

export default HistoricalInfoTable;
