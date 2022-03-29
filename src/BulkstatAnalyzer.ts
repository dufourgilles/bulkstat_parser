import { BulkstatConfig } from "./BulkstatConfig";
import { BulkLineIdentifier } from "./BulkstatLine";
import { StatRecords } from "./BulkstatReader";
import { std, median } from 'mathjs';


export type CounterNames = Record<BulkLineIdentifier, string[]>;
export type StatValues = Record<BulkLineIdentifier, Array<number|string>>;
export interface StatRecord {
    valuesFromStart: StatValues[],
    valuesFromPrev: StatValues[],
    valuesFromStartPercent: StatValues[],
    valuesFromPrevPercent: StatValues[]
}

export interface DeviationInfo {
    timestamp: number
    text: string;
    deviationPercent: number;
}

export interface TimedDeviationInfo {
    timestamp: number;
    lines: DeviationInfo[]
}

interface Range {
    min: number,
    max: number
}

export interface StatElement {
    bsLineIdentifier: BulkLineIdentifier;
    counterName: string;
    median: number;
    deviation: number;
    absoluteTolerance: number;
    min: number;
    max: number;
    timestamps: number[];
    rawStats: Array<number|string>;
    diffs: Array<number>;
    pos: Array<number>;
}

export class BulkstatAnalyzer {
    protected results: StatRecord = {
        valuesFromStart: [],
        valuesFromPrev: [],
        valuesFromStartPercent: [],
        valuesFromPrevPercent: []
    }
    constructor(readonly bulkstats: StatRecords[], readonly bulkConfig: BulkstatConfig) {}

    findDeviatingStats(tolerance: number): StatElement[] {
        const statFilterOut = new RegExp(/(card|port)/i);
        const deviatingElements: StatElement[] = [];
        for(const bsLineIdentifier in this.bulkstats[0]) {
            if (statFilterOut != null && bsLineIdentifier.match(statFilterOut) != null) {
                continue;
            }
            let rawData = this.bulkstats[0][bsLineIdentifier].data;
            const schema = this.bulkstats[0][bsLineIdentifier].getSchema();
            const timestampIndex = schema.findCounterPosByName("%epochtime%");
            const elements: StatElement[] = rawData.map((x,index) => ({
                bsLineIdentifier: bsLineIdentifier,
                counterName: schema.getCounterNameAtPos(index),
                median: 0,
                min: 0,
                max: 0,
                absoluteTolerance: 0,
                deviation: 0,
                timestamps: [Number(rawData[timestampIndex])],
                rawStats: [x],
                diffs: [],
                pos: []
            }));
            let nextRawData;
            for(let i = 1; i < this.bulkstats.length; i++, rawData =  nextRawData) {
                nextRawData = this.bulkstats[i][bsLineIdentifier].data;
                for(let j = 0; j < nextRawData.length; j++) {
                    if ((["%localdate%", "%localtime%", "%uptime%", "%epochtime%", "%card%", "PPM","card"].includes(elements[j].counterName) ||
                        (elements[j].counterName && elements[j].counterName.indexOf("mem") >= 0))) {
                        continue;
                    }
                    elements[j].rawStats.push(nextRawData[j]);
                    elements[j].timestamps.push(Number(nextRawData[timestampIndex]));
                    
                    if (rawData[j] == '') {
                        continue;
                    }
                    const numStatInit = Number(rawData[j]);
                    const numStatEnd = Number(nextRawData[j]);
                    if (isNaN(numStatInit) || isNaN(numStatEnd)) {
                        continue;
                    }                    
                    elements[j].diffs.push(numStatInit > numStatEnd ? numStatInit - numStatEnd : numStatEnd - numStatInit);
                }
            }
            elements
            .filter(e => e.diffs.length > 0)
            .forEach(e => {
                e.deviation = 1 + std(e.diffs);
                e.median = median(e.diffs);
                e.absoluteTolerance = (e.median * tolerance) / 100;
                e.min = e.median - e.deviation - e.absoluteTolerance;
                e.max = e.median + e.deviation + e.absoluteTolerance;
                
                for(let i = 0; i < e.diffs.length; i++) {
                    if (e.diffs[i] > e.max || e.diffs[i] < e.min) {
                        e.pos.push(i);
                    }
                }
                if (e.pos.length > 0) {
                    deviatingElements.push(e);
                }
            });
        }
        return deviatingElements;
    }

    parse() {
        for(let bulkstatIndex = 1; bulkstatIndex < this.bulkstats.length; bulkstatIndex++) {
            this._compareFromStart(bulkstatIndex);
            this._compareFromPrev(bulkstatIndex);
            this._compareFromStartPercent(bulkstatIndex);
            this._compareFromPrevPercent(bulkstatIndex);
        }
    }


    _computeDiff(start: number, end: number): number {
        return end - start;
    }

    _computePercentDiff(start: number, end: number): number {
        return (100 * (end - start)) / start;
    }

