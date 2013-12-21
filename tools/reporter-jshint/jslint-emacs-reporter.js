/*jshint node: true */
var reporter_name = "jhlint";

module.exports = {
    reporter: function (data) {
        "use strict";

        var str = '',
            errors = [];

        data.forEach(function (data) {
            var file = data.file;

            if (data.error) {
                data.error.file = file;
                errors.push( data.error );
            }

            if (data.implieds) {
                data.implieds.forEach(function (error) {
                    // completing global
                    error.id = '(warning)';
                    error.reason = 'Implied global \'' + error.name + '\'';
                    error.file = file;

                    errors.push(error);
                });
            }

            if (data.unused) {
                data.unused.forEach(function (error) {
                    error.id = '(warning)';
                    error.reason = 'Unused variable \'' + error.name + '\'';
                    error.file = file;

                    errors.push(error);
                });
            }
        });

        errors.forEach(function (error) {
            var file = error.file,
                error_id;
            if (error.id === '(error)') {
                error_id = 'ERROR';
            } else {
                error_id = 'WARNING';
            }
            str += '\x1b[0m'+file  + ':' + error.line + ': \x1B[0;31m error ( ' + error.code + ' ) ' + error.reason + '\n\x1B[0;33m' + error.evidence + '\n\x1b[0m';

        });

        if (str) {
            process.stdout.write(str + "\n");
        }
    }
};
