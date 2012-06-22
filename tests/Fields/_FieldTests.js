define('Fields/_FieldTests', ['dojo/query','Sage/Platform/Mobile/Fields/_Field'], function(query, _Field) {
return describe('Sage.Platform.Mobile.Fields._Field', function() {

    it('Can mixin properties on construction', function() {
        var field = new _Field({test:'test'});

        expect(field.test).toEqual('test');
    });

    it('Can be placed into a target HTML node', function() {
        var field = new _Field();
        var container = document.createElement('div');

        field.renderTo(container);

        expect(container.childNodes.length).toBeGreaterThan(0);
    });
    it('Can store a reference to the node it is placed within', function() {
        var field = new _Field();
        var container = document.createElement('div');

        field.renderTo(container);

        expect(field.containerNode).toEqual(container);
    });
    it('Can set disabled to false on enable', function() {
        var field = new _Field();

        field.disabled = true;

        field.enable();

        expect(field.disabled).toEqual(false);
    });
    it('Can fire onEnable event when on enable', function() {
        var field = new _Field();

        var spyOnEnable = spyOn(field, 'onEnable');

        field.enable();

        expect(spyOnEnable).toHaveBeenCalled();
    });
    it('Can set disabled to true on disable', function() {
        var field = new _Field();

        field.disabled = false;

        field.disable();

        expect(field.disabled).toEqual(true);
    });
    it('Can fire onDisable event when on disable', function() {
        var field = new _Field();

        var spyOnDisable = spyOn(field, 'onDisable');

        field.disable();

        expect(spyOnDisable).toHaveBeenCalled();
    });
    it('Can get disabled state', function() {
        var field = new _Field();

        field.disabled = 'test';

        expect(field.isDisabled()).toEqual('test');
    });

    it('Can set hidden to false on show', function() {
        var field = new _Field();

        field.hidden = true;

        field.show();

        expect(field.hidden).toEqual(false);
    });
    it('Can fire onShow event when on show', function() {
        var field = new _Field();

        var spyOnShow = spyOn(field, 'onShow');

        field.show();

        expect(spyOnShow).toHaveBeenCalled();
    });
    it('Can set hidden to true on hide', function() {
        var field = new _Field();

        field.hidden = false;

        field.hide();

        expect(field.hidden).toEqual(true);
    });
    it('Can fire onHide event when on hide', function() {
        var field = new _Field();

        var spyOnHide = spyOn(field, 'onHide');

        field.hide();

        expect(spyOnHide).toHaveBeenCalled();
    });
    it('Can get hidden state', function() {
        var field = new _Field();

        field.hidden = 'test';

        expect(field.isHidden()).toEqual('test');
    });

    /*
    _Field validate() and validator as fn should return FALSE for "good" values
    and TRUE for "bad" values
    validator as RegExp follows: regexp.test(str) should return TRUE for "good", FALSE for "bad"
     */
    it('Can return false for validate when validator is undefined', function() {
        var field = new _Field();

        field.validator = undefined;

        expect(field.validate()).toEqual(false);
    });
    it('Can validate using single RegExp pattern', function() {
        var field = new _Field();

        field.validator = /^test/;

        expect(field.validate('testing')).toEqual(false);
    });
    it('Can validate using array of RegExp patterns', function() {
        var field = new _Field();

        field.validator = [/^test/, /ing$/];

        expect(field.validate('testing')).toEqual(false);
    });
    it('Can validate using single custom function', function() {
        var field = new _Field();

        field.validator = function(val) {
            return val !== 'testing';
        };

        expect(field.validate('testing')).toEqual(false);
    });
    it('Can validate using array of custom functions', function() {
        var field = new _Field();

        field.validator = [function(val) {
            return val !== 'testing';
        }, function(val){
            return val !== 'testing';
        }];

        expect(field.validate('testing')).toEqual(false);
    });
    it('Can validate using single custom object with fn', function() {
        var field = new _Field();

        field.validator = {
            fn: function(val) {
                    return val !== 'testing';
            }
        };

        expect(field.validate('testing')).toEqual(false);
    });
    it('Can validate using single custom object with test', function() {
        var field = new _Field();

        field.validator = {
            test: /^test/
        };

        expect(field.validate('testing')).toEqual(false);
    });

    it('Can call getValue when value is not passed in to validate', function() {
        var field = new _Field();

        var spyOnGetValue = spyOn(field, 'getValue');

        field.validator = function(val) {
            return val !== 'testing';
        };

        field.validate();

        expect(spyOnGetValue).toHaveBeenCalled();
    });

    it('Can validate using single custom object with message and return formatted error message (value test)', function() {
        var field = new _Field();

        field.validator = {
            test: /^err/,
            message: '${0}'
        };

        expect(field.validate('testing')).toEqual('testing');
    });

    it('Can validate using single custom object with message and return formatted error message (name test)', function() {
        var field = new _Field();

        field.name = 'testName';

        field.validator = {
            test: /^err/,
            message: '${1}'
        };

        expect(field.validate('testing')).toEqual('testName');
    });

    it('Can validate using single custom object with message as formatter and return formatted error message (label test)', function() {
        var field = new _Field();

        field.label = 'testLabel';

        field.validator = {
            test: /^err/,
            message: '${2}'
        };

        expect(field.validate('testing')).toEqual('testLabel');
    });

    it('Can validate using single custom object with message as function and return formatted error message', function() {
        var field = new _Field();

        field.validator = {
            test: /^err/,
            message: function(value) { return value;}
        };

        expect(field.validate('testing')).toEqual('testing');
    });
    it('Can validate using single custom object with message as function with scope and return formatted error message', function() {
        var field = new _Field();

        var scope = {
            text: 'scopedMessage'
        };

        field.validator = {
            test: /^err/,
            message: function() { return this.text;},
            scope: scope
        };

        expect(field.validate('testing')).toEqual('scopedMessage');
    });


});
});