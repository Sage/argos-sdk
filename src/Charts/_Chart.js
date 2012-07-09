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
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/dom-geometry',
    'dojox/charting/Chart',
    'dojox/charting/widget/Legend',
    'dojox/charting/plot2d/Grid',
    'Sage/Platform/Mobile/Charts/SageTheme',
    'dijit/_WidgetBase',
    '../_TemplatedWidgetMixin'
], function(
    declare,
    lang,
    array,
    string,
    domClass,
    domConstruct,
    domStyle,
    domGeom,
    Chart,
    Legend,
    Grid,
    theme,
    _WidgetBase,
    _TemplatedWidgetMixin
) {

    return declare('Sage.Platform.Mobile.Charts._Chart', [_WidgetBase, _TemplatedWidgetMixin], {
        widgetTemplate: new Simplate([
            '<div class="detail-content chart-panel {%: $.cls %}">',
                '<div class="chart" data-dojo-attach-point="chartNode"></div>',
                '<div class="legend" data-dojo-attach-point="legendNode"></div>',
                '{%! $.loadingTemplate %}',
            '</div>'
        ]),
        loadingTemplate: new Simplate([
            '<div class="loading-indicator">',
                '<div>{%: $.loadingText %}</div>',
            '</div>'
        ]),
        chartNode: null,
        legendNode: null,

        loadingText: 'loading...',

        /**
         * Instance of the dojo chart object
         */
        chart: null,

        /**
         * The property of the object feed that will be used for label descriptions
         */
        descriptionProperty: '$descriptor',

        /**
         * The property of the object feed that will be used as the value for the plot point
         */
        valueProperty: 'value',

        /**
         * Informs the default getSeries function which axis the values will be plotted along
         * default values are 'x' or 'y'
         */
        valueAxis: 'y',

        /**
         * Default charting theme used for all charts
         */
        defaultTheme: theme,

        /**
         * Default dimension ratio for clamping width/height
         */
        ratio: 1.618,

        /**
         * Format function, if defined each text label will be passed to the format function
         * returning false will cause that point not be added
         */
        seriesLabelFormatter: null,

        /**
         * Default legend label formatting string
         */
        legendLabelTemplate: '${0} (${1})',

        /**
         * If true will create a legend in the legendNode below the chart
         */
        legend: false,

        /**
         * Legend options that will be mixed in and applied, see dojo charting Legend constructor
         */
        legendOptions: {},

        /**
         * Chart (title) options that will be mixed in and applied, see dojo charting Chart constructor
         */
        chartOptions: {},

        /**
         * Plot/type options that will be mixed in and applied, see dojo charting addPlot()
         */
        plotOptions: null,

        /**
         * X Axis options that will be mixed in and applied, see dojo charting addAxis()
         */
        xAxis: null,

        /**
         * Y Axis options that will be mixed in and applied, see dojo charting addAxis()
         */
        yAxis: null,

        /**
         * Grid plot options that will be added if defined
         */
        grid: null,

        /**
         * If defined it will be set as the onclick handler for individual plot pieces
         */
        click: null,

        /**
         * If defined it will be set as the onmouseover handler for individual plot pieces
         */
        mouseover: null,

        /**
         * If defined it will be set as the onmouseout handler for individual plot pieces
         */
        mouseout: null,

        cls: null,

        constructor: function(o) {
            lang.mixin(this, o);
        },
        postCreate: function() {
            this.inherited(arguments);
            this.subscribe('/app/resize', this._onResize);
        },
        startup: function() {
            this.inherited(arguments);
        },
        _onResize: function() {
            this.setSize();
            this.setAxisLabelSizes();

            if (this.chart)
                this.chart.resize();
        },
        clear: function() {
            if (this.chart)
                this.chart.destroy();
            domConstruct.empty(this.chartNode);
        },

        /**
         * Called to resize any labels for proper clipping
         */
        setAxisLabelSizes: function() {
            if (!this.chart || !this.feed) return;

            for (var i=0; i < this.chart.axes.length; i++)
            {
                var axis = this.chart.axes[i];

                if (axis.axis === 'x')
                    axis.options.maxLabelSize = this.getXLabelWidth;

                this.chart.addAxis(axis.axis, axis.options);
            }
        },

        /**
         * Returns the width in pixels of each label, used to set the appropriate clipping width
         */
        getXLabelWidth: function() {
            if (!this.chart || !this.feed) return null;

            var chartWidth = lang.getObject('dim.width', this.chart) || domStyle.get(this.chartNode, 'width'),
                labelDivisor = this.feed.length + 3.5;

            return Math.floor(chartWidth / labelDivisor);
        },

        /**
         * Called to resize the chartNode to correct proportions
         */
        setSize: function() {
            var box = domGeom.getMarginBox(this.domNode),
                ratio = this.ratio,
                height = box.h,
                width = box.w,
                newHeight = 0,
                newWidth = 0;

            if (this.maxHeight)
                height = height > this.maxHeight ? this.maxHeight : height;

            if (!this.ratio)
            {
                console.log(height, width);
                domStyle.set(this.chartNode, {
                    height: height+'px',
                    width: width+'px'
                });
                return;
            }

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

            domStyle.set(this.chartNode, {
                height: newHeight+'px',
                width: newWidth+'px'
            });
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

            xAxis.options.maxLabelSize = xAxis.options.maxLabelSize || this.getXLabelWidth();

            if (this.customLabels)
                this.setCustomLabels([xAxis, yAxis]);

            return [xAxis, yAxis];
        },

        setCustomLabels: function(axes) {
            if (!this.customLabels || !this.feed) return;

            var labels = [];
            for (var i = 0; i < this.feed.length; i++)
            {
                var o = this.feed[i];
                labels.push({value: i+1, text: o[this.descriptionProperty]});
            }

            for (var i = 0; i < axes.length; i++)
            {
                var axis = axes[i];
                if (axis.axis === (this.labelAxis || 'x'))
                    axis.options.labels = labels;
            }
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
            for (var i = 0; i < feed.length; i++)
            {
                var o = feed[i],
                    description = (this.seriesLabelFormatter) ? this.seriesLabelFormatter(o[this.descriptionProperty]) : o[this.descriptionProperty],
                    value = o[this.valueProperty];

                if (description)
                    values.push({
                        x: this.valueAxis === 'x' ? (value[0] || value) : i+1,
                        y: this.valueAxis === 'y' ? (value[0] ||value) : i+1,
                        text: description[0] || description,
                        legend: string.substitute(this.legendLabelTemplate,[description, value])
                    });
            }

            return {name: 'series1', data: values};
        },

        renderTo: function(node) {
            this.clear();

            this.containerNode = node;
            this.placeAt(node);

            this.requestData();
        },
        refresh: function() {
            this.clear();
            this.requestData();
        },
        expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        _getStoreAttr: function() {
            return this.store || (this.store = this.createStore());
        },
        createStore: function() {
            return null;
        },
        requestData:function() {
            domClass.add(this.chartNode, 'is-loading');
            var store = this.get('store'),
                keywordArgs = {
                    scope: this,
                    onError: this._onFetchError,
                    onAbort: this._onFetchError,
                    onComplete: this._onFetchComplete
                };
            return store.fetch(keywordArgs);
        },
        _onFetchComplete: function(items, request) {
            domClass.remove(this.chartNode, 'is-loading');
            this.processFeed(items);
            this.setSize();
            this.setAxisLabelSizes();
            this.render();
        },
        _onFetchError: function() {
            console.log('Chart Request Fail', arguments[0].stack);
        },

        /**
         * Fires onclick, onmousemover, onmousemove and other custom chart events
         * Currently setup to pass event to any handler defined for that event type
         * @param e Chart Event. Use e.run.data[e.index] to access data for current item
         */
        onChartEvent: function(e) {
            var handler,
                event = lang.mixin({}, e);

            switch(event.type)
            {
                case 'onclick': handler = this.click; break;
                case 'onmouseover': handler = this.mouseover; break;
                case 'onmouseout': handler = this.mouseout; break;
            }

            if (handler)
                handler.call(this, event);
        },

        /**
         * Process feed needs to set this.feed with an array of plot points defined as:
         * [
         *  { $descriptor: 'text label', value: 1 },
         *  { $descriptor: 'text label2', value: 2 }
         * ]
         * (note $descriptor and value keys may be changed with descriptionProperty/valueProperty
         * @param feed
         */
        processFeed: function(feed) {
            this.feed = feed;
        },

        /**
         * Renders the dojo Chart to the chartNode
         */
        render: function() {
            var chart = new Chart(this.chartNode, this.chartOptions);
            this.chart = chart;

            chart.setTheme(this.getTheme());
            chart.addPlot('default', this.getType());

            var axes = this.getAxes();
            if (!lang.isArray(axes))
                axes = [axes];
            array.forEach(axes, function(axis){
                this.addAxis(axis['axis'], axis['options'] || {});
            }, chart);

            this.setAxisLabelSizes();

            var data = this.getSeries(this.feed);
            if (!lang.isArray(data))
                data = [data];
            array.forEach(data, function(series){
                this.addSeries(series['name'], series['data'], series['options'] || {});
            }, chart);

            if (this.grid)
                chart.addPlot("Grid", lang.mixin(this.grid, {type: "Grid"}));

          //  if (this.click || this.mouseover || this.mouseout)
            chart.connectToPlot('default', this, this.onChartEvent);

            chart.render();

            if (this.legend)
                new Legend(lang.mixin({},{chart: chart}, this.legendOptions), this.legendNode);

        }
    });
});