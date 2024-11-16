import npm from "npm-stats-api";
import fs from "fs";
import { color } from "./tools/color.js";

const main = () => {
    const [, , packageName, start, end, outputOrUpdateFile] = process.argv;
    let dates = [];
    try {
        dates = getDateInterval(start, end)
    } catch {
        return
    }

    fetchNpmPkgDownloadDataOfIntervalToCsv(dates, packageName, outputOrUpdateFile)
};

const getDateInterval = (startDate, endDate) => {
    const dates = [];
    let current = new Date();
    let end = new Date();

    try {
        current = new Date(startDate);
        end = new Date(endDate)
    } catch {
        console.error("ERROR: start and end dates must be in format YYYY-MM-DD.")
    }

    if (current > end) {
        [current, end] = [end, current]
    }

    const daysToWait = 5;
    const waitTime = new Date();
    waitTime.setDate(waitTime.getDate() - daysToWait);

    if (end > waitTime) {
        end = waitTime;
        color.log("default", `--> End date changed to ${daysToWait} days ago `);
        console.log("to avoid data loss!\n");
    }

    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1)
    }

    return dates
};

const fetchNpmPkgDownloadDataOfIntervalToCsv = async (dates, packageName, outputOrUpdateFile) => {
    let existingCsvData = [];

    if (fs.existsSync(outputOrUpdateFile)) {
        const existingCsvContent = fs.readFileSync(outputOrUpdateFile, 'utf8');
        existingCsvData = parseCsv(existingCsvContent)
    }

    const reDownloadPeriod = getDatesForLastNDays(30).map(date => getYMDFromDate(date));

    existingCsvData = existingCsvData.filter((row) => {
        const rowDate = row.date;
        return !reDownloadPeriod.includes(rowDate)
    });

    for (const d of dates) {
        const date = getYMDFromDate(d);
        if (!existingCsvData.some((row) => row.date === date)) {
            try {
                const packageDataOfADay = await npmStats(packageName, date, date);
                existingCsvData.push({
                    date: date,
                    downloads: packageDataOfADay.body.downloads
                });
                color.log("dim", "Downloads in ");
                color.log("default", date);
                color.log("dim", ": ");
                color.log("brightYellow",
                    `${formatNumber(packageDataOfADay.body.downloads, true)}\n`);
            } catch (error) {
                console.error(error)
            }
        }
    }

    existingCsvData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalDownloads = existingCsvData.reduce(((total, e) =>
        total + parseInt(e.downloads)), 0);

    color.log("default", "\nPackage ");
    color.log("brightCyan", `${packageName}\n`);
    color.log("default", "\tTotal Downloads: ");
    color.log("brightGreen", `\t${formatNumber(totalDownloads, true)}\n`);
    color.log("dim", "\t(from ");
    color.log("cyan", getYMDFromDate(dates.at(0)));
    color.log("dim", " to ");
    color.log("cyan", getYMDFromDate(dates.at(-1)));
    color.log("dim", ")\n");

    const csvContent = `date, downloads\n${existingCsvData
        .map((row) => `${row.date}, ${row.downloads}`)
        .join('\n')}`;
    fs.writeFileSync(outputOrUpdateFile, csvContent)
};

const getDatesForLastNDays = (n) => {
    const dates = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        dates.push(day)
    }
    return dates
};

const getYMDFromDate = (date) => {
    return date.toISOString().substring(0, 10)
};

const parseCsv = (csvContent) => {
    const lines = csvContent.trim().split('\n');
    const headers = lines.shift().split(',');

    return lines.map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index].trim();
            return obj
        }, {});
    });
};

const npmStats = async (packageName, start, end) => {
    return await npm.stat(packageName, start, end)
};

function formatNumber(number, useComma = false) {
    const locale = useComma ? 'en-US' : 'de-DE'; // 'en-US' for commas, 'de-DE' for dots
    return new Intl.NumberFormat(locale).format(number);
}

main()
