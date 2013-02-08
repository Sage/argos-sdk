define('spec/Views/DateTimePicker', [
    'dojo/dom-attr',
    'dojo/dom-class',
    'argos/Views/DateTimePicker'
], function(
    domAttr,
    domClass,
    DateTimePicker) {
return describe('argos.Views.DateTimePicker', function() {

    var datetimepicker = new DateTimePicker();
    beforeEach(function() {
        datetimepicker.destroy();
        datetimepicker = new DateTimePicker();
    });

    it('Can return the number of days in January', function() {
        datetimepicker.month = 0;
        datetimepicker.year = 2012;
        expect(datetimepicker.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in February (leap year)', function() {
        datetimepicker.month = 1;
        datetimepicker.year = 2012;
        expect(datetimepicker.daysInMonth()).toEqual(29);
    });
    it('Can return the number of days in February (non-leap year)', function() {
        datetimepicker.month = 1;
        datetimepicker.year = 2011;
        expect(datetimepicker.daysInMonth()).toEqual(28);
    });
    it('Can return the number of days in March', function() {
        datetimepicker.month = 2;
        datetimepicker.year = 2011;
        expect(datetimepicker.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in April', function() {
        datetimepicker.month = 3;
        datetimepicker.year = 2012;
        expect(datetimepicker.daysInMonth()).toEqual(30);
    });
    it('Can return the number of days in May', function() {
        datetimepicker.month = 4;
        datetimepicker.year = 2012;
        expect(datetimepicker.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in June', function() {
        datetimepicker.month = 5;
        datetimepicker.year = 2012;
        expect(datetimepicker.daysInMonth()).toEqual(30);
    });
    it('Can return the number of days in July', function() {
        datetimepicker.month = 6;
        datetimepicker.year = 2012;
        expect(datetimepicker.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in August', function() {
        datetimepicker.month = 7;
        datetimepicker.year = 2012;
        expect(datetimepicker.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in September', function() {
        datetimepicker.month = 8;
        datetimepicker.year = 2012;
        expect(datetimepicker.daysInMonth()).toEqual(30);
    });
    it('Can return the number of days in October', function() {
        datetimepicker.month = 9;
        datetimepicker.year = 2012;
        expect(datetimepicker.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in November', function() {
        datetimepicker.month = 10;
        datetimepicker.year = 2012;
        expect(datetimepicker.daysInMonth()).toEqual(30);
    });
    it('Can return the number of days in December', function() {
        datetimepicker.month = 11;
        datetimepicker.year = 2012;
        expect(datetimepicker.daysInMonth()).toEqual(31);
    });
    
    it('Can add toggleStateOn to meridiem node', function() {
        var node = document.createElement('div');

        spyOn(datetimepicker, 'updateDatetimeCaption');
        datetimepicker.toggleMeridiem({$source: node});

        expect(domClass.contains(node, 'toggleStateOn')).toEqual(true);
    });
    it('Can remove toggleStateOn from meridiem node', function() {
        var node = document.createElement('div');
        domClass.add(node, 'toggleStateOn');

        spyOn(datetimepicker, 'updateDatetimeCaption');
        datetimepicker.toggleMeridiem({$source: node});

        expect(domClass.contains(node, 'toggleStateOn')).toEqual(false);
    });
    it('Can add toggled attribute to meridiem node', function() {
        var node = document.createElement('div');

        spyOn(datetimepicker, 'updateDatetimeCaption');
        datetimepicker.toggleMeridiem({$source: node});

        expect(domAttr.get(node, 'toggled')).toEqual(true);
    });
    it('Can remove toggled attribute from meridiem node', function() {
        var node = document.createElement('div');
        node.toggled = true;

        spyOn(datetimepicker, 'updateDatetimeCaption');
        datetimepicker.toggleMeridiem({$source: node});

        expect(domAttr.get(node, 'toggled')).toEqual(false);
    });
    it('Can call update after meridiem toggle', function() {
        spyOn(datetimepicker, 'updateDatetimeCaption');
        datetimepicker.toggleMeridiem({});
        expect(datetimepicker.updateDatetimeCaption).toHaveBeenCalled();
    });

    it('Can populate a select element with numbered nodes', function() {
        var select = document.createElement('select');
        datetimepicker.populateSelector(select, 0, 0, 3);
        expect(select.options.length).toEqual(4);
    });
    it('Can populate a select element with numbered nodes, with leading zeroes to the text', function() {
        var select = document.createElement('select');
        datetimepicker.populateSelector(select, 0, 0, 3);
        expect(select.options[0].innerHTML).toEqual('00');
    });
    it('Can populate a select element with numbered nodes, with setting the default selected', function() {
        var select = document.createElement('select');
        datetimepicker.populateSelector(select, 0, 0, 3);
        expect(domAttr.get(select.options[0],'selected')).toEqual(true);
    });
    it('Can populate a select element with numbered nodes, with setting the values', function() {
        var select = document.createElement('select');
        datetimepicker.populateSelector(select, 0, 0, 3);
        expect(domAttr.get(select.options[0],'value')).toEqual('0');
    });

});
});