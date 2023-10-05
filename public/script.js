document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('dropArea');
    const analyzeButton = document.getElementById('analyzeButton');
    const deleteButton = document.getElementById('deleteButton'); // Nuevo botón
    const xmlFileInput = document.getElementById('xmlFile');
    const fileNamesContainer = document.getElementById('fileNames');

    let xmlFiles = [];

    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('active');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('active');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();

        dropArea.classList.remove('active');

        xmlFiles = Array.from(e.dataTransfer.files);
        displayFileNames(xmlFiles);

        // Verificar si los archivos son XML antes de mostrar el botón de Analizar Facturas
        const areAllFilesXml = xmlFiles.every(file => file.name.toLowerCase().endsWith('.xml'));

        analyzeButton.style.display = areAllFilesXml && xmlFiles.length > 0 ? 'block' : 'none';
        deleteButton.style.display = areAllFilesXml && xmlFiles.length > 0 ? 'block' : 'none'; // Muestra el botón de eliminar

        // Mostrar mensaje de error si hay archivos no XML
        if (!areAllFilesXml) {
            alert('Por favor, carga solo archivos XML.');
            xmlFiles = [];
            displayFileNames(xmlFiles);
            analyzeButton.style.display = 'none';
            deleteButton.style.display = 'none'; // Oculta el botón de eliminar
        }
    });

    // Evento al seleccionar archivos usando el input
    xmlFileInput.addEventListener('change', (e) => {
        xmlFiles = Array.from(e.target.files);
        displayFileNames(xmlFiles);

        // Verificar si los archivos son XML antes de mostrar el botón de Analizar Facturas
        const areAllFilesXml = xmlFiles.every(file => file.name.toLowerCase().endsWith('.xml'));
        analyzeButton.style.display = areAllFilesXml && xmlFiles.length > 0 ? 'block' : 'none';
        deleteButton.style.display = areAllFilesXml && xmlFiles.length > 0 ? 'block' : 'none'; // Muestra el botón de eliminar

        // Mostrar mensaje de error si hay archivos no XML
        if (!areAllFilesXml) {
            alert('Por favor, carga solo archivos XML.');
            xmlFiles = [];
            displayFileNames(xmlFiles);
            analyzeButton.style.display = 'none';
            deleteButton.style.display = 'none'; // Oculta el botón de eliminar
        }
    });

    // Evento al hacer clic en el botón de eliminar
    deleteButton.addEventListener('click', () => {
        xmlFiles = [];
        displayFileNames(xmlFiles);
        analyzeButton.style.display = 'none';
        deleteButton.style.display = 'none';
        xmlFileInput.value = null; // Restablece el valor del elemento de entrada de archivo
    });

    document.getElementById('analyzeButton').addEventListener('click', async () => {
        await handleFiles(xmlFiles);
    });
});

function displayFileNames(files) {
    const fileNamesContainer = document.getElementById('fileNames');
    fileNamesContainer.innerHTML = '';

    files.forEach(file => {
        const fileNameElement = document.createElement('p');
        fileNameElement.textContent = file.name;
        fileNamesContainer.appendChild(fileNameElement);
    });
}


async function handleFiles(files) {
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
        formData.append('xmlFiles', files[i]);
    }

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const zipData = await response.arrayBuffer();
            const zipBlob = new Blob([zipData], { type: 'application/zip' });
            const url = URL.createObjectURL(zipBlob);

            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = 'Facturas.zip';
            downloadLink.click();
        } else {
            alert('Error al analizar los archivos');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function handleDrop(event) {
    event.preventDefault();
    const xmlFiles = event.dataTransfer.files;
    displayFileNames(Array.from(xmlFiles));
    return false;
}

function handleDragOver(event) {
    event.preventDefault();
    return false;
}
