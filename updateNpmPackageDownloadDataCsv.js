import npm from "npm-stats-api";
import fs from "fs";

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
        end = new Date(endDate);
    } catch {
        console.error("ERROR: start and end dates must be in format YYYY-MM-DD.")
    }

    if (current > end) {
        console.error("ERROR: start date must be before or equal to end date.")
    }

    const daysToWait = 5;
    const waitTime = new Date();
    waitTime.setDate(waitTime.getDate() - daysToWait);

    if (end > waitTime) {
        end = waitTime;
        console.log(`--> End date changed to ${daysToWait} days ago to avoid data loss!`)
    }

    while (current <= end) {
        dates.push(new Date(current))
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
                console.log(`Downloads for ${date}: ${packageDataOfADay.body.downloads}`)
            } catch (error) {
                console.error(error)
            }
        }
    }

    existingCsvData.sort((a, b) => new Date(a.date) - new Date(b.date));

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

    return lines.map((line) => {
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

main()
