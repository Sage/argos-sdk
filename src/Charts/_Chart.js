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

define('Sage/Platform/Mobile/Charts/_Chart', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/string',
    'dojo/dom-class',
    'dojox/charting/Chart',
    'dojox/charting/widget/Legend',
    'Sage/Platform/Mobile/Charts/SageTheme',
    'dijit/_Widget',
    'Sage/Platform/Mobile/_ActionMixin',
    'Sage/Platform/Mobile/_Templated'
], function(
    declare,
    lang,
    array,
    string,
    domClass,
    Chart,
    Legend,
    theme,
    _Widget,
    _ActionMixin,
    _Templated
) {

    return declare('Sage.Platform.Mobile.Charts._Chart', [_Widget, _ActionMixin, _Templated], {
        widgetTemplate: new Simplate([
            '<div class="panel panel-content chart-panel">',
                '<div class="chart" data-dojo-attach-point="chartNode"></div>',
                '<div class="legend" data-dojo-attach-point="legendNode"></div>',
                '{%! $.loadingTemplate %}',
            '</div>'
        ]),
        loadingTemplate: new Simplate([
            '<div class="panel-loading-indicator">',
                '<div class="row"><div>{%: $.loadingText %}</div></div>',
            '</div>'
        ]),
        chartNode: null,
        legendNode: null,

        loadingText: 'loading...',

        chart: null,
        defaultTheme: theme,
        legend: false,
        xAxis: null,
        yAxis: null,
        plotOptions: null,
        legendOptions: {},
        titleOptions: {},

        constructor: function(o) {
            lang.mixin(this, o);
        },
        postCreate: function() {
            this.inherited(arguments);
            this.subscribe('/app/resize', this._onResize);
        },
        _onResize: function() {
            this.setSize();

            if (this.chart)
                this.chart.resize();
        },

        /**
         * Called to resize the chartNode to correct proportions
         */
        setSize: function() {

        },

        /**
         * Returns charting theme object
         */
        getTheme: function() {
            return this.theme || this.defaultTheme;
        },

        /**
         * Returns object defining type and other options (markers, gaps)
         */
        getType: function() {
            return lang.mixin({}, {
                type: this.plotType
            }, this.plotOptions);
        },

        /**
         * Returns an object defining an axis/axes and options:
         */
        getAxes: function() {
            var xAxis = {axis: 'x', options: this.xAxis},
                yAxis = {axis: 'y', options: this.yAxis};

            return [xAxis, yAxis];
        },

        /**
         * Returns a series object defining name and data:
         * return {
         *     name: 'Population',
         *     data: [...]
         * }
         * For multi series return an array of objects defining name/data
         *
         * By default it assumes the processed feed is an array of objects with
         * $descriptor and value keys
         */
        getSeries: function(feed) {
            var values = [];

            for (var i = 1; i <= feed.length; i++)
            {
                var o = feed[i-1],
                    description = (this.seriesLabelFormat) ? this.seriesLabelFormat(o['$descriptor']) : o['$descriptor'],
                    value = o['value'];

                if (description)
                    values.push({
                        x: i,
                        y: value,
                        text: description,
                        legend: string.substitute('${0} (${1})',[description, value])
                    });
            }

            return {name: 'series1', data: values};
        },

        renderTo: function(node) {
            this.containerNode = node;
            this.placeAt(node);
            this.requestData();
        },
        expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        createRequest:function() {
            var request = new Sage.SData.Client.SDataResourceCollectionRequest(App.getService());

            var resourceKindExpr = this.expandExpression(this.resourceKind);
            if (resourceKindExpr)
                request.setResourceKind(this.resourceKind);

            request
                .getUri()
                .setPathSegment(Sage.SData.Client.SDataUri.ResourcePropertyIndex, '$queries');

            request
                .getUri()
                .setPathSegment(Sage.SData.Client.SDataUri.ResourcePropertyIndex + 1, 'executeMetric');

            request.setQueryArg('_filterName', this.filterName);
            request.setQueryArg('_metricName', this.metricName);

            var whereArgs = this.expandExpression(this.where) || {};
            whereArgs['format'] = 'json';

                for (var arg in whereArgs)
                    request.setQueryArg(arg, whereArgs[arg]);

            return request;
        },
        requestData: function() {
            domClass.add(this.chartNode, 'panel-loading');

            var request = this.createRequest();
            if (request)
                request.read({
                    success: this.onRequestDataSuccess,
                    failure: this.onRequestDataFailure,
                    aborted: this.onRequestDataAborted,
                    scope: this
                });
        },
        onRequestDataSuccess: function(feed) {
            domClass.remove(this.chartNode, 'panel-loading');
            this.processFeed(feed);
            this.setSize();
            this.render();
        },
        processFeed: function(feed) {
            this.feed = feed['$resources'];
        },
        render: function() {
            var chart = new Chart(this.chartNode, this.titleOptions);

            chart.setTheme(this.getTheme());
            chart.addPlot('default', this.getType());

            var axes = this.getAxes();
            if (!lang.isArray(axes))
                axes = [axes];
            array.forEach(axes, function(axis){
                this.addAxis(axis['axis'], axis['options'] || {});
            }, chart);

            var data = this.getSeries(this.feed);
            if (!lang.isArray(data))
                data = [data];
            array.forEach(data, function(series){
                this.addSeries(series['name'], series['data'] || {}, series['options'] || {});
            }, chart);

            chart.render();

            if (this.legend)
                new Legend(lang.mixin({},{chart: chart}, this.legendOptions), this.legendNode);

            this.chart = chart;
        }
    });
});