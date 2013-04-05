define('FormatTests', ['Sage/Platform/Mobile/Format'], function(format) {
return describe('Sage.Platform.Mobile.Format', function() {

    it('Can tell if empty string is empty', function() {
        var testStr = '';
        expect(format.isEmpty(testStr)).toEqual(true);
    });
    it('Can tell if text string is not empty', function() {
        var testStr = 'test';
        expect(format.isEmpty(testStr)).toEqual(false);
    });
    it('Can tell if object does not have property (empty)', function() {
        var testObj = {};
        expect(format.isEmpty(testObj.test)).toEqual(true);
    });
    it('Can tell if object does have property (not empty)', function() {
        var testObj = {
            test: 'value'
        };
        expect(format.isEmpty(testObj.test)).toEqual(false);
    });

    it('Can encode &', function() {
        var testStr = 'test & test';
        expect(format.encode(testStr)).toEqual('test &amp; test');
    });
    it('Can encode >', function() {
        var testStr = 'test > test';
        expect(format.encode(testStr)).toEqual('test &gt; test');
    });
    it('Can encode <', function() {
        var testStr = 'test < test';
        expect(format.encode(testStr)).toEqual('test &lt; test');
    });
    it('Can encode "', function() {
        var testStr = 'test " test';
        expect(format.encode(testStr)).toEqual('test &quot; test');
    });
    it('Can return original value when encoding non-string', function() {
        var testStr = 1;
        expect(format.encode(testStr)).toEqual(1);
    });

    it('Can decode &amp;', function() {
        var testStr = 'test &amp; test';
        expect(format.decode(testStr)).toEqual('test & test');
    });
    it('Can decode &gt;', function() {
        var testStr = 'test &gt; test';
        expect(format.decode(testStr)).toEqual('test > test');
    });
    it('Can decode &lt;', function() {
        var testStr = 'test &lt; test';
        expect(format.decode(testStr)).toEqual('test < test');
    });
    it('Can decode &quot;', function() {
        var testStr = 'test &quot; test';
        expect(format.decode(testStr)).toEqual('test " test');
    });
    it('Can return original value when decoding non-string', function() {
        var testStr = 1;
        expect(format.decode(testStr)).toEqual(1);
    });

    it('Can create anchor link', function() {
        var testStr = 'www.google.com';
        expect(format.link(testStr)).toEqual('<a target="_blank" href="http://www.google.com">www.google.com</a>');
    });
    it('Can return original value when creating a link for a non-string', function() {
        var testStr = 1;
        expect(format.link(testStr)).toEqual(1);
    });

    it('Can create mailto link', function() {
        var testStr = 'jimmy.page@rock.com';
        expect(format.mail(testStr)).toEqual('<a href="mailto:jimmy.page@rock.com">jimmy.page@rock.com</a>');
    });
    it('Can return original value when creating a mailto link for a non-string', function() {
        var testStr = 1;
        expect(format.mail(testStr)).toEqual(1);
    });

    it('Can trim with space at the start', function() {
        var testStr = '   test';
        expect(format.trim(testStr)).toEqual('test');
    });
    it('Can trim with space at the end', function() {
        var testStr = 'test   ';
        expect(format.trim(testStr)).toEqual('test');
    });
    it('Can trim with space at start and end', function() {
        var testStr = '   test   ';
        expect(format.trim(testStr)).toEqual('test');
    });
    it('Can trim without space', function() {
        var testStr = 'test';
        expect(format.trim(testStr)).toEqual('test');
    });

    it('Can fix decimal place - decimals to few', function() {
        var testStr = 1.999999999;
        expect(format.fixed(testStr, 2)).toEqual(1.99);
    });
    it('Can fix decimal place - decimals to none (using 0 as fixed)', function() {
        var testStr = 1.99;
        expect(format.fixed(testStr, 0)).toEqual(1);
    });
    it('Can fix decimal place - as string for value', function() {
        var testStr = '1.999999999';
        expect(format.fixed(testStr, 2)).toEqual(1.99);
    });
    it('Can fix decimal place - as string for fixed, should fallback to 2 for fixed', function() {
        var testStr = 1.999999999;
        expect(format.fixed(testStr, '6')).toEqual(1.99);
    });

    it('Can present as percent - single digit with default places of 2', function() {
        var testStr = .01;
        expect(format.percent(testStr)).toEqual('1.00%');
    });
    it('Can present as percent - single digit with places set to 2', function() {
        var testStr = .01;
        var places = 2;
        expect(format.percent(testStr, places)).toEqual('1.00%');
    });
    it('Can present as percent - single digit with places set to 3', function() {
        var testStr = .01;
        var places = 3;
        expect(format.percent(testStr, places)).toEqual('1.000%');
    });
    it('Can present as percent - single digit with places set to 3 and no rounding', function() {
        var testStr = .01015;
        var places = 3;
        expect(format.percent(testStr, places)).toEqual('1.015%');
    });
    it('Can present as percent - single digit with places set to 3 and rounding up', function() {
        var testStr = .010155;
        var places = 3;
        expect(format.percent(testStr, places)).toEqual('1.016%');
    });
    it('Can present as percent - single digit with places set to 3 and rounding down', function() {
        var testStr = .010154;
        var places = 3;
        expect(format.percent(testStr, places)).toEqual('1.015%');
    });
    it('Can present as percent - single digit with places set to 0 and rounding up', function() {
        var testStr = .01561;
        var places = 0;
        expect(format.percent(testStr, places)).toEqual('2%');
    });
    it('Can present as percent - single digit with places set to 0 and rounding down', function() {
        var testStr = .01455;
        var places = 0;
        expect(format.percent(testStr, places)).toEqual('1%');
    });
    it('Can present as percent - single digit', function() {
        var testStr = .01;
        var places = 0;
        expect(format.percent(testStr, places)).toEqual('1%');
    });   
    it('Can present as percent - double digit', function() {
        var testStr = .25;
        var places = 0;
        expect(format.percent(testStr, places)).toEqual('25%');
    });
    it('Can present as percent - triple digit', function() {
        var testStr = 2;
        var places = 0;
        expect(format.percent(testStr, places)).toEqual('200%');
    });
    it('Can present as percent - quad digit', function() {
        var testStr = 10;
        var places = 0;
        expect(format.percent(testStr, places)).toEqual('1,000%');
    });
    it('Can present as percent - quad digit with places set to 2 no round', function() {
        var testStr = 19.9999;
        var places = 2;
        expect(format.percent(testStr, places)).toEqual('1,999.99%');
    });
    it('Can present as percent - quad digit with places set to 2 round up', function() {
        var testStr = 19.99995;
        var places = 2;
        expect(format.percent(testStr, places)).toEqual('2,000.00%');
    });
    it('Can present as percent - quad digit with places set to 2 round down', function() {
        var testStr = 19.99994;
        var places = 2;
        expect(format.percent(testStr, places)).toEqual('1,999.99%');
    });
    it('Can present as percent - rounded up', function() {
        var testStr = .155; 
        var places = 0;
        expect(format.percent(testStr, places)).toEqual('16%');
    });
    it('Can present as percent - rounded down', function() {
        var testStr = .154;
        var places = 0;
        expect(format.percent(testStr, places)).toEqual('15%');
    });
    it('Can present as percent - change location of percent symbol', function() {
        var testStr = .10; 
        var places = 0;
        format.percentFormatText = '${1}${0}';
        expect(format.percent(testStr, places)).toEqual('%10');
    });

    it('Can present true string to default yes string (Yes)', function() {
        var testStr = 'true';
        expect(format.yesNo(testStr)).toEqual('Yes');
    });
    it('Can present true boolean to default yes string (Yes)', function() {
        var testStr = true;
        expect(format.yesNo(testStr)).toEqual('Yes');
    });
    it('Can present false string to default no string (No)', function() {
        var testStr = 'false';
        expect(format.yesNo(testStr)).toEqual('No');
    });
    it('Can present false boolean to default no string (No)', function() {
        var testStr = false;
        expect(format.yesNo(testStr)).toEqual('No');
    });
    it('Can present any non-true string to default no string (No)', function() {
        var testStr = 'test';
        expect(format.yesNo(testStr)).toEqual('No');
    });

    it('Can present true string to default true string (T)', function() {
        var testStr = 'true';
        expect(format.bool(testStr)).toEqual('T');
    });
    it('Can present true boolean to default true string (T)', function() {
        var testStr = true;
        expect(format.bool(testStr)).toEqual('T');
    });
    it('Can present false string to default false string (F)', function() {
        var testStr = 'false';
        expect(format.bool(testStr)).toEqual('F');
    });
    it('Can present false boolean to default false string (F)', function() {
        var testStr = false;
        expect(format.bool(testStr)).toEqual('F');
    });
    it('Can present any non-true string to default false string (F)', function() {
        var testStr = 'test';
        expect(format.bool(testStr)).toEqual('F');
    });

    it('Can present only minutes via int in a timespan', function() {
        var testStr = 45;
        expect(format.timespan(testStr)).toEqual('45 minutes');
    });
    it('Can present 1 minute in a timespan', function() {
        var testStr = 1;
        expect(format.timespan(testStr)).toEqual('1 minute');
    });
    it('Can present timespan via string', function() {
        var testStr = '45';
        expect(format.timespan(testStr)).toEqual('45 minutes');
    });
    it('Can present only hours in a timespan', function() {
        var testStr = 120;
        expect(format.timespan(testStr)).toEqual('2 hours');
    });
    it('Can present only 1 hour in a timespan', function() {
        var testStr = 60;
        expect(format.timespan(testStr)).toEqual('1 hour');
    });
    it('Can present only hours and minutes in a timespan', function() {
        var testStr = 90;
        expect(format.timespan(testStr)).toEqual('1 hour 30 minutes');
    });
    it('Can return empty string when non-number value is sent for timespan', function() {
        var testStr = 'test';
        expect(format.timespan(testStr)).toEqual('');
    });

    it('Can format A-Z to their phone number equivalents', function() {
        var testStr = 'ABCDEFHGIJKLMNOPQRSTUVWXYZ';
        expect(format.alphaToPhoneNumeric(testStr)).toEqual('22233344455566677778889999');
    });
    it('Can format a-z (except x) to their phone number equivalents', function() {
        var testStr = 'abcdefghijklmnopqrstuvwxyz';
        expect(format.alphaToPhoneNumeric(testStr)).toEqual('22233344455566677778889x99');
    });

    it('Can format a 7 digit phone number to be nnn-nnnn', function() {
        var testStr = '1234567';
        expect(format.phone(testStr)).toEqual('123-4567');
    });
    it('Can format a 10 digit phone number to be (nnn)-nnn-nnnn', function() {
        var testStr = '1234567890';
        expect(format.phone(testStr)).toEqual('(123)-456-7890');
    });
    it('Can format a 10 digit phone number with extension to be (nnn)-nnn-nnnnxnnn', function() {
        var testStr = '1234567890x123';
        expect(format.phone(testStr)).toEqual('(123)-456-7890x123');
    });
    it('Can call alphaToPhoneNumeric when formatting a phone number', function() {
        spyOn(format, 'alphaToPhoneNumeric').andReturn('test');

        format.phone('test');

        expect(format.alphaToPhoneNumeric).toHaveBeenCalled();
    });
    it('Can format a phone number with mixed numbers and alphas', function() {
        var testStr = '1-800-CALL-JEFF';
        expect(format.phone(testStr)).toEqual('180022555333');
    });


});
});