    _compare(firstBulk: StatRecords, nextBulk: StatRecords, func = this._computeDiff): StatValues {
        const result: StatValues = {};
        for(let bsLineIdentifier in firstBulk) {
            const statInit = firstBulk[bsLineIdentifier].data;
            if (nextBulk[bsLineIdentifier] == null) {
                console.log(`Unknown stat ${bsLineIdentifier} at next interval`);
                // just copy the previous one
                nextBulk[bsLineIdentifier] = firstBulk[bsLineIdentifier];
            }
            const statEnd = nextBulk[bsLineIdentifier].data;
            result[bsLineIdentifier] = [];
            for(let i = 0; i < statInit.length; i++) {
                if (statInit[i] == '') {
                    result[bsLineIdentifier].push('');
                    continue;
                }
                const numStatInit = Number(statInit[i]);
                const numStatEnd = Number(statEnd[i]);
                if (isNaN(numStatInit) || isNaN(numStatEnd)) {
                    result[bsLineIdentifier].push(statInit[i]);
                    continue;
                }
                result[bsLineIdentifier].push(func(numStatInit, numStatEnd));
            }
        }
        return result;
    }

    protected _comparePercent(firstBulk: StatRecords, nextBulk: StatRecords): StatValues {
        return this._compare(firstBulk, nextBulk, this._computePercentDiff);
    }

    protected _compareFromStart(index: number): void {
        this.results.valuesFromStart.push(this._compare(this.bulkstats[0], this.bulkstats[index]));
    }

    protected _compareFromPrev(index: number): void {
        this.results.valuesFromPrev.push(this._compare(this.bulkstats[index - 1], this.bulkstats[index]));
    }

    protected _compareFromStartPercent(index: number): void {
        this.results.valuesFromStartPercent.push(this._comparePercent(this.bulkstats[0], this.bulkstats[index]));
    }

    protected _compareFromPrevPercent(index: number): void {
        this.results.valuesFromPrevPercent.push(this._comparePercent(this.bulkstats[index - 1], this.bulkstats[index]));
    }


    getStatLineIdentifiers(counterName: string): BulkLineIdentifier[] {
        const schemaNames = this.bulkConfig.findSchemaNameWithStatName(counterName);
        const extendedSchemaNames = [];
        for(let schemaName of schemaNames) {
            for(let extendedSchemaName in this.results.valuesFromStart[0]) {
                if (extendedSchemaName.indexOf(schemaName) === 0 && extendedSchemaName[schemaName.length] === '/') {
                    extendedSchemaNames.push(extendedSchemaName);
                }
            }
        }
        return extendedSchemaNames;
    }

    protected _getCounterPos(counterName: string, lineIdentifier: string): number {
        const schema = this.bulkConfig.getSchemaFromStatLineIdentifier(lineIdentifier);
        if (schema == null) {
            throw new Error(`Schema not found for ${lineIdentifier}`);
        }
       return schema.findCounterPosByName(counterName);
    }

    protected _getCounterRange(stats: StatValues[], counterName: string, lineIdentifier: string, tolerance: number): Range[] {        
        const counterPos = this._getCounterPos(counterName, lineIdentifier);
        const ranges = []
        let countZeroValue = 0;
        //console.log("Num entries", stats.length);
        //console.log(`counter ${counterName}@${lineIdentifier} is at pos ${counterPos}`);
        for(let i = 0; i < stats.length; i++) {
            const value = Number(stats[i][lineIdentifier][counterPos]);
            if (value == null) {
                throw new Error(`${counterName}@${lineIdentifier} not found.`)
            }
            if (value === 0) {
                countZeroValue++;
            }
            //console.log("Val:", value);
            const diff = (value * tolerance) / 100;
            ranges.push({
                min: value - diff,
                max: value + diff
            });
        }
        if (countZeroValue === stats.length) {
           throw new Error(`Value constant for ${counterName}@${lineIdentifier} during interval`);
        }
        return ranges
    }

    protected _isValueOutOfRange(val: number, range: Range): boolean {
        return (val < range.min) || (val > range.max)
    }

    protected _valueInSameRange(stats: StatValues[], lineIdentifier: BulkLineIdentifier, counterPos: number, ranges: Range[]): boolean {
        let i = 0;
        for(; i < stats.length; i++) {
            const val = Number(stats[i][lineIdentifier][counterPos]);
            if (isNaN(val)) {
                return false;
            }
            if (this._isValueOutOfRange(val, ranges[i])) {
                return false;
            }
        }
        return true;
    }

