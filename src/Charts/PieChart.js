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

define('Sage/Platform/Mobile/Charts/PieChart', [
    'dojo/_base/declare',
    'dojo/dom-geometry',
    'dojo/window',
    'Sage/Platform/Mobile/Charts/_Chart',
    'Sage/Platform/Mobile/ChartManager',
    'dojox/charting/plot2d/Pie',
    'dojox/charting/axis2d/Default'
], function(
    declare,
    domGeom,
    win,
    _Chart,
    ChartManager,
    PiePlot
) {
    var chart = declare('Sage.Platform.Mobile.Charts.PieChart', [_Chart], {
        plotType: PiePlot,
        plotOptions: {
            labelOffset: '-15'
        },
        _onResize: function() {
            var radius = this.getRadius();
            if (this.chart && this.chart.stack)
                this.chart.stack[0].opt.radius = radius;

            this.inherited(arguments);
        },
        setSize: function() {
            var radius = this.getRadius();
            domGeom.setMarginBox(this.chartNode, {
                h: radius * 3,
                w: radius * 5
            });
        },
        getType: function() {
            var type = this.inherited(arguments);
            type['radius'] = this.getRadius();
            return type;
        },
        getRadius: function() {
            var box = win.getBox(),
                width = box.w,
                height = (box.h > this.maxHeight) ? this.maxHeight : box.h;

            return Math.floor((width > height ? height : width) / 5);
        },
        getAxes: function() {
            return [];
        }
    });

    ChartManager.register('pie', chart);

    return chart;
});