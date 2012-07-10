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

define('Sage/Platform/Mobile/Charts/ChartRegistry', [
    'dojo/_base/lang',
    './AreaChart',
    './BarChart',
    './ColumnChart',
    './LineChart',
    './PieChart'
], function(
    lang,
    AreaChart,
    BarChart,
    ColumnChart,
    LineChart,
    PieChart
) {
    var fromType = {
        'area': AreaChart,
        'bar': BarChart,
        'column': ColumnChart,
        'line': LineChart,
        'pie': PieChart
    };

    return lang.setObject('Sage.Platform.Mobile.Charts.ChartRegistry', {
        fromType: fromType,
        getChartFor: function(props, fallback) {
            var name = typeof props == 'string'
                ? props
                : props['type'];
            return this.fromType[name] || ((fallback !== false) && BarChart);
        },
        register: function(type, ctor) {
            fromType[type] = ctor;
        }
    });
});