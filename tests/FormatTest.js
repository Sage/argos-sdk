define('FormatTest', ['Sage/Platform/Mobile/Format'], function(Format) {
return describe('SDataServiceOperationRequest', function() {

    it('Can tell if empty string is empty', function() {
        var testStr = '';
        expect(Format.isEmpty(testStr)).toEqual(true);
    });
    it('Can tell if text string is not empty', function() {
        var testStr = 'test';
        expect(Format.isEmpty(testStr)).toEqual(false);
    });
    it('Can tell if object does not have property (empty)', function() {
        var testObj = {};
        expect(Format.isEmpty(testObj.test)).toEqual(true);
    });
    it('Can tell if object does have property (not empty)', function() {
        var testObj = {
            test: 'value'
        };
        expect(Format.isEmpty(testObj.test)).toEqual(false);
    });

    it('Can encode &', function() {
        var testStr = 'test & test';
        expect(Format.encode(testStr)).toEqual('test &amp; test');
    });
    it('Can encode >', function() {
        var testStr = 'test > test';
        expect(Format.encode(testStr)).toEqual('test &gt; test');
    });
    it('Can encode <', function() {
        var testStr = 'test < test';
        expect(Format.encode(testStr)).toEqual('test &lt; test');
    });
    it('Can encode "', function() {
        var testStr = 'test " test';
        expect(Format.encode(testStr)).toEqual('test &quot; test');
    });
    it('Can return original value when encoding non-string', function() {
        var testStr = 1;
        expect(Format.encode(testStr)).toEqual(1);
    });

    it('Can decode &amp;', function() {
        var testStr = 'test &amp; test';
        expect(Format.decode(testStr)).toEqual('test & test');
    });
    it('Can decode &gt;', function() {
        var testStr = 'test &gt; test';
        expect(Format.decode(testStr)).toEqual('test > test');
    });
    it('Can decode &lt;', function() {
        var testStr = 'test &lt; test';
        expect(Format.decode(testStr)).toEqual('test < test');
    });
    it('Can decode &quot;', function() {
        var testStr = 'test &quot; test';
        expect(Format.decode(testStr)).toEqual('test " test');
    });
    it('Can return original value when decoding non-string', function() {
        var testStr = 1;
        expect(Format.decode(testStr)).toEqual(1);
    });

    it('Can create anchor link', function() {
        var testStr = 'www.google.com';
        expect(Format.link(testStr)).toEqual('<a target="_blank" href="http://www.google.com">www.google.com</a>');
    });
    it('Can return original value when creating a link for a non-string', function() {
        var testStr = 1;
        expect(Format.link(testStr)).toEqual(1);
    });

    it('Can create mailto link', function() {
        var testStr = 'jimmy.page@rock.com';
        expect(Format.mail(testStr)).toEqual('<a href="mailto:jimmy.page@rock.com">jimmy.page@rock.com</a>');
    });
    it('Can return original value when creating a mailto link for a non-string', function() {
        var testStr = 1;
        expect(Format.mail(testStr)).toEqual(1);
    });

    it('Can trim with space at the start', function() {
        var testStr = '   test';
        expect(Format.trim(testStr)).toEqual('test');
    });
    it('Can trim with space at the end', function() {
        var testStr = 'test   ';
        expect(Format.trim(testStr)).toEqual('test');
    });
    it('Can trim with space at start and end', function() {
        var testStr = '   test   ';
        expect(Format.trim(testStr)).toEqual('test');
    });
    it('Can trim without space', function() {
        var testStr = 'test';
        expect(Format.trim(testStr)).toEqual('test');
    });

    it('Can fix decimal place - decimals to few', function() {
        var testStr = 1.999999999;
        expect(Format.fixed(testStr, 2)).toEqual(1.99);
    });
    it('Can fix decimal place - decimals to none (using 0 as fixed)', function() {
        var testStr = 1.99;
        expect(Format.fixed(testStr, 0)).toEqual(1);
    });
    it('Can fix decimal place - as string for value', function() {
        var testStr = '1.999999999';
        expect(Format.fixed(testStr, 2)).toEqual(1.99);
    });
    it('Can fix decimal place - as string for fixed, should fallback to 2 for fixed', function() {
        var testStr = 1.999999999;
        expect(Format.fixed(testStr, '6')).toEqual(1.99);
    });

    it('Can present as percent - single digit', function() {
        var testStr = .01;
        expect(Format.percent(testStr)).toEqual('1%');
    });
    it('Can present as percent - double digit', function() {
        var testStr = .25;
        expect(Format.percent(testStr)).toEqual('25%');
    });
    it('Can present as percent - triple digit', function() {
        var testStr = 2;
        expect(Format.percent(testStr)).toEqual('200%');
    });
    it('Can present as percent - quad digit', function() {
        var testStr = 10;
        expect(Format.percent(testStr)).toEqual('1000%');
    });
    it('Can present as percent - rounded down', function() {
        var testStr = .155; // some might expect 16%, but should round down
        expect(Format.percent(testStr)).toEqual('15%');
    });



});
});

