
//  datacenter,vnf,namespace,vnf-alias,label,timestamp,period,statistic,value
//      seucs501-cnat,seucs501,smf-ims,sesmf000,System,1601632800000,1,4G_PDN_Session_Create_Attempted_Cummulative,6403

export interface StatEntry {
    timestamp: number;
    value: number;
}

export class BulkstatElement {
    protected _rawData: StatEntry[] = [];
    protected _values: number[] = [];
    protected _sorted: boolean = false;

    constructor(readonly  name: string) {}

    _sort() {
        if (!this._sorted) {
            this._rawData.sort(this._sortFunc);
            this._values = this._rawData.map((x) => x.value);
            this._sorted = true;
        }
    }

    _sortFunc(a: StatEntry, b: StatEntry): number {
        return a.timestamp - b.timestamp;
    }

    getData(): StatEntry[] {
        this._sort();
        return this._rawData;
    }

    getValues(): number[] {
        this._sort();
        return this._values;
    }

    addValue(timestamp: number, value: number): void {
        this._rawData.push({timestamp, value});
        this._sorted = false;
    }

}