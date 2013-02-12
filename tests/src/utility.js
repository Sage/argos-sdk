define([
    'doh/runner',
    'dojo/dom-construct',
    'argos/utility'
], function (
    doh,
    domConstruct,
    utility
) {
    doh.register('argos-tests.src.utility', [
        {
            name:'Can get single level property of object',
            runTest:function () {

                var testObj = {
                    level1:'test'
                };

                doh.assertEqual(utility.getValue(testObj, 'level1'), 'test');
            }
        },
        {
            name:'Can get many level property of object via string notation',
            runTest:function () {
                var testObj = {
                    level1:{
                        level2:{
                            level3:{
                                level4:{
                                    level5:'test'
                                }
                            }
                        }
                    }
                };
                doh.assertEqual(utility.getValue(testObj, 'level1.level2.level3.level4.level5'), 'test');
            }
        },
        {
            name:'Can return null for undefined property and no default fallback',
            runTest:function () {
                var testObj = {};

                doh.assertEqual(utility.getValue(testObj, 'level1'), null);
            }
        },
        {
            name:'Can return default fallback for undefined property',
            runTest:function () {
                var testObj = {};

                doh.assertEqual(utility.getValue(testObj, 'level1', 'testFallback'), 'testFallback');
            }
        },

        {
            name:'Can set an existing single level property of object',
            runTest:function () {
                var testObj = {
                    level1:null
                };

                utility.setValue(testObj, 'level1', 'test');

                doh.assertEqual(testObj.level1, 'test');
            }
        },
        {
            name:'Can create a single level property of object',
            runTest:function () {
                var testObj = {};

                utility.setValue(testObj, 'level1', 'test');

                doh.assertEqual(testObj.level1, 'test');
            }
        },

        {
            name:'Can set an existing many level property of object',
            runTest:function () {
                var testObj = {
                    level1:{
                        level2:{
                            level3:null
                        }
                    }
                };

                utility.setValue(testObj, 'level1.level2.level3', 'test');

                doh.assertEqual(testObj.level1.level2.level3, 'test');
            }
        },
        {
            name:'Can create a many level property of object',
            runTest:function () {
                var testObj = {
                    level1:{
                        leve2:{}
                    }
                };

                utility.setValue(testObj, 'level1.level2.level3', 'test');

                doh.assertEqual(testObj.level1.level2.level3, 'test');
            }
        },

        {
            name:'Can detect that a node is within another node, one level deep',
            runTest:function () {
                var root = domConstruct.create('div'),
                    child = domConstruct.place('<div></div>', root);

                doh.assertEqual(utility.contains(root, child), true);
            }
        },
        {
            name:'Can detect that a node is within another node, two levels deep',
            runTest:function () {
                var root = domConstruct.create('div'),
                    child = domConstruct.place('<div></div>', root),
                    childTwo = domConstruct.place('<div></div>', child);

                doh.assertEqual(utility.contains(root, childTwo), true);
            }
        },
        {
            name:'Can return false when two nodes are the same node',
            runTest:function () {
                var root = domConstruct.create('div');

                doh.assertEqual(utility.contains(root, root), false);
            }
        },
        {
            name:'Can return false when a node is NOT within another node',
            runTest:function () {
                var root = domConstruct.create('div'),
                    child = domConstruct.create('div');

                doh.assertEqual(utility.contains(root, child), false);
            }
        },

        {
            name:'Can expand a function, returning its result',
            runTest:function () {
                var func = function () {
                    return 'success';
                };
                doh.assertEqual(utility.expand(this, func), 'success');
            }
        },
        {
            name:'Can expand a non-function (string), by immediately returning itself',
            runTest:function () {
                var str = 'success';
                doh.assertEqual(utility.expand(this, str), str);
            }
        },
        {
            name:'Can expand a non-function (object), by immediately returning itself',
            runTest:function () {
                var obj = {test:'success'};
                doh.assertEqual(utility.expand(this, obj), obj);
            }
        },

        {
            name:'Can expand a function, returning its result',
            runTest:function () {
                var func = function () {
                    return 'success';
                };
                doh.assertEqual(utility.expandSafe(this, func), 'success');
            }
        },
        {
            name:'Can expand a non-function (string), by returning a cloned copy',
            runTest:function () {
                var str = 'success';
                var result = utility.expandSafe(this, str);
                doh.assertEqual(result, str);
            }
        },
        {
            name:'Can expand a non-function (obj), by return a cloned copy (altering original)',
            runTest:function () {
                var obj = {test:'success'};
                var result = utility.expandSafe(this, obj);

                obj.test = 'failure';

                // verify it no longer matches original since the original was modified
                doh.assertNotEqual(result, obj);

                // verify it matches the first original defined state (ie, make sure it was cloned)
                doh.assertEqual(result.test, 'success');
            }
        },

        {
            name:'Can sanitize a valid json object, (no modifications)',
            runTest:function () {
                var json = {
                    test:'success'
                };
                var expected = {
                    test:'success'
                };
                doh.assertEqual(utility.sanitizeForJson(json), expected);
            }
        },
        {
            name:'Can sanitize a valid json object, (no modifications), with array',
            runTest:function () {
                var json = {
                    test:[
                        {ele:0},
                        {ele:1},
                        {ele:2}
                    ]
                };
                var expected = {
                    test:[
                        {ele:0},
                        {ele:1},
                        {ele:2}
                    ]
                };
                doh.assertEqual(utility.sanitizeForJson(json), expected);
            }
        },
        {
            name:'Can sanitize a valid json object, removing functions',
            runTest:function () {
                var json = {
                    test:'success',
                    func:function () {
                    }
                };
                var expected = {
                    test:'success'
                };
                doh.assertEqual(utility.sanitizeForJson(json), expected);
            }
        },
        {
            name:'Can sanitize a valid json object, setting undefined to string "undefined"',
            runTest:function () {
                var json = {
                    test:'success',
                    undef:undefined
                };
                var expected = {
                    test:'success',
                    undef:'undefined'
                };
                doh.assertEqual(utility.sanitizeForJson(json), expected);
            }
        },
        {
            name:'Can sanitize a valid json object, setting null to string "null"',
            runTest:function () {
                var json = {
                    test:'success',
                    nll:null
                };
                var expected = {
                    test:'success',
                    nll:'null'
                };
                doh.assertEqual(utility.sanitizeForJson(json), expected);
            }
        },
        {
            name:'Can sanitize a valid json object, setting the key "scope" to string "null"',
            runTest:function () {
                var json = {
                    test:'success',
                    scope:{}
                };
                var expected = {
                    test:'success',
                    scope:'null'
                };
                doh.assertEqual(utility.sanitizeForJson(json), expected);
            }
        },
        {
            name:'Can sanitize a valid json object, expanding json strings back to obj form',
            runTest:function () {
                var json = {
                    test:'success',
                    expand:'{"inner": "success"}'
                };
                var expected = {
                    test:'success',
                    expand:{
                        inner:'success'
                    }
                };
                doh.assertEqual(utility.sanitizeForJson(json), expected);
            }
        },
        {
            name:'Can sanitize a valid json object with arrays, expanding json strings back to obj form',
            runTest:function () {
                var json = {
                    test:'success',
                    expand:'{"inner":["success","success2",{"inner2":"success3"}]}'
                };
                var expected = {
                    test:'success',
                    expand:{
                        inner:[
                            'success',
                            'success2',
                            {
                                "inner2":"success3"
                            }
                        ]
                    }
                };
                doh.assertEqual(utility.sanitizeForJson(json), expected);
            }
        },

        {
            name:'Can convert a single layer deep (no splitting) name to a dot-notated path',
            runTest:function () {
                var name = 'test';
                var path = ['test'];
                doh.assertEqual(utility.nameToPath(name), path);
            }
        },
        {
            name:'Can convert a two layer deep name via dot to a dot-notated path',
            runTest:function () {
                var name = 'test.case';
                var path = ['case', 'test'];
                doh.assertEqual(utility.nameToPath(name), path);
            }
        },
        {
            name:'Can convert a two layer deep name via array number to a dot-notated path',
            runTest:function () {
                var name = 'test[0]';
                var path = [0, 'test'];
                doh.assertEqual(utility.nameToPath(name), path);
            }
        },
        {
            name:'Can convert a multi layer deep name via array numbers and dots to a dot-notated path',
            runTest:function () {
                var name = 'test.case[0].items[4]';
                var path = [4, 'items', 0, 'case', 'test'];
                doh.assertEqual(utility.nameToPath(name), path);
            }
        }

    ]);
});