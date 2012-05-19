define('CalendarTests', ['dojo/dom-attr','dojo/dom-class','Sage/Platform/Mobile/Calendar'], function(domAttr, domClass, Calendar) {
return describe('Sage.Platform.Mobile.Calendar', function() {

    var calendar = new Calendar();
    beforeEach(function() {
        calendar.destroy();
        calendar = new Calendar();
    });

    it('Can return the number of days in January', function() {
        calendar.month = 0;
        calendar.year = 2012;
        expect(calendar.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in February (leap year)', function() {
        calendar.month = 1;
        calendar.year = 2012;
        expect(calendar.daysInMonth()).toEqual(29);
    });
    it('Can return the number of days in February (non-leap year)', function() {
        calendar.month = 1;
        calendar.year = 2011;
        expect(calendar.daysInMonth()).toEqual(28);
    });
    it('Can return the number of days in March', function() {
        calendar.month = 2;
        calendar.year = 2011;
        expect(calendar.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in April', function() {
        calendar.month = 3;
        calendar.year = 2012;
        expect(calendar.daysInMonth()).toEqual(30);
    });
    it('Can return the number of days in May', function() {
        calendar.month = 4;
        calendar.year = 2012;
        expect(calendar.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in June', function() {
        calendar.month = 5;
        calendar.year = 2012;
        expect(calendar.daysInMonth()).toEqual(30);
    });
    it('Can return the number of days in July', function() {
        calendar.month = 6;
        calendar.year = 2012;
        expect(calendar.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in August', function() {
        calendar.month = 7;
        calendar.year = 2012;
        expect(calendar.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in September', function() {
        calendar.month = 8;
        calendar.year = 2012;
        expect(calendar.daysInMonth()).toEqual(30);
    });
    it('Can return the number of days in October', function() {
        calendar.month = 9;
        calendar.year = 2012;
        expect(calendar.daysInMonth()).toEqual(31);
    });
    it('Can return the number of days in November', function() {
        calendar.month = 10;
        calendar.year = 2012;
        expect(calendar.daysInMonth()).toEqual(30);
    });
    it('Can return the number of days in December', function() {
        calendar.month = 11;
        calendar.year = 2012;
        expect(calendar.daysInMonth()).toEqual(31);
    });
    
    it('Can add toggleStateOn to meridiem node', function() {
        var node = document.createElement('div');

        spyOn(calendar, 'updateDatetimeCaption');
        calendar.toggleMeridiem({$source: node});

        expect(domClass.contains(node, 'toggleStateOn')).toEqual(true);
    });
    it('Can remove toggleStateOn from meridiem node', function() {
        var node = document.createElement('div');
        domClass.add(node, 'toggleStateOn');

        spyOn(calendar, 'updateDatetimeCaption');
        calendar.toggleMeridiem({$source: node});

        expect(domClass.contains(node, 'toggleStateOn')).toEqual(false);
    });
    it('Can add toggled attribute to meridiem node', function() {
        var node = document.createElement('div');

        spyOn(calendar, 'updateDatetimeCaption');
        calendar.toggleMeridiem({$source: node});

        expect(domAttr.get(node, 'toggled')).toEqual(true);
    });
    it('Can remove toggled attribute from meridiem node', function() {
        var node = document.createElement('div');
        node.toggled = true;

        spyOn(calendar, 'updateDatetimeCaption');
        calendar.toggleMeridiem({$source: node});

        expect(domAttr.get(node, 'toggled')).toEqual(false);
    });
    it('Can call update after meridiem toggle', function() {
        spyOn(calendar, 'updateDatetimeCaption');
        calendar.toggleMeridiem({});
        expect(calendar.updateDatetimeCaption).toHaveBeenCalled();
    });

    it('Can populate a select element with numbered nodes', function() {
        var select = document.createElement('select');
        calendar.populateSelector(select, 0, 0, 3);
        expect(select.options.length).toEqual(4);
    });
    it('Can populate a select element with numbered nodes, with leading zeroes to the text', function() {
        var select = document.createElement('select');
        calendar.populateSelector(select, 0, 0, 3);
        expect(select.options[0].innerHTML).toEqual('00');
    });
    it('Can populate a select element with numbered nodes, with setting the default selected', function() {
        var select = document.createElement('select');
        calendar.populateSelector(select, 0, 0, 3);
        expect(domAttr.get(select.options[0],'selected')).toEqual(true);
    });
    it('Can populate a select element with numbered nodes, with setting the values', function() {
        var select = document.createElement('select');
        calendar.populateSelector(select, 0, 0, 3);
        expect(domAttr.get(select.options[0],'value')).toEqual('0');
    });

});
});