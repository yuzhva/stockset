import * as d3 from 'd3';

import { TFormat, TIntervals, TPeriod } from './csmain';

function cschart(genData, smaValues) {
  const margin = { top: 0, right: 30, bottom: 40, left: 5 };
  const width = 620;
  const height = 300;
  let Bheight = 460;

  function csrender(selection) {
    selection.each(function () {
      const interval = TIntervals[TPeriod];

      const minimal = d3.min(genData, function (d) {
        return d.LOW;
      });
      const maximal = d3.max(genData, function (d) {
        return d.HIGH;
      });

      const x = d3.scaleBand().range([0, width]);

      const y = d3.scaleLinear().range([height, 0]);

      const xAxis = d3
        .axisBottom(x)
        .tickFormat(d3.timeFormat(TFormat[interval]));

      // const yAxis = d3.axisBottom(y)
      //     .ticks(Math.floor(height/50));

      x.domain(
        genData.map(function (d) {
          return d.TIMESTAMP;
        })
      );
      y.domain([minimal, maximal]).nice();

      const xtickdelta = Math.ceil(60 / (width / genData.length));
      xAxis.tickValues(
        x.domain().filter(function (d, i) {
          return !((i + Math.floor(xtickdelta / 2)) % xtickdelta);
        })
      );

      const barwidth = x.bandwidth();
      const candlewidth = Math.floor(d3.min([barwidth * 0.8, 13]) / 2) * 2 + 1;
      const delta = Math.round((barwidth - candlewidth) / 2);

      d3.select(this).select('svg').remove();
      const svg = d3
        .select(this)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', Bheight + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      svg
        .append('g')
        .attr('class', 'axis xaxis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis.tickSizeOuter(0));
      // .call(xAxis.orient("bottom").outerTickSize(0));

      svg
        .append('g')
        .attr('class', 'axis yaxis')
        .attr('transform', `translate(${width},0)`)
        .call(
          d3
            .axisRight(y)
            .ticks(Math.floor(height / 50))
            .tickSize(0)
        );
      // .call(yAxis.orient("right").tickSize(0));

      svg
        .append('g')
        .attr('class', 'axis grid')
        .attr('transform', `translate(${width},0)`)
        .call(
          d3
            .axisLeft(y)
            .ticks(Math.floor(height / 50))
            .tickFormat('')
            .tickSize(width)
            .tickSizeOuter(0)
        );
      // .call(yAxis.orient("left").tickFormat("").tickSize(width).outerTickSize(0));

      if (smaValues) {
        const smaLine = d3
          .line()
          .defined((d) => Boolean(d.value))
          .x((d) => x(d.TIMESTAMP))
          .y((d) => y(d.value));

        svg
          .append('path')
          .datum(smaValues)
          .attr('fill', 'none')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', 1.5)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('d', smaLine);
      }

      const bands = svg
        .selectAll('.bands')
        .data([genData])
        .enter()
        .append('g')
        .attr('class', 'bands');

      bands
        .selectAll('rect')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('rect')
        .attr('x', function (d) {
          return x(d.TIMESTAMP) + Math.floor(barwidth / 2);
        })
        .attr('y', 0)
        .attr('height', Bheight)
        .attr('width', 1)
        .attr('class', function (d, i) {
          return `band${i}`;
        })
        .style('stroke-width', Math.floor(barwidth));

      const stick = svg
        .selectAll('.sticks')
        .data([genData])
        .enter()
        .append('g')
        .attr('class', 'sticks');

      stick
        .selectAll('rect')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('rect')
        .attr('x', function (d) {
          return x(d.TIMESTAMP) + Math.floor(barwidth / 2);
        })
        .attr('y', function (d) {
          return y(d.HIGH);
        })
        .attr('class', function (d, i) {
          return `stick${i}`;
        })
        .attr('height', function (d) {
          return y(d.LOW) - y(d.HIGH);
        })
        .attr('width', 1)
        .classed('rise', function (d) {
          return d.CLOSE > d.OPEN;
        })
        .classed('fall', function (d) {
          return d.OPEN > d.CLOSE;
        });

      const candle = svg
        .selectAll('.candles')
        .data([genData])
        .enter()
        .append('g')
        .attr('class', 'candles');

      candle
        .selectAll('rect')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('rect')
        .attr('x', function (d) {
          return x(d.TIMESTAMP) + delta;
        })
        .attr('y', function (d) {
          return y(d3.max([d.OPEN, d.CLOSE]));
        })
        .attr('class', function (d, i) {
          return `candle${i}`;
        })
        .attr('height', function (d) {
          return y(d3.min([d.OPEN, d.CLOSE])) - y(d3.max([d.OPEN, d.CLOSE]));
        })
        .attr('width', candlewidth)
        .classed('rise', function (d) {
          return d.CLOSE > d.OPEN;
        })
        .classed('fall', function (d) {
          return d.OPEN > d.CLOSE;
        });
    });
  } // csrender

  csrender.Bheight = function (value) {
    if (!arguments.length) return Bheight;
    Bheight = value;
    return csrender;
  };

  return csrender;
} // cschart

export default cschart;
