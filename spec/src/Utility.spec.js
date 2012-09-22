define('spec/Utility.spec', [
    'dojo/_base/lang',
    'dojo/dom-construct',
    'argos/Utility'
], function(
    lang,
    domConstruct,
    utility
) {
return describe('argos.Utility', function() {

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
        
    });



});
});