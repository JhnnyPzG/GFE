const fs = require('fs');
const iconv = require('iconv-lite');
const { Parser } = require('json2csv');
const flatten = require('flat').flatten;

// Función para convertir los nombres de las columnas a un formato más legible
function formatColumnName(columnName) {
    // Reemplaza los guiones bajos por espacios
    let formattedColumnName = columnName.replace(/_/g, ' ');

    // Reemplaza los caracteres especiales
    formattedColumnName = formattedColumnName.replace(/á/g, 'a');
    formattedColumnName = formattedColumnName.replace(/é/g, 'e');
    formattedColumnName = formattedColumnName.replace(/í/g, 'i');
    formattedColumnName = formattedColumnName.replace(/ó/g, 'o');
    formattedColumnName = formattedColumnName.replace(/ú/g, 'u');
    formattedColumnName = formattedColumnName.replace(/ñ/g, 'nn');

    return formattedColumnName;
}

// Función para aplanar los datos, incluyendo los objetos con propiedades .Name o .Label
function flattenData(data) {
    const flattenedData = flatten(data);

    // Reemplaza las propiedades .Name y .Label por su valor y elimina las repeticiones
    for (let key in flattenedData) {
        if (key.endsWith('.Name') || key.endsWith('.Label')) {
            const newKey = key.replace(/.Name$|.Label$/, '');
            if (!flattenedData[newKey]) {
                flattenedData[newKey] = formatColumnName(flattenedData[key]); // Aplica formatColumnName al valor
            }
            delete flattenedData[key];
        } else {
            flattenedData[key] = formatColumnName(flattenedData[key]); // Aplica formatColumnName al valor
        }
    }

    return flattenedData;
}

async function generateCSV(jsonData) {
    console.log(jsonData)
    let flattenedJson;

    if (Array.isArray(jsonData.Detalles)) {
        // Aplanar el objeto JSON
        flattenedJson = jsonData.Detalles.map(data => flattenData(data));
    } else {
        flattenedJson = flattenData(jsonData.Detalles);
    }

    // Ordenar las claves del objeto para determinar el orden de las columnas
    const orderedKeys = Object.keys(flattenedJson[0]).sort();

    // Crear un nuevo objeto con las claves ordenadas y los nombres de las columnas formateados
    const orderedData = flattenedJson.map(item => {
        return orderedKeys.reduce((obj, key) => {
            obj[formatColumnName(key)] = item[key];
            return obj;
        }, {});
    });

    const parser = new Parser({ flatten: true }); // Desactiva las comillas
    let csv = parser.parse(orderedData);

    // Eliminar las comillas de la cadena CSV
    csv = csv.replace(/"/g, '');

    // Convertir los caracteres especiales a su representación correcta
    const finalCsv = csv.replace(/\\u([\d\w]{4})/gi, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
    });

    // Guarda el CSV con la codificación 'utf8'
    fs.writeFileSync('output.csv', finalCsv, 'utf8');

    // Leer el archivo con la codificación 'utf8'
    const data = fs.readFileSync('output.csv', 'utf8');

    // Escribir el archivo con la codificación 'utf8'
    fs.writeFileSync('output.csv', data, 'utf8');

    return finalCsv;
}

module.exports = { generateCSV };
