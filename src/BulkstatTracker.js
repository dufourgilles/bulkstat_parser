const BulkstatConfig = require("./BulkstatConfig");

module.exports = class BulkstatTracker {
    /**
     * 
     * @param {Bulkstas[]} bulkstats 
     * @param {BulkstatConfig} bulkConfig
     */
    constructor(bulkstats, bulkConfig) {
        this._bulkstats = bulkstats;
        this._bulkstatConfig = bulkConfig;
        this._results = {
            fromStart: [],
            fromPrev: [],
            fromStartPercent: [],
            fromPrevPercent: []
        };
    }

    _computeDiff(start, end) {
        return end - start;
    }

    _computePercentDiff(start, end) {
        return (100 * (end - start)) / start;
    }

    _compare(firstBulk, nextBulk, func = this._computeDiff) {
        const result = {};
        for(let statName in firstBulk) {
            const statInit = firstBulk[statName].getData();
            const statEnd = nextBulk[statName].getData();
            result[statName] = [];
            for(let i = 0; i < statInit.length; i++) {
                if (statInit[i] == '') {
                    result[statName].push('');
                    continue;
                }
                const numStatInit = Number(statInit[i]);
                const numStatEnd = Number(statEnd[i]);
                if (isNaN(numStatInit) || isNaN(numStatEnd)) {
                    result[statName].push(statInit[i]);
                    continue;
                }
                result[statName].push(func(numStatInit, numStatEnd));
            }
        }
        return result;
    }

    _comparePercent(firstBulk, nextBulk) {
        return this._compare(firstBulk, nextBulk, this._computePercentDiff);
    }

    _compareFromStart(index) {
        this._results.fromStart.push(this._compare(this._bulkstats[0], this._bulkstats[index]));
    }

    _compareFromPrev(index) {
        this._results.fromPrev.push(this._compare(this._bulkstats[index - 1], this._bulkstats[index]));
    }

    _compareFromStartPercent(index) {
        this._results.fromStartPercent.push(this._comparePercent(this._bulkstats[0], this._bulkstats[index]));
    }

    _compareFromPrevPercent(index) {
        this._results.fromPrevPercent.push(this._comparePercent(this._bulkstats[index - 1], this._bulkstats[index]));
    }

    parse() {
        for(let bulkstatIndex = 1; bulkstatIndex < this._bulkstats.length; bulkstatIndex++) {
            this._compareFromStart(bulkstatIndex);
            this._compareFromPrev(bulkstatIndex);
            this._compareFromStartPercent(bulkstatIndex);
            this._compareFromPrevPercent(bulkstatIndex);
        }
    }

    _getMatchingExtendedSchemaNames(statName) {
        const schemaNames = this._bulkstatConfig.findSchemaNameWithStatName(statName);
        const extendedSchemaNames = [];
        for(let schemaName of schemaNames) {
            for(let extendedSchemaName in this._results.fromStart[0]) {
                if (extendedSchemaName.indexOf(schemaName) === 0) {
                    extendedSchemaNames.push(extendedSchemaName);
                }
            }
        }
        return extendedSchemaNames;
    }

    _findMatchWithStatName(stats, statName, extendedSchemaName, tolerance) {
        const result = {};
        const schema = this._bulkstatConfig.getSchemaFromExtendedSchemaName(extendedSchemaName);
        const statPos = schema.findCounterByName([statName]);
        const min = [];
        const max = [];
        let countZeroValue = 0;
        for(let i = 0; i < stats.length; i++) {
            const value = stats[i][extendedSchemaName][statPos];
            if (value == null) {
                throw new Error(`${statName} not found.`)
            }
            if (value === 0) {
                countZeroValue++;
            }
            const diff = (value * tolerance) / 100;
            min.push(value - diff);
            max.push(value + diff);
        }
        if (countZeroValue === stats.length) {
            return result;
        }
        //For all extended schema
        for(let currentExtendedSchemaName in stats[0]) {
            // for all counters inside an extended schema
            for(let counterIndex = 0; counterIndex < stats[0][currentExtendedSchemaName].length; counterIndex++) {
                // check all values
                let i = 0;
                for(; i < stats.length; i++) {
                    const val = Number(stats[i][currentExtendedSchemaName][counterIndex]);
                    if (isNaN(val)) {
                        // not match
                        break;
                    }
                    if ((val < min[i]) || (val > max[i])) {
                        break;
                    }
                }
                if (i >= stats.length) {
                    if (result[currentExtendedSchemaName] == null) {
                        result[currentExtendedSchemaName] = [];
                    }
                    const currentSchema = this._bulkstatConfig.getSchemaFromExtendedSchemaName(currentExtendedSchemaName);
                    if (currentSchema == null) {
                        //console.log(`Unknown schema - ${currentExtendedSchemaName}`);
                        this._bulkstatConfig.getSchemaFromExtendedSchemaName(currentExtendedSchemaName);
                        result[currentExtendedSchemaName].push(counterIndex);
                    }
                    else {
                        result[currentExtendedSchemaName].push(currentSchema.getCounterAtPos(counterIndex));
                    }
                }
            }
        }
        return result;
    }
    findMatch(statName, tolerance = 1) {
        const extendedSchemaNames = this._getMatchingExtendedSchemaNames(statName);
        const result = {};
        if (extendedSchemaNames.length === 0) {
            throw new Error(`Unknown stat ${statName}`);
        }
        let count = 0;
        for(let extendedSchemaName of extendedSchemaNames) {
            count++;
            console.log(`Looking for ${statName} in ${extendedSchemaName} - ${count}/${extendedSchemaNames.length}`);
            result[extendedSchemaName] = this._findMatchWithStatName( this._results.fromStart, statName, extendedSchemaName, tolerance); 
        }
        console.log("Result computed.")
        return result;
    }
}