define([
    'doh/runner',
    'dojo/dom-attr',
    'dojo/dom-class',
    'argos/Views/DateTimePicker'
], function (doh, domAttr, domClass, DateTimePicker) {

    doh.register('argos-tests.src.Views.DateTimePicker', [
        {
            name:'Can return the number of days in January',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 0;
                this.datetimepicker.year = 2012;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 31);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in February (leap year)',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 1;
                this.datetimepicker.year = 2012;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 29);
            }, 
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in February (non-leap year)',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 1;
                this.datetimepicker.year = 2011;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 28);
            }, 
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in March',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 2;
                this.datetimepicker.year = 2011;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 31);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in April',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 3;
                this.datetimepicker.year = 2012;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 30);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in May',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 4;
                this.datetimepicker.year = 2012;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 31);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in June',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 5;
                this.datetimepicker.year = 2012;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 30);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in July',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 6;
                this.datetimepicker.year = 2012;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 31);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in August',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 7;
                this.datetimepicker.year = 2012;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 31);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in September',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 8;
                this.datetimepicker.year = 2012;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 30);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in October',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 9;
                this.datetimepicker.year = 2012;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 31);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in November',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 10;
                this.datetimepicker.year = 2012;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 30);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can return the number of days in December',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                this.datetimepicker.month = 11;
                this.datetimepicker.year = 2012;
                doh.assertEqual(this.datetimepicker.daysInMonth(), 31);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can add toggleStateOn to meridiem node',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                var node = document.createElement('div');

                doh.spyOn(this.datetimepicker, 'updateDatetimeCaption');
                this.datetimepicker.toggleMeridiem({$source:node});

                doh.assertEqual(domClass.contains(node, 'toggleStateOn'), true);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can remove toggleStateOn from meridiem node',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                var node = document.createElement('div');
                domClass.add(node, 'toggleStateOn');

                doh.spyOn(this.datetimepicker, 'updateDatetimeCaption');
                this.datetimepicker.toggleMeridiem({$source:node});

                doh.assertEqual(domClass.contains(node, 'toggleStateOn'), false);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can add toggled attribute to meridiem node',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                var node = document.createElement('div');

                doh.spyOn(this.datetimepicker, 'updateDatetimeCaption');
                this.datetimepicker.toggleMeridiem({$source:node});

                doh.assertEqual(domAttr.get(node, 'toggled'), true);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can remove toggled attribute from meridiem node',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                var node = document.createElement('div');
                node.toggled = true;

                doh.spyOn(this.datetimepicker, 'updateDatetimeCaption');
                this.datetimepicker.toggleMeridiem({$source:node});

                doh.assertEqual(domAttr.get(node, 'toggled'), false);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can call update after meridiem toggle',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                var spy = doh.spyOn(this.datetimepicker, 'updateDatetimeCaption');
                this.datetimepicker.toggleMeridiem({});
                doh.assertWasCalled(spy);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can populate a select element with numbered nodes',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                var select = document.createElement('select');
                this.datetimepicker.populateSelector(select, 0, 0, 3);
                doh.assertEqual(select.options.length, 4);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can populate a select element with numbered nodes, with leading zeroes to the text',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                var select = document.createElement('select');
                this.datetimepicker.populateSelector(select, 0, 0, 3);
                doh.assertEqual(select.options[0].innerHTML, '00');
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can populate a select element with numbered nodes, with setting the default selected',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                var select = document.createElement('select');
                this.datetimepicker.populateSelector(select, 0, 0, 3);
                doh.assertEqual(domAttr.get(select.options[0], 'selected'), true);
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        },
        {
            name:'Can populate a select element with numbered nodes, with setting the values',
            setUp:function () {
                this.datetimepicker = new DateTimePicker();
            },
            runTest:function () {

                var select = document.createElement('select');
                this.datetimepicker.populateSelector(select, 0, 0, 3);
                doh.assertEqual(domAttr.get(select.options[0], 'value'), '0');
            },
            tearDown:function () {
                this.datetimepicker.destroy();
            }
        }
    ]);
});