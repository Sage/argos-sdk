// todo: move to argos-saleslogix; this does not belong here.

Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.NoteField = Ext.extend(Sage.Platform.Mobile.Controls.EditorField, {
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button whiteButton"><span>{%: $.lookupText %}</span></a>',
            '<div class="note-text"></div>'
        ]),
        noteProperty: 'Notes',
        emptyText: '',
        
        createNavigationOptions: function() {
            var options = Sage.Platform.Mobile.Controls.NoteField.superclass.createNavigationOptions.apply(this, arguments);
            //Name does not have an entity.
            delete options.entityName;

            if (!this.noteProperty)
            {
                options.entry = {'Notes': options.entry};
                options.changes = {'Notes': options.changes};
            }

            return options;
        },
        formatValue: function(val) {
            return this.noteProperty ? val[this.noteProperty] : val;
        },
        getValue: function() {
            return this.currentValue;
        },
        getValuesFromView: function() {
            Sage.Platform.Mobile.Controls.NoteField.superclass.getValuesFromView.apply(this, arguments);
            
            if (!this.noteProperty)
            {
                this.currentValue = this.currentValue.Notes;
                this.validationValue = this.validationValue.Notes;
            }
        },
        setText: function(text) {
            this.el.dom.innerHTML = text;
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('note', Sage.Platform.Mobile.Controls.NoteField);
})();