var fs = require('fs');
var path = require('path');
var findit = require('findit');
var Seq = require('seq');

module.exports = function (target, dir, optsOrEx) {
    if (!target) throw new Error('Target name required');
    if (!dir) throw new Error('Directory or files required');
    
    var opts = typeof optsOrEx === 'object' && !Array.isArray(optsOrEx)
        ? optsOrEx
        : { extension : optsOrEx }
    ;
    
    var filter = function (file) {
        var ext = path.extname(file);
        if (!opts.extension) {
            return true;
        }
        else if (typeof opts.extension === 'function') {
            return opts.extension(file);
        }
        else if (typeof opts.extension === 'string') {
            return opts.extension === ext;
        }
        else if (Array.isArray(opts.extension)) {
            return opts.extension.some(function (e) { return e === ext });
        }
        else {
            return true;
        }
    };
    
    var watches = {};
    var self = function (bundle) {
        var files = [];
        
        function finder (file, stat) {
            if (stat.isDirectory()) {
                if (opts.watch) {
                    watches[file] = true;
                    fs.watchFile(file, function (curr, prev) {
                        if (curr.nlink === 0) {
                            // deleted
                        }
                        else {
                            // modified
                            fs.readdir(file, function (err, xs) {
                                var rescan = false;
                                xs.forEach(function (x) {
                                    var f = path.resolve(file, x);
                                    if (fs.statSync(f).isDirectory()) {
                                        findit.sync(f, finder);
                                    }
                                    else if (files.indexOf(f) < 0) {
                                        files.push(f);
                                        include(files);
                                    }
                                });
                            });
                        }
                    });
                }
            }
            else if (filter(file)) {
                var i = files.length;
                files.push(file);
                
                if (opts.watch) {
                    watches[file] = true;
                    fs.watchFile(file, function (curr, prev) {
                        if (curr.nlink === 0) {
                            // deleted
                            var i = files.indexOf(file);
                            if (i >= 0) files.splice(i, 1);
                            include(files);
                        }
                        else {
                            include(files);
                        }
                    });
                }
            }
        }
        
        finder(dir, { isDirectory : function () { return true }});
        findit.sync(dir, finder);
        
        var include = function (files) {
            var dst = path.normalize('/node_modules/' + target);
            
            Object.keys(bundle.files).forEach(function (key) {
                if (bundle.files[key].target === dst) {
                    delete bundle.files[key];
                }
            });
            
            var bodies = files.reduce(function (acc, file) {
                var rel = file.slice(dir.length + 1);
                acc[rel] = fs.readFileSync(file, 'utf8');
                return acc;
            }, {});
            
            var file = __dirname + '/browser/files.js';
            var body = fs.readFileSync(file, 'utf8')
                .replace(/\$bodies/, function () {
                    return JSON.stringify(bodies);
                })
            ;
            
            bundle.include(null, dst, body);
        };
        include(files);
    };
    
    self.end = function () {
        Object.keys(watches).forEach(function (file) {
            fs.unwatchFile(file);
        });
    };
    
    return self;
};

