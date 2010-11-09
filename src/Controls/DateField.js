Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    var U = Sage.Platform.Mobile.Utility;

    Sage.Platform.Mobile.Controls.DateField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
        //TODO: make the input a HTML5 "date" field. Webkit & Chrome, overrides our styles for that. 
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button whiteButton"><span>{%: $.lookupText %}</span></a>',
            '<input type="text" readonly="readonly" />'
        ]),
        textTemplate: false,
        emptyText: 'empty',
        completeText: 'Select',
        lookupText: '...',
        view: 'generic_calendar',
        showTime: false,
        init: function() {
            Sage.Platform.Mobile.Controls.DateField.superclass.init.apply(this, arguments);

            this.containerEl.on('click', this.onClick, this);
        },
        complete: function() {
            var view = App.getActiveView();
            if (view)
            {
                this.currentValue = view.getDateTime();
                
                this.setText(this.currentValue);

                this.fireEvent('change', this.currentValue, this);

                ReUI.back();
            }
        },
        createNavigationOptions: function() {
            return {
                tools: {
                    tbar: [{
                        name: 'complete',
                        title: this.completeText,
                        cls: 'button',
                        fn: this.complete,
                        scope: this
                    }]
                },
                date: this.originalValue,
                showTime: this.showTime
            };
        },
        navigateToDateView: function() {
            var view = App.getView(this.view),
                options = this.createNavigationOptions();
            if (view && options)
                view.show(options);
        },
        onClick: function(evt, el, o) {
            if (evt.getTarget('a'))
            {
                evt.stopEvent();
                
                this.navigateToDateView();
            }
        },
        isDirty: function() {
            if (!this.originalValue && this.currentValue) return true;

            if (this.originalValue && this.currentValue) return !this.originalValue.equals(this.currentValue);

            return false;
        },
        getValue: function() {
            //TODO: Need to adapt as per service payload type, and return JSONDate or ISOString 
            var JSONDate = false;

            if (this.currentValue) JSONDate = String.format("\/Date({0})\/", this.currentValue.getTime());

            return JSONDate;
        },
        //FIXME: Date.parse returns NaN for strings like '2006-12-11T00:00:00-07:00'
        setValue: function(val, initial) {
            var d;
            if (typeof val == 'string') d = this.parseDate(val);
            if (!val || !d || d.constructor !== Date) return;

            this.currentValue = d;

            if (initial) this.originalValue = this.currentValue;

            this.setText(d);
        },
        clearValue: function() {
            this.originalValue = this.currentValue = false;
        },
        //TODO: make formatting configurable
        setText: function(val) {
            var time;
            if (this.showTime === true)
                time = val.toString('M/d/yyyy hh:ss');
            else
                time = val.toString('M/d/yyyy');

            this.el.dom.value = time;
        },
        // Copied over from SLX Client Date Formatter
        parseDate: function(val) {
            // 2007-04-12T00:00:00-07:00
            var date = new Date(),
                match = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|(-|\+)(\d{2}):(\d{2}))/.exec(val);
                JSONmatch = /\/Date\((\d+)(([+-])(\d{2})(\d{2}))?\)\//.exec(val);
                toUTCDate = function(d, tz) {
                    // new Date(year, month, date [, hour, minute, second, millisecond ])
                    var h, m, utc = new Date(Date.UTC(
                        parseInt(d[1]),
                        parseInt(d[2]) - 1, // zero based
                        parseInt(d[3]),
                        parseInt(d[4]),
                        parseInt(d[5]),
                        parseInt(d[6])
                    ));

                    if (tz)  //[plusorminus, hours, minutes]
                    {
                        // todo: add support for minutes
                        h = parseInt(tz[1], 10);
                        m = parseInt(tz[2], 10);
                        if (tz[0] === '-')
                            utc.addMinutes((h * 60) + m);
                        else
                            utc.addMinutes(-1 * ((h * 60) + m));
                    }

                    return utc;
                };

            if (match)
            {
                if (match[7] !== 'Z')
                {
                    return toUTCDate(match.slice(0, 7), match.slice(8));
                }

                return toUTCDate(match.slice(0, 7));
            }
            else if (JSONmatch)
            {
                    date.setTime(JSONmatch[1]),
                    dateArr = [val,
                        date.getFullYear(), date.getMonth(), date.getDate(),
                        date.getHours(), date.getMinutes(), date.getSeconds()
                    ];

                if (JSONmatch[2])
                {
                    return toUTCDate(dateArr, JSONmatch.slice(3));
                }
                return toUTCDate(dateArr);
            }
            else
            {
                date.setTime(Date.parse(dString));
            }
            return date;
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('date', Sage.Platform.Mobile.Controls.DateField);
})();