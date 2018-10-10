'use strict';

module.exports = n => (typeof n.label === 'object')
    ? n.label.name || '{ }'
    : (n.label || '').toString();
