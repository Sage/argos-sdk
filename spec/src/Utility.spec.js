define('spec/utility.spec', [
    'dojo/_base/lang',
    'dojo/dom-construct',
    'argos/utility'
], function(
    lang,
    domConstruct,
    utility
) {
return describe('argos.utility', function() {

    /**
     * utility.getValue
     */
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

    /**
     * utility.setValue
     */
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

    /**
     * utility.contains
     */
    it('Can detect that a node is within another node, one level deep', function() {
        var root = domConstruct.create('div'),
            child = domConstruct.place('<div></div>', root);

        expect(utility.contains(root, child)).toEqual(true);
    });
    it('Can detect that a node is within another node, two levels deep', function() {
        var root = domConstruct.create('div'),
            child = domConstruct.place('<div></div>', root),
            childTwo = domConstruct.place('<div></div>', child);

        expect(utility.contains(root, childTwo)).toEqual(true);
    });
    it('Can return false when two nodes are the same node', function() {
        var root = domConstruct.create('div');

        expect(utility.contains(root, root)).toEqual(false);
    });
    it('Can return false when a node is NOT within another node', function() {
        var root = domConstruct.create('div'),
            child = domConstruct.create('div');

        expect(utility.contains(root, child)).toEqual(false);
    });

    /**
     * utility.bindDelegate
     */
    it('Can append params to a function', function() {
        var base = function() { return arguments; },
            proxy = base.bindDelegate(this, 'test2');

        expect(proxy('test1')).toEqual(['test1', 'test2']);
    });
    it('Can alter the context of the special "this" object of a function', function() {
        var base = {
            target: 'failure',
            returnTarget: function() { return this.target; }
        };

        var targetContext = {
            target: 'success'
        };

        var proxy = base.returnTarget.bindDelegate(targetContext);

        expect(proxy()).toEqual('success');
    });

    /**
     * utility.expand
     */
    it('Can expand a function, returning its result', function() {
        var func = function() { return 'success'; };
        expect(utility.expand(this, func)).toEqual('success');
    });
    it('Can expand a non-function (string), by immediately returning itself', function() {
        var str = 'success';
        expect(utility.expand(this, str)).toEqual(str);
    });
    it('Can expand a non-function (object), by immediately returning itself', function() {
        var obj = {test: 'success'};
        expect(utility.expand(this, obj)).toEqual(obj);
    });

    /**
     * utility.expandSafe
     */
    it('Can expand a function, returning its result', function() {
        var func = function() { return 'success'; };
        expect(utility.expandSafe(this, func)).toEqual('success');
    });
    it('Can expand a non-function (string), by returning a cloned copy', function() {
        var str = 'success';
        var result = utility.expandSafe(this, str);
        expect(result).toEqual(str);
    });
    it('Can expand a non-function (obj), by return a cloned copy (altering original)', function() {
        var obj = {test: 'success'};
        var result = utility.expandSafe(this, obj);

        obj.test = 'failure';

        // verify it no longer matches original since the original was modified
        expect(result).not.toBe(obj);

        // verify it matches the first original defined state (ie, make sure it was cloned)
        expect(result.test).toEqual('success');
    });

    /**
     * utility.sanitizeForJson
     */
    it('Can sanitize a valid json object, (no modifications)', function() {
        var json = {
            test: 'success'
        };
        var expected = {
            test: 'success'
        };
        expect(utility.sanitizeForJson(json)).toEqual(expected);
    });
    it('Can sanitize a valid json object, (no modifications), with array', function() {
        var json = {
            test: [ {ele: 0}, {ele: 1}, {ele: 2} ]
        };
        var expected = {
            test: [ {ele: 0}, {ele: 1}, {ele: 2} ]
        };
        expect(utility.sanitizeForJson(json)).toEqual(expected);
    });
    it('Can sanitize a valid json object, removing functions', function() {
        var json = {
            test: 'success',
            func: function() {}
        };
        var expected = {
            test: 'success'
        };
        expect(utility.sanitizeForJson(json)).toEqual(expected);
    });
    it('Can sanitize a valid json object, setting undefined to string "undefined"', function() {
        var json = {
            test: 'success',
            undef: undefined
        };
        var expected = {
            test: 'success',
            undef: 'undefined'
        };
        expect(utility.sanitizeForJson(json)).toEqual(expected);
    });
    it('Can sanitize a valid json object, setting null to string "null"', function() {
        var json = {
            test: 'success',
            nll: null
        };
        var expected = {
            test: 'success',
            nll: 'null'
        };
        expect(utility.sanitizeForJson(json)).toEqual(expected);
    });
    it('Can sanitize a valid json object, setting the key "scope" to string "null"', function() {
        var json = {
            test: 'success',
            scope: {}
        };
        var expected = {
            test: 'success',
            scope: 'null'
        };
        expect(utility.sanitizeForJson(json)).toEqual(expected);
    });
    it('Can sanitize a valid json object, expanding json strings back to obj form', function() {
        var json = {
            test: 'success',
            expand: '{"inner": "success"}'
        };
        var expected = {
            test: 'success',
            expand: {
                inner: 'success'
            }
        };
        expect(utility.sanitizeForJson(json)).toEqual(expected);
    });
    it('Can sanitize a valid json object with arrays, expanding json strings back to obj form', function() {
        var json = {
            test: 'success',
            expand: '{"inner":["success","success2",{"inner2":"success3"}]}'
        };
        var expected = {
            test: 'success',
            expand: {
                inner: [
                    'success',
                    'success2',
                    {
                        "inner2": "success3"
                    }
                ]
            }
        };
        expect(utility.sanitizeForJson(json)).toEqual(expected);
    });

    /**
     * utility.nameToPath
     */
    it('Can convert a single layer deep (no splitting) name to a dot-notated path', function() {
        var name = 'test';
        var path = ['test'];
        expect(utility.nameToPath(name)).toEqual(path);
    });
    it('Can convert a two layer deep name via dot to a dot-notated path', function() {
        var name = 'test.case';
        var path = ['case', 'test'];
        expect(utility.nameToPath(name)).toEqual(path);
    });
    it('Can convert a two layer deep name via array number to a dot-notated path', function() {
        var name = 'test[0]';
        var path = [0, 'test'];
        expect(utility.nameToPath(name)).toEqual(path);
    });
    it('Can convert a multi layer deep name via array numbers and dots to a dot-notated path', function() {
        var name = 'test.case[0].items[4]';
        var path = [4, 'items', 0, 'case', 'test'];
        expect(utility.nameToPath(name)).toEqual(path);
    });

});
});