const fs = require('fs');
const path = require('path');
const ifvms = require('ifvms');
const GlkOte = require('glkote-term');

const gamePath = path.resolve('packages/cli/games/zdungeon.z5');
const buffer = fs.readFileSync(gamePath);

const Glk = GlkOte.Glk;
const ZVM = ifvms.ZVM;
const vm = new ZVM();
console.log('VM init source:', vm.init.toString().substring(0, 100));

const myGlkOte = {
    init: function(opts) { console.log('MyGlkOte.init'); },
    update: function(data) { console.log('MyGlkOte.update', data); },
    log: console.log,
    warning: console.warn,
    error: console.error
};

// Proxy Glk
const glkProxy = new Proxy(Glk, {
    get: (target, prop) => {
        if (typeof target[prop] === 'function') {
            return (...args) => {
                const name = String(prop);
                if (['init', 'update', 'glk_select', 'fatal_error'].includes(name)) {
                    console.log(`GlkProxy.${name} called`);
                }
                return target[prop](...args);
            };
        }
        return target[prop];
    }
});

const options = {
    vm: vm,
    Dialog: {
        open: function() {},
        save: function() {}
    },
    Glk: glkProxy,
    GlkOte: myGlkOte
};

console.log('Preparing VM...');
vm.prepare(buffer, options);

console.log('Initializing Glk...');
try {
    glkProxy.init(options);
    console.log('Glk.init returned.');
    
    // Inspect VM
    console.log('VM PC:', vm.pc);
    console.log('VM Quit:', vm.quit);
    console.log('VM Stop:', vm.stop);
} catch (e) {
    console.error('Error:', e);
}
