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

function flattenData(data) {
    let flattenedData = {};

    for (let key in data) {
        if (typeof data[key] === 'object' && data[key] !== null) {
            // Si el valor es un objeto, extrae sus propiedades
            for (let nestedKey in data[key]) {
                // Usa la clave del objeto padre como la clave en el objeto aplanado
                flattenedData[key] = formatColumnName(data[key][nestedKey]);
            }
        } else {
            // Si el valor no es un objeto, añádelo al objeto aplanado
            let value = formatColumnName(data[key]);
            // Elimina las comas de los datos
            flattenedData[key] = value.replace(/,/g, '');
        }
    }

    return flattenedData;
}


async function generateCSV(jsonData) {
    let flattenedJson;

    if (Array.isArray(jsonData.Detalles)) {
        // Aplanar el objeto JSON
        flattenedJson = jsonData.Detalles.map(data => flattenData(data));
    } else {
        flattenedJson = flattenData(jsonData.Detalles);
    }

    // Obtén todas las claves únicas de todos los objetos
    let allKeys = [];
    flattenedJson.forEach(item => {
        allKeys = [...allKeys, ...Object.keys(item)];
    });
    let uniqueKeys = [...new Set(allKeys)];

    // Asegúrate de que cada objeto tenga todas las claves únicas
    flattenedJson = flattenedJson.map(item => {
        let newItem = {};
        uniqueKeys.forEach(key => {
            if (key in item) {
                newItem[key] = item[key];
            } else {
                newItem[key] = ''; // Si la clave no existe en el objeto, añade una cadena vacía
            }
        });
        return newItem;
    });

    // Ordenar las claves del objeto para determinar el orden de las columnas
    const orderedKeys = Object.keys(flattenedJson[0]).sort();

    // Crear un nuevo objeto con las claves ordenadas y los nombres de las columnas formateados
    const orderedData = flattenedJson.map(item => {
        return orderedKeys.reduce((obj, key) => {
            // Encierra los datos que contienen comas entre comillas
            obj[formatColumnName(key)] = item[key].length > 20 ? `"${item[key]}"` : item[key];
            return obj;
        }, {});
    });

    const parser = new Parser({ flatten: true });
    let csv = parser.parse(orderedData);

    // Eliminar solo las comillas innecesarias
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
