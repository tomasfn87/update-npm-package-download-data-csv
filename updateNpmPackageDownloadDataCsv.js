import npm from "npm-stats-api";
import fs from "fs";

const [, , packageName, start, end, outputOrUpdateFile] = process.argv;

const npmStats = async (packageName, start, end) => {
    const res = await npm.stat(packageName, start, end);
    return res
};

function getDateInterval(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    let end = new Date(endDate);
    
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
}

const getYMDFromDate = (date) => {
    return date.toISOString().substring(0, 10)
};

const dates = getDateInterval(start, end);

async function processDates(dates, packageName, outputOrUpdateFile) {
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
                    downloads: packageDataOfADay.body.downloads,
                });
                console.log(`Downloads of ${date}: ${packageDataOfADay.body.downloads}`)
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
}

function parseCsv(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines.shift().split(',');

    return lines.map((line) => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index].trim();
            return obj;
        }, {});
    })
}

processDates(dates, packageName, outputOrUpdateFile)