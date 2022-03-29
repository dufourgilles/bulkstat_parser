import { BulkstatElement } from "./BulkstatElement";
import { BulkstatGroup } from "./BulkstatGroup";

export class BulkstatCollection {
    protected _data: Record<string, BulkstatGroup> = {}


    addValue(datacenter: string, vnfAlias: string, label: string, statName: string, timestamp: number, value: number): void {
        const groupID = BulkstatGroup.getGroupIdentifier(datacenter, vnfAlias, label);
        /** @type {BulkstatGroup} */
        let group = this._data[groupID];
        if (group == null) {
            group = new BulkstatGroup(datacenter, vnfAlias, label);
            this._data[groupID] = group;
        }
        group.addValue(statName, timestamp, value);
    }

    getGroupIdentifiers(): string[] {
        return Object.keys(this._data);
    }

    getGroup(groupID: string): BulkstatGroup {
        return this._data[groupID];
    }

    getGroupStatNames(groupID: string): string[] {
        const group = this.getGroup(groupID);
        return group.getStatNames();
    }

    getStatElement(groupID: string, statName: string): BulkstatElement {
        const group = this.getGroup(groupID);
        return group.getStatElement(statName);
    }
}