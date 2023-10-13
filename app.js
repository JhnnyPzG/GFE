const express = require('express');
const multer = require('multer');
const axios = require('axios');
const bodyParser = require('body-parser');
const csvGenerator = require('./csvGenerator');
const ExcelJS = require('exceljs');
const AdmZip = require('adm-zip');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.any(), async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        let worksheet;

        for (let file of req.files) {
            let xmlDataArray;
            if (file.originalname.endsWith('.zip')) {
                const zip = new AdmZip(file.buffer);
                const zipEntries = zip.getEntries();

                xmlDataArray = zipEntries.map(entry => entry.getData().toString('utf-8'));
            } else {
                xmlDataArray = [file.buffer.toString('utf-8')];
            }

            for (let xmlData of xmlDataArray) {
                const response = await axios.post('http://dev.creativosdigitales.co:8080/basex/analizar/tabla', xmlData, {
                    headers: {
                        'Content-Type': 'application/xml',
                    },
                });

                const jsonData = response.data;

                const csvContent = await csvGenerator.generateCSV(jsonData);

                const rows = csvContent.split('\n').map(row => row.split(','));

                if (!worksheet) { 
                    worksheet = workbook.addWorksheet('Facturas');
                    worksheet.addRow(rows[0]);
                }

                worksheet.addRows(rows.slice(1)); 
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Facturas.xlsx');
        res.send(buffer);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
