
//EMS,Card2,20200525,070000,4,7.65,30.05,8.86,30.17,0,0.00,0.00,0,0.00,0.00,0,0.00,0.00,0,0.00,0.00,0,0.00,0.00,0.00,0.00,0,0.00,0.00,34,34,34,49.57,130.74,50.33,131.73,50.78,141.70,51.54,142.61,50.83,141.90,51.58,142.86,4,7.61,21.80,8.03,21.91,0,0.00,0.00,0.00,0.00,1,6.86,8.07,6.86,8.07,1,14.13,15.74,14.13,15.74,0,0.00,0.00,0.00,0.00
//      card schema Card2 format EMS,Card2,%date%,%time%,%card%,%task-sessmgr-avgcpu%,%task-sessmgr-avgmem%,%task-sessmgr-maxcpu%,%task-sessmgr-maxmem%,%task-a11mgr-num%,%task-a11mgr-maxcpu%,%task-a11mgr-maxmem%,%task-l2tpmgr-num%,%task-l2tpmgr-maxcpu%,%task-l2tpmgr-maxmem%,%task-famgr-num%,%task-famgr-maxcpu%,%task-famgr-maxmem%,%task-hamgr-num%,%task-hamgr-maxcpu%,%task-hamgr-maxmem%,%task-acsmgr-num%,%task-acsmgr-avgcpu%,%task-acsmgr-avgmem%,%task-acsmgr-maxcpu%,%task-acsmgr-maxmem%,%task-vpnmgr-num%,%task-vpnmgr-maxcpu%,%task-vpnmgr-maxmem%,%npuutil-now%,%npuutil-5minave%,%npuutil-15minave%,%npuutil-rxpkts-5secave%,%npuutil-rxbytes-5secave%,%npuutil-txpkts-5secave%,%npuutil-txbytes-5secave%,%npuutil-rxpkts-5minave%,%npuutil-rxbytes-5minave%,%npuutil-txpkts-5minave%,%npuutil-txbytes-5minave%,%npuutil-rxpkts-15minave%,%npuutil-rxbytes-15minave%,%npuutil-txpkts-15minave%,%npuutil-txbytes-15minave%,%task-mmemgr-num%,%task-mmemgr-avgcpu%,%task-mmemgr-avgmem%,%task-mmemgr-maxcpu%,%task-mmemgr-maxmem%,%task-imsimgr-num%,%task-imsimgr-avgcpu%,%task-imsimgr-avgmem%,%task-imsimgr-maxcpu%,%task-imsimgr-maxmem%,%task-linkmgr-num%,%task-linkmgr-avgcpu%,%task-linkmgr-avgmem%,%task-linkmgr-maxcpu%,%task-linkmgr-maxmem%,%task-gbmgr-num%,%task-gbmgr-avgcpu%,%task-gbmgr-avgmem%,%task-gbmgr-maxcpu%,%task-gbmgr-maxmem%,%task-mmgr-num%,%task-mmgr-avgcpu%,%task-mmgr-avgmem%,%task-mmgr-maxmem%,%task-mmgr-maxcpu%

import { BulkstatSchema } from "./BulkstatSchema";

export type BulkLineIdentifier = string;

//  port schema port format EMS,Port,%date%,%time%,%card%,%port%,%rxbytes%,%txbytes%,%ucast_inpackets%,%ucast_outpackets%,%mcast_inpackets%,%mcast_outpackets%,%bcast_inpackets%,%bcast_outpackets%,%rxpackets%,%txpackets%,%rxdiscbytes%,%rxdiscpackets%,%txdiscbytes%,%txdiscpackets%,%maxrate%,%frag-rcvd%,%pkt-reassembled%,%frag-tokernel%,%util-rx-curr%,%util-tx-curr%,%util-rx-5min%,%util-tx-5min%,%util-rx-15min%,%util-tx-15min%,%port-5peak-rx-util%,%port-5peak-tx-util%,%port-15peak-rx-util%,%port-15peak-tx-util%,%rxerrorbytes%,%rxerrorpackets%,%txerrorbytes%,%txerrorpackets%
export class BulkstatLine {
    protected _schema: BulkstatSchema | null = null;
    protected _name: string | null = null;

    protected constructor(readonly rawData: Array<number|string>, readonly lineNumber: number) { }

    get data(): Array<number|string> {
        return this.rawData;
    }

    setSchema(bulkstatSchema: BulkstatSchema): void {
        this._schema = bulkstatSchema;
    }

    getSchema(): BulkstatSchema {
        return this._schema;
    }

