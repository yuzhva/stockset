import * as d3 from 'd3';

import { TIntervals, TPeriod } from './csmain';

function csheader() {
  function cshrender(selection) {
    selection.each(function (data) {
      const interval = TIntervals[TPeriod];
      const format =
        interval === 'month'
          ? d3.timeFormat('%b %Y')
          : d3.timeFormat('%b %d %Y');
      const dateprefix =
        interval === 'month'
          ? 'Month of '
          : interval === 'week'
          ? 'Week of '
          : '';
      d3.select('#infodate').text(dateprefix + format(data.TIMESTAMP));
      d3.select('#infoopen').text(`O ${data.OPEN}`);
      d3.select('#infohigh').text(`H ${data.HIGH}`);
      d3.select('#infolow').text(`L ${data.LOW}`);
      d3.select('#infoclose').text(`C ${data.CLOSE}`);
    });
  } // cshrender

  return cshrender;
} // csheader

export default csheader;
