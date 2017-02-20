
var i = 2;
while (i < process.argv.length) {
    processFile('./' + process.argv[i]);
    ++i;
}

function processFile(fileName) {
    var coverage = require(fileName);

    Object.keys(coverage).forEach(function(k) {

        var fileNamePrinted = false;
        var fileCoverage = coverage[k];
        Object.keys(fileCoverage.b).forEach(function(b) {
            var counts = fileCoverage.b[b];
            var branch = fileCoverage.branchMap[b];
            var print = counts.reduce((a, b) => a || b === 0, false);
            if (print) {
                if (!fileNamePrinted) {
                    console.log(k);
                    fileNamePrinted = true;
                }
                var line = branch.line;
                if (typeof line !== 'number') {
                    line = branch.loc.start.line;
                }
                console.log(line + ' ' + JSON.stringify(counts));
                console.log(JSON.stringify(branch));
            }
        });
    });
}