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

define('Sage/Platform/Mobile/Charts/BarChart', [
    'dojo/_base/declare',
    'dojo/window',
    'dojo/dom-geometry',
    'Sage/Platform/Mobile/Charts/_Chart',
    'Sage/Platform/Mobile/ChartManager',
    'dojox/charting/plot2d/Bars',
    'dojox/charting/axis2d/Default'
], function(
    declare,
    win,
    domGeom,
    _Chart,
    ChartManager,
    Bars
) {
    var chart = declare('Sage.Platform.Mobile.Charts.BarChart', [_Chart], {
        xAxis: {
            fixLower: 'major',
            fixUpper: 'major',
            minorTicks: false
        },
        yAxis: {
            vertical: true,
            fixLower: 'major',
            fixUpper: 'none',
            minorTicks: false
        },
        plotType: Bars,
        plotOptions: {
            gap: 5
        },

        setSize: function() {
            var box = win.getBox(),
                ratio = 1.618,
                height = (box.h > this.maxHeight) ? this.maxHeight : box.h,
                width = box.w,
                newHeight = 0,
                newWidth = 0;

            if (width > height && height * ratio < width)
            {
                newWidth = Math.floor(height * ratio);
                newHeight = height;
            }
            else
            {
                newWidth = width;
                newHeight = Math.floor(width / ratio);
            }

            domGeom.setMarginBox(this.chartNode, {
                h: newHeight,
                w: newWidth
            });


            if (this.chart && this.chart.axes['x'] && this.feed)
            {
                var axes = this.getAxes();
                this.chart.addAxis(axes[0].axis, axes[0].options);
            }
        }
    });

    ChartManager.register('bar', chart);

    return chart;
});