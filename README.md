# Update NPM Package Download Data CSV

## How to use it

### Requirements

- `NodeJs`

---

### How to specify package name and date interval

```console
node updateNpmPackageDownloadDataCsv.js package-name 2020-01-01 2020-12-31 package-name_download-data.csv
```

> __Only package name__: \<package-name\>; start and end dates in YYYY-MM-DD format; output file to be created or updated.

```console
node updateNpmPackageDownloadDataCsv.js @author/package-name 2020-12-31 2020-01-01 author_package-name_download-data.csv
```

> __Author and package name__: @\<author\>/\<package-name\>; inverted start and end dates are also accepted.

---

- The commands above will fetch the download data from `package-name`'s `npm` database or `@author/package-name`'s `npm` database and save it to `package-name_download-data.csv` or `author_package-name_download-data.csv`;
- The program will always download data of the last 30 days, excluding the last 5 days; the previous days will be checked  and only missing data will be fetched, basically updating the CSV file if some pieces of data are missing.
