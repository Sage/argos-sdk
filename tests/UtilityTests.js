define('UtilityTests', ['dojo/_base/lang', 'Sage/Platform/Mobile/Utility'], function(lang, utility) {
return describe('Sage.Platform.Mobile.Utility', function() {

    it('Can get single level property of object', function() {
        var testObj = {
            level1: 'test'
        };

        expect(utility.getValue(testObj, 'level1')).toEqual('test');
    });
    it('Can get many level property of object via string notation', function() {
        var testObj = {
            level1: {
                level2: {
                    level3: {
                        level4: {
                            level5: 'test'
                        }
                    }
                }
            }
        };
        expect(utility.getValue(testObj, 'level1.level2.level3.level4.level5')).toEqual('test');
    });
    it('Can return null for undefined property and no default fallback', function() {
        var testObj = {};

        expect(utility.getValue(testObj, 'level1')).toEqual(null);
    });
    it('Can return default fallback for undefined property', function() {
        var testObj = {};

        expect(utility.getValue(testObj, 'level1', 'testFallback')).toEqual('testFallback');
    });

    it('Can set an existing single level property of object', function() {
        var testObj = {
            level1: null
        };

        utility.setValue(testObj, 'level1', 'test');

        expect(testObj.level1).toEqual('test');
    });
    it('Can create a single level property of object', function() {
        var testObj = {};

        utility.setValue(testObj, 'level1', 'test');

        expect(testObj.level1).toEqual('test');
    });

    it('Can set an existing many level property of object', function() {
        var testObj = {
            level1: {
                level2: {
                    level3: null
                }
            }
        };

        utility.setValue(testObj, 'level1.level2.level3', 'test');

        expect(testObj.level1.level2.level3).toEqual('test');
    });
    it('Can create a many level property of object', function() {
        var testObj = {
            level1: {
                leve2: {}
            }
        };

        utility.setValue(testObj, 'level1.level2.level3', 'test');

        expect(testObj.level1.level2.level3).toEqual('test');
    });

});
});