const ExcelJS = require('exceljs');

async function generateExcel(jsonData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Factura Data');

    // Función para obtener todos los encabezados
    function getHeaders(data) {
        const headers = new Set();
        for (const key in data) {
            if (data[key] !== null && data[key] !== undefined) {
                if (typeof data[key] === 'object') {
                    for (const subKey in data[key]) {
                        headers.add(`${key}.${subKey}`);
                    }
                } else {
                    headers.add(key);
                }
            }
        }
        return Array.from(headers);
    }

    // Extraer encabezados y agregar a la hoja de Excel
    const headers = getHeaders(jsonData);
    worksheet.addRow(['Campo', 'Valor']); // Titulos de las columnas
    worksheet.columns = [
        { header: 'Campo', key: 'campo', width: 25 },
        { header: 'Valor', key: 'valor', width: 40 }
    ];

    // Función para obtener los valores de una fila
    function getRowValues(data) {
        const rows = [];
        headers.forEach(header => {
            const [mainKey, subKey] = header.split('.');
            if (subKey) {
                if (data[mainKey] && data[mainKey][subKey]) {
                    rows.push({ campo: header, valor: data[mainKey][subKey] });
                } else {
                    rows.push({ campo: header, valor: '' });
                }
            } else {
                if (data[mainKey] !== undefined && data[mainKey] !== null) {
                    if (typeof data[mainKey] === 'object') {
                        for (const subKey in data[mainKey]) {
                            const subHeaderValue = `${mainKey}.${subKey}`;
                            const subValue = data[mainKey][subKey];
                            rows.push({ campo: subHeaderValue, valor: subValue });
                        }
                    } else {
                        rows.push({ campo: mainKey, valor: data[mainKey] });
                    }
                } else {
                    rows.push({ campo: mainKey, valor: '' });
                }
            }
        });
        return rows;
    }

    // Agregar datos
    worksheet.addRows(getRowValues(jsonData));

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

module.exports = { generateExcel };
