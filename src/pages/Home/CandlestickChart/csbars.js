import * as d3 from 'd3';

import { TFormat, TIntervals, TPeriod } from './csmain';

function barchart() {

  var margin = {top: 300, right: 30, bottom: 10, left: 5 },
      width = 620, height = 60, mname = "mbar1";

  var MValue = "TURNOVER";

  function barrender(selection) {
    selection.each(function(data) {
      const isDataExist = Boolean(data[0][MValue]);
      if (!isDataExist) return;

      var x = d3.scaleBand()
          .range([0, width]);

      var y = d3.scaleLinear()
          .range([height, 0]);

      var xAxis = d3.axisBottom(x)
          .tickFormat(d3.timeFormat(TFormat[TIntervals[TPeriod]]));

      var yAxis = d3.axisRight(y)
          .ticks(Math.floor(height/50));

      var svg = d3.select(this).select("svg")
         .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain(data.map(function(d) { return d.TIMESTAMP; }));
      y.domain([0, d3.max(data, function(d) { return d[MValue] || 0; })]).nice();

      var xtickdelta   = Math.ceil(60/(width/data.length))
      xAxis.tickValues(x.domain().filter(function(d, i) { return !((i+Math.floor(xtickdelta/2)) % xtickdelta); }));

      svg.append("g")
          .attr("class", "axis yaxis")
          .attr("transform", "translate(" + width + ",0)")
          .call(yAxis.tickFormat("").tickSize(0));

//      svg.append("g")
//          .attr("class", "axis yaxis")
//          .attr("transform", "translate(0,0)")
//          .call(yAxis.orient("left"));

      var barwidth    = x.bandwidth();
      var fillwidth   = (Math.floor(barwidth*0.9)/2)*2+1;
      var bardelta    = Math.round((barwidth-fillwidth)/2);

      var mbar = svg.selectAll("."+mname+"bar")
          .data([data])
        .enter().append("g")
          .attr("class", mname+"bar");

      mbar.selectAll("rect")
          .data(function(d) { return d; })
        .enter().append("rect")
          .attr("class", mname+"fill")
          .attr("x", function(d) { return x(d.TIMESTAMP) + bardelta; })
          .attr("y", function(d) { return y(d[MValue] || 0); })
          .attr("class", function(d, i) { return mname+i; })
          .attr("height", function(d) { return y(0) - y(d[MValue] || 0); })
          .attr("width", fillwidth);
    });
  } // barrender
  barrender.mname = function(value) {
          	if (!arguments.length) return mname;
          	mname = value;
          	return barrender;
      	};

  barrender.margin = function(value) {
          	if (!arguments.length) return margin.top;
          	margin.top = value;
          	return barrender;
      	};

  barrender.MValue = function(value) {
          	if (!arguments.length) return MValue;
          	MValue = value;
          	return barrender;
      	};

return barrender;
} // barchart

export default barchart;