    /*
        LineX:
           stat1: counter1@lineX  counter2@lineX counter3@lineX ... countern@lineX
           stat2: counter1@lineX  counter2@lineX counter3@lineX ... countern@lineX

        Parse vertically to find counters which move up and down similar to target counterName@Line
        Do it for ever line
    */
    protected _findMatchWithStatName(stats: StatValues[], counterName: string, lineIdentifier: string, tolerance: number): CounterNames {
        const result: CounterNames = {};
        const ranges = this._getCounterRange(stats, counterName, lineIdentifier, tolerance);
        for(const currentLineIdentifier in stats[0]) {
            for(let counterIndex = 0; counterIndex < stats[0][currentLineIdentifier].length; counterIndex++) {
                if (this._valueInSameRange(stats, currentLineIdentifier, counterIndex, ranges)) {
                    if (result[currentLineIdentifier] == null) {
                        result[currentLineIdentifier] = [];
                    }
                    const currentSchema = this.bulkConfig.getSchemaFromStatLineIdentifier(currentLineIdentifier);
                    if (currentSchema == null) {
                        //console.log(`Unknown schema - ${currentLineIdentifier}`);
                        result[currentLineIdentifier].push(`unknow pos: ${counterIndex}`);
                    }
                    else {
                        result[currentLineIdentifier].push(currentSchema.getCounterNameAtPos(counterIndex));
                    }
                }
            }
        }
        return result;
    }

    findMatch(counterName: string, tolerance = 1): Record<BulkLineIdentifier, CounterNames> {
        if (counterName == null) {
            console.log("Missing key.");
            return;
        }
        const lineIdentifiers = this.getStatLineIdentifiers(counterName);
        const result: Record<BulkLineIdentifier, CounterNames> = {};
        if (lineIdentifiers.length === 0) {
           console.log(`Unknown stat ${counterName}`);
        }
        let count = 0;
        for(const lineIdentifier of lineIdentifiers) {
            count++;
            //console.log(`Looking for ${counterName} @ ${lineIdentifier} - ${count}/${lineIdentifier.length}`);
            try {
                result[lineIdentifier] = this._findMatchWithStatName( this.results.valuesFromStart, counterName, lineIdentifier, tolerance); 
            } catch(e) {
                console.log(e.message);
            }
        }
        // console.log("Result computed.", JSON.stringify(result, null, ' '))
        return result;
    }

    checkDeviation = (tolerance: number): void => {
        console.log("checkDeviation");
        const deviatingStats = this.findDeviatingStats(tolerance);
        
        let timeStampBasedData: Record<number, DeviationInfo[]> = {};
        const orderedData: TimedDeviationInfo[] = [];
        const deviationPercentOrderedData: DeviationInfo[] = [];
        const timeStamps = [];
        for(let deviatingStat of deviatingStats) {
            //console.log(`${deviatingStat.groupID} ${deviatingStat.statName} ${deviatingStat.median}`);
            for(let i = 0; i < deviatingStat.pos.length; i++) {
                //console.log(deviatingStat.rawStats[deviatingStat.pos[i]], deviatingStat.rawStats[deviatingStat.pos[i]+1]);
                const timestamp = deviatingStat.timestamps[deviatingStat.pos[i]];
                //console.log("timestamp", deviatingStat.timestamps, deviatingStat.pos[i], timestamp);
                if (timeStampBasedData[timestamp] == null) {
                    timeStampBasedData[timestamp] = [];
                    timeStamps.push(timestamp);
                    orderedData.push({timestamp, lines: timeStampBasedData[timestamp]});
                }
                const element1 = Number(deviatingStat.rawStats[deviatingStat.pos[i]]);
                const element2 = Number(deviatingStat.rawStats[deviatingStat.pos[i]+1]);
                let deviationPercent: number;
                if (isNaN(element2) || isNaN(element1)) {
                    //deviationPercent = (100 * (element2 - element1)) / element1
                    console.log("Unexpected counter value", deviatingStat.rawStats[deviatingStat.pos[i]], deviatingStat.rawStats[deviatingStat.pos[i]+1])
                }
                else {
                    deviationPercent = (100 * (element1 - element2)) / element1
                }
                if (timestamp == null) {
                    continue;
                }
                const info: DeviationInfo = {
                    timestamp,
                    text: `${timestamp}: ${deviatingStat.counterName}@${deviatingStat.bsLineIdentifier} ${deviatingStat.median}: ${element1} <> ${element2} (${Math.round(deviationPercent)}%) ${JSON.stringify(deviatingStat.rawStats)}`,
                    deviationPercent
                }
                //console.log("timestamp",  timestamp, info);
                deviationPercentOrderedData.push(info);
                timeStampBasedData[timestamp].push(info);
            }
            //console.log(deviatingStat.pos, deviatingStat.rawStats);
        }
        
        timeStamps.sort();
        //const timeStampInterval = timeStamps[1] - timeStamps[0];
        orderedData.sort((a,b) => (b.lines.length - a.lines.length));
        deviationPercentOrderedData.sort((a,b) => (b.deviationPercent - a.deviationPercent));
        console.log("================= Time Based Sort ====================");
        for(let info of orderedData) {
            info.lines.sort((a,b) => (b.deviationPercent - a.deviationPercent));
            console.log(info.timestamp);
            for(let line of info.lines) {
                console.log(line.text);
            }
        }
        console.log("================= Percentage Deviation Sort ====================");
        for(let info of deviationPercentOrderedData) {
            console.log(`${info.timestamp}: ${info.text}`);
        }    
    }
}
