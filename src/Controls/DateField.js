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
            return this.currentValue.toISOString();
        },
        //FIXME: Date.parse returns NaN for strings like '2006-12-11T00:00:00-07:00'
        setValue: function(val, initial) {
            var d;
            if (typeof val == 'string') d = this.parseDate(val);
            if (!val || !d || d.constructor !== Date) return;

            if (initial) this.originalValue = d;            

            this.setText(d);
        },
        clearValue: function() {
            this.originalValue = this.currentValue = false;
        },
        //TODO: make formatting configurable
        setText: function(val) {
            var time = String.format('{0}/{1}/{2}', (val.getMonth()+1), val.getDate(), val.getFullYear());
            if (this.showTime === true) time += String.format(' {0}:{1}', val.getHours(), val.getMinutes());

            this.el.dom.value = time;
        },
        // from http://dansnetwork.com/2008/11/01/javascript-iso8601rfc3339-date-parser/
        parseDate: function(dString) {
            var regexp = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)(:)?(\d\d)(\.\d+)?(Z|([+-])(\d\d)(:)?(\d\d))/;
            var date = new Date();
            if (dString.toString().match(new RegExp(regexp)))
            {
                var d = dString.match(new RegExp(regexp));
                var offset = 0;
                date.setUTCDate(1);
                date.setUTCFullYear(parseInt(d[1],10));
                date.setUTCMonth(parseInt(d[3],10) - 1);
                date.setUTCDate(parseInt(d[5],10));
                date.setUTCHours(parseInt(d[7],10));
                date.setUTCMinutes(parseInt(d[9],10));
                date.setUTCSeconds(parseInt(d[11],10));

                if (d[12])
                    date.setUTCMilliseconds(parseFloat(d[12]) * 1000);
                else
                    date.setUTCMilliseconds(0);

                if (d[13] != 'Z')
                {
                    offset = (d[15] * 60) + parseInt(d[17],10);
                    offset *= ((d[14] == '-') ? -1 : 1);
                    date.setTime(date.getTime() - offset * 60 * 1000);
                }
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