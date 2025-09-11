'use strict';

const { Blob, File } = require('buffer');

if (typeof globalThis.File === 'undefined') {
  globalThis.File = File;
}
if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = Blob;
}

console.log('✅ Polyfilled File and Blob for undici compatibility');
