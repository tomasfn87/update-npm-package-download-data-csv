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
    const current = new Date(startDate);
    let end = new Date(endDate);

    if (current > end) {
        console.error("ERROR: start date must be before or equal to end date.")
    }
    
    const today = new Date();
    const aDayBeforeYesterday = today;
    aDayBeforeYesterday.setDate(today.getDate() - 2);

    if (getYMDFromDate(end) >= getYMDFromDate(aDayBeforeYesterday)) {
        end = aDayBeforeYesterday;
        console.log("--> End date changed to a day before yesterday to avoid data loss!\n")
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
        }, {})
    })
};

const npmStats = async (packageName, start, end) => {
    return await npm.stat(packageName, start, end)
};

main()