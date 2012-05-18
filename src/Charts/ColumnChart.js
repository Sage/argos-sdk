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

define('Sage/Platform/Mobile/Charts/ColumnChart', [
    'dojo/_base/declare',
    'dojo/dom-geometry',
    'Sage/Platform/Mobile/Charts/_Chart',
    'Sage/Platform/Mobile/ChartManager',
    'dojox/charting/plot2d/Columns',
    'dojox/charting/plot2d/Markers',
    'dojox/charting/axis2d/Default'
], function(
    declare,
    domGeom,
    _Chart,
    ChartManager,
    Columns
) {
    var chart = declare('Sage.Platform.Mobile.Charts.ColumnChart', [_Chart], {
        plotType: Columns,

        plotOptions: {
            markers: true,
            gap: 5
        },

        xAxis: {
            natural: true,
            trailingSymbol: '...'
        },

        yAxis: {
            vertical: true,
            fixLower: 'major',
            fixUpper: 'major',
            minorTicks: false
        }
    });

    ChartManager.register('column', chart);

    return chart;
});