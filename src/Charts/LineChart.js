/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define('Sage/Platform/Mobile/Charts/LineChart', [
    'dojo/_base/declare',
    'dojo/window',
    'dojo/dom-geometry',
    './_Chart',
    'dojox/charting/plot2d/Lines',
    'dojox/charting/plot2d/Markers',
    'dojox/charting/axis2d/Default'
], function(
    declare,
    win,
    domGeom,
    _Chart,
    LinesPlot
) {
    return declare('Sage.Platform.Mobile.Charts.LineChart', [_Chart], {
        legend: true,
        xAxis: {
            minorTicks: false
        },
        yAxis: {
            vertical: true,
            minorTicks: false,
            fixLower: 'none',
            fixUpper: 'minor'
        },
        plotType: LinesPlot,
        plotOptions: {
            markers: false,
            tension: 'X'
        },
        getAxes: function() {
            var axes = this.inherited(arguments);

            if (this.feed)
                axes[0].options.maxLabelSize = Math.floor(domGeom.getMarginBox(this.chartNode).w / (this.feed.length + 3.5));

            return axes;
        },

        setSize: function() {
            this.inherited(arguments);

            if (this.chart && this.chart.axes['x'])
            {
                var axes = this.getAxes();
                this.chart.addAxis(axes[0].axis, axes[0].options);
            }
        }
    });
});