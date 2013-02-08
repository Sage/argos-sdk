define(["doh/runner", "argos/convert"], function(doh, convert){
    doh.register("argos-tests/src/convert", [
        function testToBooleanNonTrueString() {
            var foo = 'foo';
            doh.assertFalse(convert.toBoolean(foo));
        },
        function testToBooleanFalseInt() {
            var foo = 0;
            doh.assertFalse(convert.toBoolean(foo));
        },
        function testToBooleanUndefined() {
            var foo = undefined;
            doh.assertFalse(convert.toBoolean(foo));
        },
        function testToBooleanNull() {
            var foo = null;
            doh.assertFalse(convert.toBoolean(foo));
        },

        function testToBooleanTString() {
            var foo = 'T';
            doh.assertTrue(convert.toBoolean(foo));
        },
        function testToBooleanTrueString() {
            var foo = 'true';
            doh.assertTrue(convert.toBoolean(foo));
        },
        
        function testIsDateStringYYYYMMDD() {
            var foo = '2011-06-22';
            doh.assertTrue(convert.isDateString(foo));
        },
        function testIsDateStringYYYYMMDDHHMMSS() {
            var foo = '2011-06-22:08:15:00';
            doh.assertTrue(convert.isDateString(foo));
        },
        function testIsDateStringYYYYMMDDTHHMMSS() {
            var foo = '2011-06-22T08:15:00';
            doh.assertTrue(convert.isDateString(foo));
        },
        function testIsDateStringYYYYMMDDHHMMSSZ() {
            var foo = '2011-06-2208:15:00Z';
            doh.assertTrue(convert.isDateString(foo));
        },
        function testIsDateStringYYYYMMDDTHHMMSSZ() {
            var foo = '2011-06-22T08:15:00Z';
            doh.assertTrue(convert.isDateString(foo));
        },
        function testIsDateStringYYYYMMDDHHMMSSOOOO() {
            var foo = '2011-06-22:08:15:00-07:00';
            doh.assertTrue(convert.isDateString(foo));
        },
        function testIsDateStringYYYYMMDDTHHMMSSOOOO() {
            var foo = '2011-06-22T08:15:00-07:00';
            doh.assertTrue(convert.isDateString(foo));
        },
        
        function testIsDateStringMMDDTHHMMSSOOOO() {
            var foo = '06-22T08:15:00-07:00';
            doh.assertFalse(convert.isDateString(foo));
        },
        function testIsDateStringYYYYDDTHHMMSSOOOO() {
            var foo = '2011-22T08:15:00-07:00';
            doh.assertFalse(convert.isDateString(foo));
        },
        function testIsDateStringYYYYMMTHHMMSSOOOO() {
            var foo = '2011-06T08:15:00-07:00';
            doh.assertFalse(convert.isDateString(foo));
        },
        
        function testToIsoStringFromDate() {
            var foo = new Date(Date.UTC(2011, 0, 1, 8, 30, 0));
            doh.assertEqual(convert.toIsoStringFromDate(foo), '2011-01-01T08:30:00Z');
        },
        
        function testToJSONStringFromDate() {
            var foo = new Date(Date.UTC(2011, 0, 1, 8, 30, 0));
            doh.assertEqual(convert.toJsonStringFromDate(foo), '/Date(1293870600000)/');
        },
        
        function testToDateFromStringISOZ() {
            console.log('B0');
            var foo = '2011-01-01T08:30:00Z';
            console.log('B1');
            doh.assertEqual(convert.toDateFromString(foo), new Date(Date.UTC(2011, 0, 1, 8, 30, 0)));
        },
        function testToDateFromStringISOOffset() {
            var foo = '2011-01-01T08:30:00-07:00';
            doh.assertEqual(convert.toDateFromString(foo), new Date(Date.UTC(2011, 0, 1, 15, 30, 0)));
        },
        
        function testToDateFromStringJSON() {
            var foo = '/Date(1293870600000)/';
            doh.assertEqual(convert.toDateFromString(foo), new Date(Date.UTC(2011, 0, 1, 8, 30, 0)));
        },
        
        function testToDateFromStringFallbackNonString() {
            var foo = 10;
            doh.assertEqual(convert.toDateFromString(foo), foo);
        }
        
    ]);
});