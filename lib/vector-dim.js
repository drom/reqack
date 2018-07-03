'use strict';

module.exports = size => {
    const body = (Math.abs(size) > 1)
        ? '[' + (Math.abs(size) - 1) + ':0]'
        : '';
    return ((' ').repeat(20) + body + ' ').slice(-12);
};
