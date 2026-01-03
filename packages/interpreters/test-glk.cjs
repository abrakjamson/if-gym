const GlkOte = require('glkote-term');
const Glk = GlkOte.Glk;

const myGlkOte = {
    init: function(opts) { console.log('MyGlkOte.init called'); },
    update: function(data) { console.log('MyGlkOte.update called', data); },
    log: console.log,
    warning: console.warn,
    error: console.error
};

const options = {
    GlkOte: myGlkOte,
    Glk: Glk,
    Dialog: {
        open: function() {},
        save: function() {}
    },
    vm: {
        init: function() {
            console.log('VM.init called');
            // Simulate output
            // In a real VM, it calls Glk functions to print.
            // Glk buffer output then Glk.update() flushes it.
            
            // Let's call a Glk function if we can.
            // But Glk needs to be initialized.
        }
    }
};

console.log('Calling Glk.init...');
Glk.init(options);
console.log('Glk.init returned.');

console.log('Calling Glk.update...');
Glk.update();
console.log('Glk.update returned.');

console.log('Calling Glk.glk_select...');
const event = new Glk.RefStruct();
Glk.glk_select(event);
console.log('Glk.glk_select returned.');


