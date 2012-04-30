define('ConvertTests', ['Sage/Platform/Mobile/Convert'], function(convert) {
return describe('Sage.Platform.Mobile.Convert', function() {

    it('Can convert non-true string to boolean (false)', function() {
        var testStr = 'test';
        expect(convert.toBoolean(testStr)).toEqual(false);
    });
    it('Can convert 0 int to boolean (false)', function() {
        var testStr = 0;
        expect(convert.toBoolean(testStr)).toEqual(false);
    });
    it('Can convert undefined object property to boolean (false)', function() {
        var testStr = Sage.Testing;
        expect(convert.toBoolean(testStr)).toEqual(false);
    });
    it('Can convert null to boolean (false)', function() {
        var testStr = null;
        expect(convert.toBoolean(testStr)).toEqual(false);
    });
    it('Can convert true (T) text string to boolean (true)', function() {
        var testStr = 'T';
        expect(convert.toBoolean(testStr)).toEqual(true);
    });
    it('Can convert true (true) text string to boolean (true)', function() {
        var testStr = 'true';
        expect(convert.toBoolean(testStr)).toEqual(true);
    });

    it('Can detect ISO date string, year month date', function() {
        var testStr = '2011-06-22';
        expect(convert.isDateString(testStr)).toEqual(true);
    });
    it('Can detect ISO date string, no T or Z, no timezone', function() {
        var testStr = '2011-06-22:08:15:00';
        expect(convert.isDateString(testStr)).toEqual(true);
    });
    it('Can detect ISO date string, with T, no Z, no timezone', function() {
        var testStr = '2011-06-22T08:15:00';
        expect(convert.isDateString(testStr)).toEqual(true);
    });
    it('Can detect ISO date string, no T, with Z, no timezone', function() {
        var testStr = '2011-06-22:08:15:00Z';
        expect(convert.isDateString(testStr)).toEqual(true);
    });
    it('Can detect ISO date string, with T and Z, no timezone', function() {
        var testStr = '2011-06-22T08:15:00Z';
        expect(convert.isDateString(testStr)).toEqual(true);
    });
    it('Can detect ISO date string, no T or Z, with timezone', function() {
        var testStr = '2011-06-22:08:15:00-07:00';
        expect(convert.isDateString(testStr)).toEqual(true);
    });
    it('Can detect ISO date string, with T, no Z, with timezone', function() {
        var testStr = '2011-06-22T08:15:00-07:00';
        expect(convert.isDateString(testStr)).toEqual(true);
    });
    it('Can detect ISO date string, no T, with timezone', function() {
        var testStr = '2011-06-22:08:15:00-07:00';
        expect(convert.isDateString(testStr)).toEqual(true);
    });
    it('Can detect incorrect ISO date string, missing year', function() {
        var testStr = '06-22T08:15:00-07:00';
        expect(convert.isDateString(testStr)).toEqual(false);
    });
    it('Can detect incorrect ISO date string, missing month', function() {
        var testStr = '2011-22T08:15:00-07:00';
        expect(convert.isDateString(testStr)).toEqual(false);
    });
    it('Can detect incorrect ISO date string, missing date', function() {
        var testStr = '2011-06T08:15:00-07:00';
        expect(convert.isDateString(testStr)).toEqual(false);
    });

    it('Can convert Date object to ISO string', function() {
        var testDate = new Date(Date.UTC(2011, 0, 1, 8, 30, 0));
        expect(convert.toIsoStringFromDate(testDate)).toEqual('2011-01-01T08:30:00Z');
    });

    it('Can convert Date object to JSON string', function() {
        var testDate = new Date(Date.UTC(2011, 0, 1, 8, 30, 0));
        expect(convert.toJsonStringFromDate(testDate)).toEqual('/Date(1293870600000)/');
    });

    it('Can convert ISO string to Date object, no timezone', function() {
        var testStr = '2011-01-01T08:30:00Z';
        expect(convert.toDateFromString(testStr)).toEqual(new Date(Date.UTC(2011, 0, 1, 8, 30, 0)));
    });
    it('Can convert ISO string to Date object, with timezone', function() {
        var testStr = '2011-01-01T08:30:00-07:00';
        expect(convert.toDateFromString(testStr)).toEqual(new Date(Date.UTC(2011, 0, 1, 15, 30, 0)));
    });
    it('Can convert JSON string to Date Object', function() {
        var testStr = '/Date(1293870600000)/';
        expect(convert.toDateFromString(testStr)).toEqual(new Date(Date.UTC(2011, 0, 1, 8, 30, 0)));
    });
    it('Can fallback and return original value when non string is passed to toDateFromString', function() {
        var testStr = 10;
        expect(convert.toDateFromString(testStr)).toEqual(10);
    });

});
});