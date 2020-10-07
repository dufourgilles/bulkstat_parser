const ConfigReader = require("./ConfigReader");
const BulkstatReader = require("./BulkstatReader");
const BulkstatTracker = require("./BulkstatTracker");
const yargs = require("yargs");

/**
 * 
 * @param {string} key 
 * @param {number} tolerance 
 * @param {string} configFile 
 * @param {string[]} statFiles 
 */
const mainFunc = async (key, tolerance, configFile, statFiles) => {
    console.log(`Parsing config file ${configFile}`);
    const configReader = ConfigReader.createReader(configFile);
    const bulkstatConfig = await configReader.getBulkstatSchemaAsync();
    //console.log(schemas);
    const bulkData = [];
    for(let i = 0; i < statFiles.length; i++) {
        console.log(`Reading bulk file ${statFiles[i]}`);
        const bulkstatReader = BulkstatReader.createReader(statFiles[i]);
        await bulkstatReader.getBulkstatDataAsync(bulkstatConfig);
        bulkData.push(bulkstatReader.getStats());
    }
    const bulkstatTracker = new BulkstatTracker(bulkData, bulkstatConfig);
    console.log("Comparing bulk stats");
    bulkstatTracker.parse();
    console.log(`Looking for ${key}`);
    const matchResult = bulkstatTracker.findMatch(key, tolerance);
    console.log("done");
    for(let sourceEtendedSchemaName in matchResult) {
        let firstLine = false;       
        if (Object.keys(matchResult[sourceEtendedSchemaName]).length > 20) {
            continue;
        } 
        for(let matchingExtendedSchemaName in matchResult[sourceEtendedSchemaName]) {           
            const counters = matchResult[sourceEtendedSchemaName][matchingExtendedSchemaName];
            const schema = bulkstatConfig.getSchemaFromExtendedSchemaName(matchingExtendedSchemaName);
            if (!firstLine) {
                console.log(`========= ${sourceEtendedSchemaName} ============`);
                firstLine = true;
            }
            for(let counter of counters) {
                const counterPos = schema.findCounterByName(counter);
                let logLine = `${counter}:                                       `.slice(0, 50);
                for(let i = 0; i < bulkData.length; i++) {
                    logLine += `${("00000000000000" + bulkData[i][matchingExtendedSchemaName].getData()[counterPos]).slice(-10)} `;
                }
                console.log(logLine);
            }
        }
    }
}


const argv = yargs.options({
    key: {
        alias: 'k',
        description: 'Counter key.',
        demandOption: true
    },
    configfile: {
        alias: 'c',
        description: 'StarOS Config file or SSD.',
        demandOption: true
    },
    bulks: {
        alias: 'b',
        description: 'Bulkstat files comma separated and time base ordered.',
        demandOption: true
    },
    tolerance: {
        alias: 't',
        type: 'number',
        description: 'Tolerance percentage for counter match.',
        demandOption: false,
        default: 1
    }
}).help().argv;

mainFunc(argv.key, argv.tolerance, argv.configfile, argv.bulks.split(",")).catch((e) => {console.log(e);});