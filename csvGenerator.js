const fs = require('fs');
const { Parser } = require('json2csv');
const flatten = require('flat').flatten;

function formatColumnName(columnName) {
    return columnName.replace(/_/g, ' ')
                     .replace(/[áéíóúñ]/g, match => 
                        ({'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'nn'}[match]));
}

function flattenData(data) {
    let flattenedData = {};

    for (let key in data) {
        if (typeof data[key] === 'object' && data[key] !== null) {
            for (let nestedKey in data[key]) {
                flattenedData[key] = formatColumnName(data[key][nestedKey]);
            }
        } else {
            let value = formatColumnName(data[key]);
            flattenedData[key] = value.replace(/,/g, '');
        }
    }

    return flattenedData;
}

async function generateCSV(jsonData) {
    let flattenedJson;

    if (Array.isArray(jsonData.Detalles)) {
        flattenedJson = jsonData.Detalles.map(data => flattenData(data));
    } else {
        flattenedJson = flattenData(jsonData.Detalles);
    }

    let allKeys = [];
    flattenedJson.forEach(item => {
        allKeys = [...allKeys, ...Object.keys(item)];
    });
    let uniqueKeys = [...new Set(allKeys)];

    flattenedJson = flattenedJson.map(item => {
        let newItem = {};
        uniqueKeys.forEach(key => {
            newItem[key] = key in item ? item[key] : '';
        });
        return newItem;
    });

    const orderedKeys = Object.keys(flattenedJson[0]).sort();

    const orderedData = flattenedJson.map(item => {
        return orderedKeys.reduce((obj, key) => {
            obj[formatColumnName(key)] = item[key].length > 20 ? `"${item[key]}"` : item[key];
            return obj;
        }, {});
    });

    const parser = new Parser({ flatten: true });
    let csv = parser.parse(orderedData);

    csv = csv.replace(/"/g, '');

    const finalCsv = csv.replace(/\\u([\d\w]{4})/gi, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
    });

    fs.writeFileSync('output.csv', finalCsv, 'utf8');

    return finalCsv;
}

module.exports = { generateCSV };
