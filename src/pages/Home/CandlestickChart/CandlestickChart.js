import React from 'react';

import csmain from './csmain';

const CandlestickChart = () => (
  <div id="demobox">
    <div id="csbox">
      <div id="option">
        <input id="oneM" name="1M" type="button" value="1M" />
        <input id="threeM" name="3M" type="button" value="3M" />
        <input id="sixM" name="6M" type="button" value="6M" />
        <input id="oneY" name="1Y" type="button" value="1Y" />
        <input id="twoY" name="2Y" type="button" value="2Y" />
        <input id="fourY" name="4Y" type="button" value="4Y" />
      </div>
      <div id="infobar">
        <div id="infodate" className="infohead" />
        <div id="infoopen" className="infobox" />
        <div id="infohigh" className="infobox" />
        <div id="infolow" className="infobox" />
        <div id="infoclose" className="infobox" />
      </div>
      <div id="chart1" />
    </div>
  </div>
);

export default CandlestickChart;
