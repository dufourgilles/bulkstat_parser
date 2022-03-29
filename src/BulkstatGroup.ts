import { BulkstatElement } from "./BulkstatElement";

export class BulkstatGroup {
    protected _data: Record<string, BulkstatElement> = {};
    constructor(readonly datacenter: string, readonly vnfAlias: string, readonly label: string) {}

    /**
     * 
     * @param {string} groupIdentifier
     * @param {string} statName
     * @param {number} timestamp 
     * @param {number} value
     */
    addValue(statName: string, timestamp: number, value: number): void {
        /** @type {BulkstatElement} */
        let element = this._data[statName];
        if (element == null) {
            element = new BulkstatElement(statName);
            this._data[statName] = element;
        }
        element.addValue(timestamp, value);        
    }

    getStatNames(): string[] {
        return Object.keys(this._data);
    }

    getStatElement(statName: string): BulkstatElement {
        return this._data[statName];
    }

    //  datacenter,vnf,namespace,vnf-alias,label,
    static getGroupIdentifier(datacenter: string, vnfAlias: string, label: string) {
        return `${datacenter}_${vnfAlias}_${label}`;
    }
}