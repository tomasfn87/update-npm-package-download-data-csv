# Update NPM Package Download Data CSV

## How to use it

### Requirements

- `NodeJs`

### How to specify package name and date interval

```console
node updateNpmPackageDownloadDataCsv.js @author/package-name 2020-01-01 2020-12-31 author_package-name_download-data.csv
```

- This command will fetch download data from `@author/package-name`'s `npm` database and save it to `author_package-name_download-data.csv`;
- The program will check and will fetch only missing data, basically updating the CSV file each time data is missing.