    getSchemaName(): string | undefined {
        if (this.rawData && this.rawData.length > 2) {
            return  this.rawData[0] === 'EMS' ? `${this.rawData[1]}` : `${this.rawData[2]}`;
        }
    }

    protected _getCardStatName(cardPos: number): string {
        const portPos = this._schema.findCounterPosByName("%port%");
        this._name = `${this.getSchemaName()}/Card-${this.rawData[cardPos]}${portPos >= 0 ? "/Port-" + this.rawData[portPos] : ""}}`;
        return this._name;
    }

    getBulkLineIdentifier(): BulkLineIdentifier {
        if (this._name != null) {
            return this._name;
        }
        if (this._schema == null) {
            throw new Error("No schema available.");
        }
        const cardPos = this._schema.findCounterPosByName("%card%");
        if (cardPos >= 0 ) { 
            const portPos = this._schema.findCounterPosByName("%port%");
            this._name = `${this.getSchemaName()}/Card-${this.rawData[cardPos]}${portPos >= 0 ? "/Port-" + this.rawData[portPos] : ""}`;
            return this._name;
        }
        //%mcc%,%mnc%,%lac%,%rac%
        const lacPos = this._schema.findCounterPosByName("%lac%");
        const vpnNamePos = this._schema.findCounterPosByName("%vpnname%", "%vpn-name%");
        const servnamePos = this._schema.findCounterPosByName("%servname%", "%service-name%");
        if (lacPos >= 0) {
            const racPos = this._schema.findCounterPosByName("%rac%");
            const mncPos = this._schema.findCounterPosByName("%mnc%");
            const mccPos = this._schema.findCounterPosByName("%mcc%");
            this._name = `${this.getSchemaName()}` +
                `${vpnNamePos >= 0 ? "/VPN-" + this.rawData[vpnNamePos] : ""}` +
                `${servnamePos >= 0? "/SERVICE-" + this.rawData[servnamePos] : ""}`+
                `/LAC` +
                `${mncPos >= 0 ? "-" + this.rawData[mncPos] : ""}` +
                `${mccPos >= 0 ? "-" + this.rawData[mccPos] : ""}`+
                `-${this.rawData[lacPos]}`+
                `${racPos >= 0 ? "-" + this.rawData[racPos] : ""}`;
            return this._name;
        }
        //%iups-service%,%rnc-address%
        const rncPos = this._schema.findCounterPosByName("%rnc-address%");
        const iupsPos = this._schema.findCounterPosByName("%iups-service%");
        if (iupsPos >= 0 || rncPos >= 0) {
            this._name = `${this.getSchemaName()}` +
                `${vpnNamePos >= 0 ? "/VPN-" + this.rawData[vpnNamePos] : ""}` +
                `${servnamePos >= 0 ? "/SERVICE-" + this.rawData[servnamePos] : ""}`+
                `${iupsPos >= 0 ? "/IUPS-" + this.rawData[iupsPos] : ""}` +
                `${rncPos >= 0 ? "/RNC-" + this.rawData[rncPos] : ""}`;
            return this._name;
        }
        // %nse-id%
        const nsePos = this._schema.findCounterPosByName("%nse-id%");
        if (nsePos >= 0) {
            this._name = `${this.getSchemaName()}` +
                `${vpnNamePos >= 0 ? "/VPN-" + this.rawData[vpnNamePos] : ""}` +
                `${servnamePos >= 0 ? "/SERVICE-" + this.rawData[servnamePos] : ""}`+
                `/NSE-${this.rawData[nsePos]}`;
            return this._name;
        }
        //%tai-mnc%,%tai-mcc%
        const tacPos = this._schema.findCounterPosByName("%tai-tac%");
        if (tacPos >= 0 ) {
            const mncPos = this._schema.findCounterPosByName("%tai-mnc%");
            const mccPos = this._schema.findCounterPosByName("%tai-mcc%");
            this._name = `${this.getSchemaName()}/TAI` +
                `${mncPos >= 0 ? "-" + this.rawData[mncPos] : ""}` +
                `${mccPos >= 0 ? "-" + this.rawData[mccPos] : ""}`+
                `${"-" + this.rawData[tacPos]}`;
            return this._name;
        }
        
        //%src-card%,%dest-card%
        const srcCard = this._schema.findCounterPosByName("%src-card%");
        if (srcCard >= 0) {
            const dstCard = this._schema.findCounterPosByName("%dest-card%");
            this._name = `${this.getSchemaName()}/${this.rawData[srcCard]}/${this.rawData[dstCard]}}`;
            return this._name;
        }

        //%mode%,%tagid%
        const tagid = this._schema.findCounterPosByName("%tagid%");
        if (tagid >= 0) {
            const mode = this._schema.findCounterPosByName("%mode%");
            this._name = `${this.getSchemaName()}/${this.rawData[tagid]}/${this.rawData[mode]}}`;
            return this._name;
        }

        const vlrPos = this._schema.findCounterPosByName("%vlrname%");
        if (vlrPos >= 0) {
            this._name = `${this.getSchemaName()}/VLR-${this.rawData[vlrPos]}`;
            return this._name;
        }

        const rdPos = this._schema.findCounterPosByName('%ss7rd-number%');
        if (rdPos >= 0) {
            const aspPos = this._schema.findCounterPosByName('%ss7rd-asp_instance%');
            const pspPos = this._schema.findCounterPosByName('%ss7rd-m3ua-psp-ps-id%');
            const instPos = this._schema.findCounterPosByName('%ss7rd-m3ua-psp-instance%');
            const adjPos = this._schema.findCounterPosByName('%ss7-adjacent-point-code%');
            this._name = `${this.getSchemaName()}/SS7-${this.rawData[rdPos]}-ASP${this.rawData[aspPos]}-PSP${this.rawData[pspPos]}-${this.rawData[instPos]}-${this.rawData[adjPos]}`;
            return this._name;
        }

        const namePos = this._schema.findCounterPosByName("%name%");
        if (namePos >= 0) {
            this._name = `${this.getSchemaName()}` +
                `${vpnNamePos >= 0 ? "/VPN-" + this.rawData[vpnNamePos] : ""}` +
                `/NAME-${this.rawData[namePos]}`;
            return this._name;
        }

        const ipaddrPos = this._schema.findCounterPosByName('%ipaddr%');
        if (ipaddrPos >= 0) {
            const portPos = this._schema.findCounterPosByName("%port%");
            this._name = `${this.getSchemaName()}` + 
                `${vpnNamePos >= 0? "/VPN-" + this.rawData[vpnNamePos] : ""}` +
                `IP-${this.rawData[ipaddrPos]}:` +
                `${portPos < 0 ? 0 : this.rawData[portPos]}`;
            return this._name;
        }

        const apnPos = this._schema.findCounterPosByName('%apn%');
        if (apnPos >= 0) {
            this._name = `${this.getSchemaName()}` + 
                `${vpnNamePos >= 0? "/VPN-" + this.rawData[vpnNamePos] : ""}` +
                `APN-${this.rawData[apnPos]}`;
            return this._name;
        }

        const p2pProtoPos = this._schema.findCounterPosByName('%p2p-protocol%');
        if (p2pProtoPos >= 0) {
            this._name = `${this.getSchemaName()}` +                 
                `P2P-${this.rawData[p2pProtoPos]}`;
            return this._name;
        }

        const p2pDurationProtoPos = this._schema.findCounterPosByName('%p2p-duration-name%');
        if (p2pDurationProtoPos >= 0) {
            this._name = `${this.getSchemaName()}` +                 
                `P2P-DUR-${this.rawData[p2pDurationProtoPos]}`;
            return this._name;
        }

        const ccGroup = this._schema.findCounterPosByName('%cc-group%');
        if (ccGroup >= 0) {
            this._name = `${this.getSchemaName()}` +                 
                `ECS_CC_GROUP-${this.rawData[ccGroup]}`;
            return this._name;
        }

        const endPointName = this._schema.findCounterPosByName('%endpoint-name%');
        if (endPointName >= 0) {
            this._name = `${this.getSchemaName()}` +                 
                `DIAM_ENDP-${this.rawData[endPointName]}`;
            return this._name;
        }

        const diamApp = this._schema.findCounterPosByName('%diameter-tps-application-name%');
        if (diamApp >= 0) {
            this._name = `${this.getSchemaName()}` +                 
                `DIAM_APP-${this.rawData[diamApp]}`;
            return this._name;
        }

        if (vpnNamePos >= 0 || servnamePos >= 0) {
            this._name = `${this.getSchemaName()}` + 
                `${vpnNamePos >= 0? "/VPN-" + this.rawData[vpnNamePos] : ""}` +
                `${servnamePos >= 0? "/SERVICE-" + this.rawData[servnamePos] : ""}`;
            return this._name;
        }
        return this.getSchemaName();
        
    }

    static createFromString(txt: string, lineNumber: number): BulkstatLine {
        return new BulkstatLine(txt.trim().split(","), lineNumber);
    }
}