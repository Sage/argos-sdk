define([
    'doh/runner',
    'argos/format'
], function (
    doh,
    format
) {

    doh.register("argos-tests/src/format", [

        {
            name:'Can tell if empty string is empty',
            runTest:function () {
                var testStr = '';
                doh.assertEqual(format.isEmpty(testStr), true);
            }
        },
        {
            name:'Can tell if text string is not empty',
            runTest:function () {
                var testStr = 'test';
                doh.assertEqual(format.isEmpty(testStr), false);
            }
        },
        {
            name:'Can tell if object does not have property (empty)',
            runTest:function () {
                var testObj = {};
                doh.assertEqual(format.isEmpty(testObj.test), true);
            }
        },
        {
            name:'Can tell if object does have property (not empty)',
            runTest:function () {
                var testObj = {
                    test:'value'
                };
                doh.assertEqual(format.isEmpty(testObj.test), false);
            }
        },

        {
            name:'Can encode &',
            runTest:function () {
                var testStr = 'test & test';
                doh.assertEqual(format.encode(testStr), 'test &amp; test');
            }
        },
        {
            name:'Can encode >',
            runTest:function () {
                var testStr = 'test > test';
                doh.assertEqual(format.encode(testStr), 'test &gt; test');
            }
        },
        {
            name:'Can encode <',
            runTest:function () {
                var testStr = 'test < test';
                doh.assertEqual(format.encode(testStr), 'test &lt; test');
            }
        },
        {
            name:'Can encode "',
            runTest:function () {
                var testStr = 'test " test';
                doh.assertEqual(format.encode(testStr), 'test &quot; test');
            }
        },
        {
            name:'Can return original value when encoding non-string',
            runTest:function () {
                var testStr = 1;
                doh.assertEqual(format.encode(testStr), 1);
            }
        },

        {
            name:'Can decode &amp;',
            runTest:function () {
                var testStr = 'test &amp; test';
                doh.assertEqual(format.decode(testStr), 'test & test');
            }
        },
        {
            name:'Can decode &gt;',
            runTest:function () {
                var testStr = 'test &gt; test';
                doh.assertEqual(format.decode(testStr), 'test > test');
            }
        },
        {
            name:'Can decode &lt;',
            runTest:function () {
                var testStr = 'test &lt; test';
                doh.assertEqual(format.decode(testStr), 'test < test');
            }
        },
        {
            name:'Can decode &quot;',
            runTest:function () {
                var testStr = 'test &quot; test';
                doh.assertEqual(format.decode(testStr), 'test " test');
            }
        },
        {
            name:'Can return original value when decoding non-string',
            runTest:function () {
                var testStr = 1;
                doh.assertEqual(format.decode(testStr), 1);
            }
        },

        {
            name:'Can create anchor link',
            runTest:function () {
                var testStr = 'www.google.com';
                doh.assertEqual(format.link(testStr), '<a target="_blank" href="http://www.google.com">www.google.com</a>');
            }
        },
        {
            name:'Can return original value when creating a link for a non-string',
            runTest:function () {
                var testStr = 1;
                doh.assertEqual(format.link(testStr), 1);
            }
        },

        {
            name:'Can create mailto link',
            runTest:function () {
                var testStr = 'jimmy.page@rock.com';
                doh.assertEqual(format.mail(testStr), '<a href="mailto:jimmy.page@rock.com">jimmy.page@rock.com</a>');
            }
        },
        {
            name:'Can return original value when creating a mailto link for a non-string',
            runTest:function () {
                var testStr = 1;
                doh.assertEqual(format.mail(testStr), 1);
            }
        },

        {
            name:'Can trim with space at the start',
            runTest:function () {
                var testStr = '   test';
                doh.assertEqual(format.trim(testStr), 'test');
            }
        },
        {
            name:'Can trim with space at the end',
            runTest:function () {
                var testStr = 'test   ';
                doh.assertEqual(format.trim(testStr), 'test');
            }
        },
        {
            name:'Can trim with space at start and end',
            runTest:function () {
                var testStr = '   test   ';
                doh.assertEqual(format.trim(testStr), 'test');
            }
        },
        {
            name:'Can trim without space',
            runTest:function () {
                var testStr = 'test';
                doh.assertEqual(format.trim(testStr), 'test');
            }
        },

        {
            name:'Can fix decimal place - decimals to few',
            runTest:function () {
                var testStr = 1.999999999;
                doh.assertEqual(format.fixed(testStr, 2), 1.99);
            }
        },
        {
            name:'Can fix decimal place - decimals to none (using 0 as fixed)',
            runTest:function () {
                var testStr = 1.99;
                doh.assertEqual(format.fixed(testStr, 0), 1);
            }
        },
        {
            name:'Can fix decimal place - as string for value',
            runTest:function () {
                var testStr = '1.999999999';
                doh.assertEqual(format.fixed(testStr, 2), 1.99);
            }
        },
        {
            name:'Can fix decimal place - as string for fixed, should fallback to 2 for fixed',
            runTest:function () {
                var testStr = 1.999999999;
                doh.assertEqual(format.fixed(testStr, '6'), 1.99);
            }
        },

        {
            name:'Can present as percent - single digit',
            runTest:function () {
                var testStr = .01;
                doh.assertEqual(format.percent(testStr), '1%');
            }
        },
        {
            name:'Can present as percent - double digit',
            runTest:function () {
                var testStr = .25;
                doh.assertEqual(format.percent(testStr), '25%');
            }
        },
        {
            name:'Can present as percent - triple digit',
            runTest:function () {
                var testStr = 2;
                doh.assertEqual(format.percent(testStr), '200%');
            }
        },
        {
            name:'Can present as percent - quad digit',
            runTest:function () {
                var testStr = 10;
                doh.assertEqual(format.percent(testStr), '1000%');
            }
        },
        {
            name:'Can present as percent - rounded down',
            runTest:function () {
                var testStr = .155; // some might expect 16%, but should round down
                doh.assertEqual(format.percent(testStr), '15%');
            }
        },

        {
            name:'Can present true string to default yes string (Yes)',
            runTest:function () {
                var testStr = 'true';
                doh.assertEqual(format.yesNo(testStr), 'Yes');
            }
        },
        {
            name:'Can present true boolean to default yes string (Yes)',
            runTest:function () {
                var testStr = true;
                doh.assertEqual(format.yesNo(testStr), 'Yes');
            }
        },
        {
            name:'Can present false string to default no string (No)',
            runTest:function () {
                var testStr = 'false';
                doh.assertEqual(format.yesNo(testStr), 'No');
            }
        },
        {
            name:'Can present false boolean to default no string (No)',
            runTest:function () {
                var testStr = false;
                doh.assertEqual(format.yesNo(testStr), 'No');
            }
        },
        {
            name:'Can present any non-true string to default no string (No)',
            runTest:function () {
                var testStr = 'test';
                doh.assertEqual(format.yesNo(testStr), 'No');
            }
        },

        {
            name:'Can present true string to default true string (T)',
            runTest:function () {
                var testStr = 'true';
                doh.assertEqual(format.bool(testStr), 'T');
            }
        },
        {
            name:'Can present true boolean to default true string (T)',
            runTest:function () {
                var testStr = true;
                doh.assertEqual(format.bool(testStr), 'T');
            }
        },
        {
            name:'Can present false string to default false string (F)',
            runTest:function () {
                var testStr = 'false';
                doh.assertEqual(format.bool(testStr), 'F');
            }
        },
        {
            name:'Can present false boolean to default false string (F)',
            runTest:function () {
                var testStr = false;
                doh.assertEqual(format.bool(testStr), 'F');
            }
        },
        {
            name:'Can present any non-true string to default false string (F)',
            runTest:function () {
                var testStr = 'test';
                doh.assertEqual(format.bool(testStr), 'F');
            }
        },

        {
            name:'Can present only minutes via int in a timespan',
            runTest:function () {
                var testStr = 45;
                doh.assertEqual(format.timespan(testStr), '45 minutes');
            }
        },
        {
            name:'Can present 1 minute in a timespan',
            runTest:function () {
                var testStr = 1;
                doh.assertEqual(format.timespan(testStr), '1 minute');
            }
        },
        {
            name:'Can present timespan via string',
            runTest:function () {
                var testStr = '45';
                doh.assertEqual(format.timespan(testStr), '45 minutes');
            }
        },
        {
            name:'Can present only hours in a timespan',
            runTest:function () {
                var testStr = 120;
                doh.assertEqual(format.timespan(testStr), '2 hours');
            }
        },
        {
            name:'Can present only 1 hour in a timespan',
            runTest:function () {
                var testStr = 60;
                doh.assertEqual(format.timespan(testStr), '1 hour');
            }
        },
        {
            name:'Can present only hours and minutes in a timespan',
            runTest:function () {
                var testStr = 90;
                doh.assertEqual(format.timespan(testStr), '1 hour 30 minutes');
            }
        },
        {
            name:'Can return empty string when non-number value is sent for timespan',
            runTest:function () {
                var testStr = 'test';
                doh.assertEqual(format.timespan(testStr), '');
            }
        },

        {
            name:'Can format A-Z to their phone number equivalents',
            runTest:function () {
                var testStr = 'ABCDEFHGIJKLMNOPQRSTUVWXYZ';
                doh.assertEqual(format.alphaToPhoneNumeric(testStr), '22233344455566677778889999');
            }
        },
        {
            name:'Can format a-z (except x) to their phone number equivalents',
            runTest:function () {
                var testStr = 'abcdefghijklmnopqrstuvwxyz';
                doh.assertEqual(format.alphaToPhoneNumeric(testStr), '22233344455566677778889x99');
            }
        },

        {
            name:'Can format a 7 digit phone number to be nnn-nnnn',
            runTest:function () {
                var testStr = '1234567';
                doh.assertEqual(format.phone(testStr), '123-4567');
            }
        },
        {
            name:'Can format a 10 digit phone number to be (nnn)-nnn-nnnn',
            runTest:function () {
                var testStr = '1234567890';
                doh.assertEqual(format.phone(testStr), '(123)-456-7890');
            }
        },
        {
            name:'Can format a 10 digit phone number with extension to be (nnn)-nnn-nnnnxnnn',
            runTest:function () {
                var testStr = '1234567890x123';
                doh.assertEqual(format.phone(testStr), '(123)-456-7890x123');
            }
        },
        {
            name:'Can call alphaToPhoneNumeric when formatting a phone number',
            runTest:function () {
                doh.spyOn(format, 'alphaToPhoneNumeric').andReturn('test');

                format.phone('test');

                doh.assertWasCalled(format.alphaToPhoneNumeric);
            }
        },
        {
            name:'Can format a phone number with mixed numbers and alphas',
            runTest:function () {
                var testStr = '1-800-CALL-JEFF';
                doh.assertEqual(format.phone(testStr), '180022555333');
            }
        },
        {
            name:'Can format a phone number with preceding 1',
            runTest:function () {
                var testStr = '18001234567';
                doh.assertEqual(format.phone(testStr), '1-800-123-4567');
            }
        },
        {
            name:'Can format a phone number with preceding 1 and extension',
            runTest:function () {
                var testStr = '18001234567x89';
                doh.assertEqual(format.phone(testStr), '1-800-123-4567x89');
            }
        }
    ]);
});