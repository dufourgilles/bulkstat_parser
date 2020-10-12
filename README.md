# Bulkstat Parser

A parser for Cisco StarOS Bulkstats.
The purpose is to identify potential relationship between counters.
This is done by comparing how counters increment over a certain amount of bulkstat period.
There is a tolerance to accept some deviation.
 
## Installation

```bash
npm install bulkstat-parser
```

## Usage

```bash
$ node src/index.js
Options:
      --version     Show version number                                [boolean]
  -k, --key         Counter key.                                      [required]
  -c, --configfile  StarOS Config file or SSD.                        [required]
  -b, --bulks       Bulkstat files comma separated and time base ordered.
                                                                      [required]
  -t, --tolerance   Tolerance percentage for counter match.[number] [default: 1]
      --help        Show help                                          [boolean]

Missing required arguments: key, configfile, bulks
```

```bash
export NODE_OPTIONS="--max-old-space-size=8192"; \
node src/index.js -c /config.txt \
-b "bulkstat20200525100000.txt,bulkstat20200525101501.txt,bulkstat20200525104501.txt" \
-k "%tai-epsattach-attempted%"
========= TAIsch2/TAI-XX-XXX-41336 ============
%tai-ps-qci-1-paging-init-events-attempted%:      0000004521 0000004529 0000004536 0000004549
%tai-epsattach-attempted%:                        0000010756 0000010764 0000010771 0000010784
%SRNS-data-fwd-cmd-sent%:                         0000010676 0000010684 0000010691 0000010704
========= TAIsch2/TAI-XX-XXX-250-41337 ============
%tai-emm-msgtx-tau-network-fail%:                 0000005096 0000005102 0000005108 0000005113
%tai-emm-msgtx-service-reject%:                   0000007324 0000007330 0000007336 0000007341
%tai-intra-ta-la-update-failures%:                0000006705 0000006711 0000006717 0000006722
%tai-epsattach-attempted%:                        0000007923 0000007929 0000007935 0000007940
%2G-imsi-identity-response%:                      0000008346 0000008352 0000008358 0000008363
%2G-intra-rau-reject%:                            0000014757 0000014763 0000014769 0000014774
%2G-intra-rau-rej-implicitly-detach%:             0000014753 0000014759 0000014765 0000014770
%2G-gmm-status-rcvd%:                             0000004360 0000004366 0000004372 0000004377
%3G-nw-init-detach%:                              0000007719 0000007725 0000007731 0000007736
%3G-ms-init-detach-accept%:                       0000007712 0000007718 0000007724 0000007729
%3G-ms-deactv-reject%:                            0000006985 0000006991 0000006997 0000007002
========= TAIsch2/TAI-XX-XXX-41338 ============
%tai-epsattach-attempted%:                        0000012262 0000012270 0000012273 0000012280
%2G-ms-deactv-reject%:                            0000008425 0000008433 0000008436 0000008443
%inter-system-2G-to-3G-attach-accepts%:           0000008013 0000008021 0000008024 0000008031
%3G-ret-inter-sgsn-rau%:                          0000011309 0000011317 0000011320 0000011327
========= TAIsch2/TAI-XX-XXX-41339 ============
%tai-epsattach-attempted%:                        0000020297 0000020307 0000020320 0000020334
%3G-imeisv-identity-response%:
```
