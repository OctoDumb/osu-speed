var { clipboard, remote } = require('electron');
var { dialog, app } = remote;

$(document).ready(function() {

$('form').on('submit', (e) => stopEvent(e));

let ddd = new Date();

function fd(n) {
    if(n<10) return "0"+String(n);
    else return String(n);
}

$("#dayChartInput").val(`${ddd.getFullYear()}-${fd(ddd.getMonth())}-${fd(ddd.getDate())}`);

var fs = require('fs');

const dbDir = app.getPath('userData').split("\\").join("/");

if(!fs.existsSync(`${dbDir}/stats.json`)) fs.writeFileSync(`${dbDir}/stats.json`, "{}");

let BPMChart = new CanvasJS.Chart("bpmChart", {
    zoomEnabled: true,
    title: {
        text: "BPM"
    },
    axisY: {
        title: "BPM",
        includeZero: false
    },
    axisX: {},
    data: [
        {
            type: "spline",
            dataPoints: []
        }
    ]
}); // JavaScript

BPMChart.render();

let dayChart = new CanvasJS.Chart("dayChart", {
    zoomEnabled: true,
    axisY: {
        title: "data",
        includeZero: false
    },
    axisX: {
        title: "Time",
        valueFormatString: "HH:mm TT"
    }
});

let clicks = [];
let deviations = [];
let timeDiff = [];

let isTestRunning = false;
let clickLimit;
let key1 = 90;
let key2 = 88;

let updater, std, isMouse, variance, ur, beginTime = -1;

let runNumber = 0;
let counterNumber = 0;

let stats = JSON.parse(fs.readFileSync(`${dbDir}/stats.json`).toString());

$("#start").click(function() {
    console.log("Start button clicked");
    console.log($("#clicksCount").val());
    if(parseInt($("#clicksCount").val()) < 5) {
        alert("Enter a value larger than 5");
        return false;
    }
    if(!isTestRunning) {
        $("#status").html('The test is ready! Press any of the keys to start!');
        init();
    } else {
        stop(false);
    }
});

function init() {
    console.log("Started the test");
    isTestRunning = true;
    clicks = [];
    deviations = [];
    timeDiff = [];
    counterNumber = 0;
    ur = 0;
    beginTime = -1;
    std = 0;
    isMouse = $("#mButtons").is(':checked');
    $("#clicks").text("0 clicks");
    $("#seconds").text("0 seconds");
    $("#sSpeed").text("0 BPM");
    $("#ur").text("n/a");
    console.log(BPMChart.options.data);
    if(runNumber > 0) {
        console.log('a');
        BPMChart.options.data.push({
            type: "spline",
            dataPoints: []
        });
        BPMChart.options.data[runNumber-1].visible = false;
    }
    BPMChart.render();
    counterNumber = 0;
    clickLimit = Number($("#clicksCount").val());
    return true;
}

function dateNow() {
    let d = new Date();
    return `${fd(d.getDate())}.${fd(d.getMonth())}.${d.getFullYear()} ${fd(d.getHours())}:${fd(d.getMinutes())}`;
}

function stop(save) {
    console.log("Stopped the test");
    isTestRunning = false;
    upd(false);
    beginTime = -1;

    if(clicks.length == 0) {
        $("#clicks").text("0 clicks");
        $("#seconds").text("0 seconds");
        $("#sSpeed").text("0 BPM");
        $("#ur").text("n/a");
    }
    runNumber++;
    console.log(updater);
    window.clearInterval(updater);
    if(save) {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td class="totalClicks">${document.getElementById("clicks").innerText.split(" ")[0]}</td>
        <td class="Date">${dateNow()}</td>
        <td class="totalTime">${document.getElementById("seconds").innerText.split(" ")[0]}</td>
        <td class="totalBPM">${document.getElementById("sSpeed").innerText.split(" ")[0]}</td>
        <td class="totalUR">${ur.toFixed(3)}</td>`;
        document.getElementById("currentSession").appendChild(tr);
        let dd = new Date();
        if(!stats[dd.getFullYear()]) stats[dd.getFullYear()] = {};
        if(!stats[dd.getFullYear()][dd.getMonth()]) stats[dd.getFullYear()][dd.getMonth()] = {};
        if(!stats[dd.getFullYear()][dd.getMonth()][dd.getDate()]) stats[dd.getFullYear()][dd.getMonth()][dd.getDate()] = [];
        let d = Date.now();
        let res = {
            clicks: clickLimit,
            bpm: Number(document.getElementById("sSpeed").innerText.split(" ")[0]),
            date: d,
            time: document.getElementById("seconds").innerText.split(" ")[0],
            ur: Number(ur.toFixed(3))
        };
        stats[dd.getFullYear()][dd.getMonth()][dd.getDate()].push(res);
        fs.writeFileSync(`${dbDir}/stats.json`, JSON.stringify(stats));
        if($("dayChartInput").val() == `${ddd.getFullYear()}-${fd(ddd.getMonth())}-${fd(ddd.getDate())}`) {
            console.log('Yeee');
            dayChart.options.data[0].dataPoints.push({x: new Date(d), y: Number(document.getElementById("sSpeed").innerText.split(" ")[0])});
            dayChart.options.data[1].dataPoints.push({x: new Date(d), y: Number(ur.toFixed(3))});
        }
    }

    return true;
}

function stopEvent(e) {
    if(e.preventDefault != undefined) e.preventDefault();
    if(e.stopPropagation != undefined) e.stopPropagation();
}

$(".linkCopy").click(function () {
    console.log(this);
    let link = $(this).attr('link');
    if(!link) return M.toast({html: '<i class="fas fa-exclamation-circle"></i> Link is not defined'});
    clipboard.writeText(link);
    M.toast({html: '<i class="fas fa-pen"></i> Link copied to clipboard!'});
});

$(document).keyup(e => {
    console.log("Key pressed: ", e.keyCode);
    stopEvent(e);
    if($('#firstKey').is(':focus') || $('#secondKey').is(':focus')) {
        console.log("in input");
        let input = $('#firstKey').is(':focus') ? $('#firstKey') : $('#secondKey');
        if($('#firstKey').is(':focus')) {
            key1 = e.keyCode;
        } else key2 = e.keyCode;
        input.val(e.key);
    }
});

$(document).keypress(e => {
    stopEvent(e);
});

$(document).keyup(e => {
    stopEvent(e);
    if($('#firstKey').is(':focus') || $('#secondKey').is(':focus')) return;
    console.log(isTestRunning);
    if(isTestRunning) {
        console.log("while test");
        if(isMouse) return false;
        let k = e.keyCode;
        if(k == key1 || k == key2) {
            console.log("correct..");
            switch(beginTime) {
                case -1: {
                    beginTime = Date.now();
                    $("#status").html("Test running. Press ESC to stop");
                    updater = setInterval(function() {
                        upd(false);
                    }, 16.6);
                    break;
                }
                default: {
                    upd(true);
                    break;
                }
            }
            if(clicks.length == clickLimit) {
                stop(true);
                return;
            }
        }
    }
});

$(document).keyup(e => {
    if(e.keyCode == 27 && isTestRunning) {
        console.log("ESC!");
        stop(false);
    } else if(e.keyCode == 13) {
        console.log("Enter!");
        if(isTestRunning) stop(false);
        else init();
    }
    // if(e.keyCode == 13 && !isTestRunning) {
    //     console.log("Enter!");
    //     init();
    // }
});

$(document).mousedown(e => {
    if(isMouse) {
        document.oncontextmenu = (e) => {stopEvent(e);return false;};
        if(isTestRunning) {
            if(event.which == 1 || event.which == 3) {
                switch(beginTime) {
                    case -1: {
                        beginTime = Date.now();
                        $("#status").html("Test running. Press ESC to stop.");
                        updater = setInterval(function() {upd(false);}, 16.6);
                        break;
                    }
                    default: {
                        upd(true);
                        break;
                    }
                }
                if(clicks.length == clickLimit) {
                    stop(true);
                    return;
                }
            }
        }
    } else document.oncontextmenu = undefined;
});

function upd(click) {
    if(click) {
        if(timeDiff.length > 0) {
            let sum = timeDiff.reduce((a,b)=>{return a+b;});
            let avg = sum / timeDiff.length;
            $.each(timeDiff, (i, v) => {
                deviations[i] = (v-avg)*(v-avg);
            });
            variance = deviations.reduce((a,b)=>{return a+b;});
            std = Math.sqrt(variance / deviations.length);
            ur = std*10;
        }
        clicks.push(Date.now());
        if(clicks.length > 1) timeDiff.push(clicks[clicks.length - 1] - clicks[clicks.length - 2]);
        if(clicks.length > 2) {
            BPMChart.options.data[runNumber].dataPoints.push({
                x: (Date.now() - beginTime) / 1000,
                y: Math.round((((clicks.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100
            });
            BPMChart.render();
        }
    } else {
        counterNumber = (counterNumber + 1) % 30;
        let streamTime = (Date.now() - beginTime) / 1000;
        if(timeDiff.length < 2) {
            $("#clicks").text(clicks.length+' clicks');
            $("#seconds").text(streamTime.toFixed(3)+' seconds');
            $("#sSpeed").text((Math.round((((clicks.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100).toFixed(2)+' BPM');
        } else {
            $("#clicks").text(clicks.length+' clicks');
            $("#seconds").text(streamTime.toFixed(3)+' seconds');
            $("#sSpeed").text((Math.round((((clicks.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100).toFixed(2)+' BPM');
            $("#ur").text((Math.round(ur * 100000) / 100000).toFixed(3));
            if(counterNumber == 0) {
                BPMChart.options.data[runNumber].dataPoints.push({
                    x: (Date.now() - beginTime) / 1000,
                    y: Math.round((((clicks.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100
                });
                BPMChart.render();
            }
        }
    }
}

function formatDate(date) {
    let d = new Date(date);
    return `${fd(d.getDate())}.${fd(d.getMonth())}.${d.getFullYear()} ${fd(d.getHours())}:${fd(d.getMinutes())}`;
}

/**
 * 
 * @param {Number} year 
 * @param {Number} month 
 * @param {Number} day 
 */
function updateDay(y, m, d) {
    let exists = !stats[y] ? false : !stats[y][m] ? false : !stats[y][m][d] ? false : true;
    let data = exists ? stats[y][m][d] : false;
    let tableBody = "";
    if(!data) {
        dayChart.options.title = {text: `No stats for ${fd(d)}.${fd(m)}.${y}`};
        let bpmD = {
            name: "BPM",
            type: "spline",
            yValueFormatString: "# BPM",
            showInLegend: true,
            dataPoints: []
        };
        let urD = {
            name: "UR",
            type: "spline",
            showInLegend: true,
            dataPoints: []
        };
        dayChart.options.data = [bpmD, urD];
    } else {
        dayChart.options.title = {text: `Stats for ${fd(d)}.${fd(m)}.${y}`};
        let bpmD = {
            name: "BPM",
            type: "line",
            yValueFormatString: "# BPM",
            showInLegend: true,
            dataPoints: []
        };
        let urD = {
            name: "UR",
            type: "line",
            showInLegend: true,
            dataPoints: []
        };
        data.forEach(a => {
            tableBody+=`<tr>
                <td class="totalClicks">${a.clicks}</td>
                <td class="Date">${formatDate(a.date)}</td>
                <td class="totalTime">${a.time}s</td>
                <td class="totalBPM">${a.bpm}</td>
                <td class="totalUR">${a.ur}</td>
            </tr>`;
            bpmD.dataPoints.push({x: new Date(a.date), y: a.bpm});
            urD.dataPoints.push({x: new Date(a.date), y: a.ur});
        });
        dayChart.options.data = [bpmD, urD];
    }
    $("#dayTableBody").html(tableBody);
    dayChart.render();
}

updateDay(ddd.getFullYear(), ddd.getMonth(), ddd.getDate());

$("#dayChartInput").change(() => {
    console.log($("#dayChartInput").val());
    let val = $("#dayChartInput").val().split("-");
    if(!val[1]) {
        $("#dayChartInput").val(`${ddd.getFullYear()}-${fd(ddd.getMonth())}-${fd(ddd.getDate())}`);
        return updateDay(ddd.getFullYear(), ddd.getMonth(), ddd.getDate());
    }
    let y = Number(val[0]);
    let m = Number(val[1]);
    let d = Number(val[2]);
    updateDay(y,m,d);
});

$(".stats-tab").click(function () {
    if($(this).hasClass("active")) return;
    let val = $("#dayChartInput").val().split("-");
    let y = Number(val[0]);
    let m = Number(val[1]);
    let d = Number(val[2]);
    setTimeout(() => {updateDay(y,m,d);}, 100);
});

$(".import-stats").click(() => {
    dialog.showOpenDialog({
        title: "Import stats",
        buttonLabel: "Import",
        filters: [
            {
                name: "JSON-files",
                extensions: ["json"]
            }
        ],
        properties: ['openFile']
    }, (path) => {
        if(!path) return;
        let file = fs.readFileSync(path[0]).toString();
        try {
            let json = JSON.parse(file);
            if(file.startsWith("[")) throw Error("Found Array instead of Object");
            fs.writeFileSync(`${dbDir}/stats.json`, file);
            stats = json;
            let val = $("#dayChartInput").val().split("-");
            let y = Number(val[0]);
            let m = Number(val[1]);
            let d = Number(val[2]);
            updateDay(y,m,d);
            M.toast({html: '<i class="fas fa-check-square"></i> Successfully imported'});
        } catch(e) {
            M.toast({html: '<i class="fas fa-exclamation-circle"></i> Wrong file format'});
        }
    });
});

$(".export-stats").click(() => {
    dialog.showSaveDialog({
        title: "Export stats",
        defaultPath: "stats.json",
        buttonLabel: "Export",
        filters: [
            {
                name: "JSON-file",
                extensions: ["json"]
            }
        ]
    }, (path) => {
        if(!path) return;
        fs.writeFileSync(path, JSON.stringify(stats));
        M.toast({html: '<i class="fas fa-check-square"></i> Successfully exported'});
    });
});

});