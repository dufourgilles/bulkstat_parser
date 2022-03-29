import {ConfigReader} from "./ConfigReader";
import {BulkFormula}  from "./BulkFormula";
import {BulkstatReader, StatRecords} from "./BulkstatReader";
import {BulkstatAnalyzer, CounterNames} from "./BulkstatAnalyzer";
import {DirList} from "./DirList";
import yargs from "yargs";
import { BulkLineIdentifier } from "./BulkstatLine";

const process = async (key: string, tolerance: number, configFile: string, statFiles: string[], filters: string[], formula?: string) => {
    console.log(`Parsing config file ${configFile}`);    
    const configReader = ConfigReader.createReader(configFile);    
    const bulkstatConfig = await configReader.getBulkstatSchemaAsync();
    //console.log(schemas);
    const bulkData: StatRecords[] = [];
    for(let i = 0; i < statFiles.length; i++) {
        console.log(`Reading bulk file ${statFiles[i]}`);
        const bulkstatReader = BulkstatReader.createReader(statFiles[i]);
        await bulkstatReader.getBulkstatDataAsync(bulkstatConfig, filters);
        bulkData.push(bulkstatReader.stats);
    }
    const bulkstatAnalyzer = new BulkstatAnalyzer(bulkData, bulkstatConfig);    
    
    console.log("Comparing bulk stats");
    bulkstatAnalyzer.parse();

    if (formula != null) {
        const bsFormula = new BulkFormula(formula, bulkData, bulkstatAnalyzer, bulkstatConfig);
        bsFormula.computeKPI();
    }


    //console.log(`Looking for ${key}`);
    const lineIdentifiers: Record<BulkLineIdentifier, CounterNames> = bulkstatAnalyzer.findMatch(key, tolerance);
    console.log("done");
    for(const lineIdentifier in lineIdentifiers) {
        let firstLine = false;       
        if (Object.keys(lineIdentifiers[lineIdentifier]).length > 20) {
            // skip - too many counters
            continue;
        } 
        for(let matchingLineIdentifier in lineIdentifiers[lineIdentifier]) {           
            const counters = lineIdentifiers[lineIdentifier][matchingLineIdentifier];
            const schema = bulkstatConfig.getSchemaFromStatLineIdentifier(matchingLineIdentifier);
            if (!firstLine) {
                console.log(`========= ${lineIdentifier} ============`);
                firstLine = true;
            }
            for(let counter of counters) {
                const counterPos = schema.findCounterPosByName(counter);
                let logLine = `${counter}:                                       `.slice(0, 50);
                let diffLine = "DIFF:                                            ".slice(0, 50);
                for(let i = 0; i < bulkData.length; i++) {
                    logLine += `${("00000000000000" + bulkData[i][matchingLineIdentifier].data[counterPos]).slice(-10)} `;
                    const diff = i <= 0 ? 0 : Number(bulkData[i][matchingLineIdentifier].data[counterPos]) - Number(bulkData[i-1][matchingLineIdentifier].data[counterPos])
                    diffLine += `${("00000000000000" + diff).slice(-10)} `;
                }
                console.log(logLine);
                console.log(diffLine)
            }
        }
    }
    try {
        bulkstatAnalyzer.checkDeviation(tolerance);
    }
    catch(e) {
        console.log(e);
    }
}

const mainFunc = async (argv: Record<string, string>) => {
    try {
        let bulks = [];
        // if (argv.key == null) {
        //     argv.key = "%emm-msgtx-tau-network-fail-hss-unavailable%";
        //     argv.tolerance = 30;
        //     argv.configfile = "/Volumes/gdnet/backup/Downloads/STC/SSD-PS-v-30-01-2021.txt";
        //     argv.dir = "/Volumes/gdnet/backup/Downloads/STC/BS/20210129/";
        //     argv.start = 150001;
        //     argv.end = 180000;
        //     argv.pace = 3000;
        // }
        
        if (argv.dir) {
            console.log(`Getting bs from ${argv.dir}`);
            bulks = await DirList.getFiles(argv.dir, Number(argv.start), Number(argv.end), argv.pace ? Number(argv.pace) : undefined);
        }
        else {
            bulks = argv.bulks.split(",");
        }
        await process(argv.key, Number(argv.tolerance), argv.configfile, bulks, [].concat(argv.filterOut), argv.formula);
    }
    catch(e) {
        console.log(e);
    }
}

const argv = yargs.options({
    key: {
        alias: 'k',
        description: 'Counter key.',
        demandOption: false
    },
    configfile: {
        alias: 'c',
        description: 'StarOS Config file or SSD.',
        demandOption: false
    },
    bulks: {
        alias: 'b',
        description: 'Bulkstat files comma separated and time base ordered.',
        demandOption: false
    },
    dir: {
        alias: 'd',
        description: 'directory containing the BS files',
        demandOption: false
    },
    formula: {
        alias: 'f',
        description: 'KPI Formula',
        demandOption: false,
        type: 'string'
    },
    filterOut: {
        alias: 'o',
        description: 'Exclude line matching filter',
        demandOption: false
    },
    start: {
        alias: 's',
        description: 'start time',
        type: 'number',
        demandOption: false
    },
    end: {
        alias: 'e',
        description: 'end time',
        type: 'number',
        demandOption: false
    },
    pace: {
        alias: 'p',
        description: 'step increment for file selection',
        type: 'number',
        demandOption: false
    },
    tolerance: {
        alias: 't',
        type: 'number',
        description: 'Tolerance percentage for counter match.',
        demandOption: false,
        default: 1
    }
}).help().argv;

mainFunc(argv as Record<string, string>).then(() => { "done."});