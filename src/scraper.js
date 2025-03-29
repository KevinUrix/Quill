const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const randomUserAgent = () => {
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/89.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246"
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
};


const configureBrowser = async () => {
    return await puppeteer.launch({
        headless: true,
        args: [
            "--disable-gpu",
            `--user-agent=${randomUserAgent()}`
        ]
    });
};


const fillForm = async (page, ciclo, cup, edifp) => {
    await page.select('select[name="ciclop"]', ciclo.toString());
    await page.select('select[name="cup"]', cup);
    await page.type('input[name="edifp"]', edifp);
    await page.click('input[name="mostrarp"][value="500"]');
    await page.click('#idConsultar');
};


const waitTable = async (page, timeout = 5000) => {
    try {
        console.log("Esperando a que la tabla esté disponible...");
        await page.waitForSelector('table', { timeout });
        await page.waitForNetworkIdle({ idleTime: 900, timeout });
    } catch (error) {
        console.error(`Error: La tabla no apareció a tiempo después de ${timeout / 1000} segundos.`);
    }
};

const extractData = ($, buildingName) => {
    const datePattern = /\b\d{2}\/\d{2}\/\d{2} - \d{2}\/\d{2}\/\d{2}\b/;
    let results = [];
    let lastCourse = "";

    $('tr').each((_, row) => {
        let course = $(row).find('td.tddatos').eq(2).text().trim(); // Obtiene el td que contiene la materia
        const table = $(row).find('table.td1');
        const professors = $(row).find('td.tdprofesor');

        if (course) {
            lastCourse = course; // Si existe la materia, actualizar la última válida
        } else {
            course = lastCourse; // Si no hay materia en el td, usa la última materia válida
        }

        if (table.length) {
            table.find('tr').each((_, tableRow) => {
                if (!$(tableRow).find('td').toArray().some(cell => $(cell).text().includes(buildingName))) return;
                
                const cells = $(tableRow).find('td')
                    .toArray()
                    .map(cell => $(cell).text().trim())
                    .filter(text => text !== "01" && !datePattern.test(text));

                if (cells.length < 4) return;
                
                const formattedData = {
                    "schedule": cells[0],
                    "days": cells[1],
                    "building": cells[2],
                    "classroom": cells[3],
                    "course": course
                };

                results.push({
                    data: formattedData,
                    professor: professors.eq(1).text().trim()
                });
                // console.log(cells.filter(text => text !== "01" && !datePattern.test(text)).join(","), course, professors.eq(1).text().trim());
            });
        }
    });
    return results
};


const processForm = async (page, ciclo, cup, edifp, filter) => {
    await fillForm(page, ciclo, cup, edifp);
    let allData = [];
    
    while (true) {
        await waitTable(page); 
        let $ = cheerio.load(await page.content());
        
        if ($('table').length === 0) {
            console.error("Error: No se encontró la tabla en la página");
            break;
        }
        
        allData = allData.concat(extractData($, filter));

        try {
            const nextButton = await page.$('input[value="500 Próximos"]');

            if (nextButton) {
                console.log("Botón encontrado. Esperando 5 segundos antes de hacer clic...");
                await page.waitForTimeout(5000);
                await nextButton.click();
            } else {
                console.log("No hay más páginas disponibles.");
                break;
            }
        } catch (error) {
            console.error("Error al intentar hacer clic en '500 Próximos'", error);
            break;
        }
    }
    return allData;
};


const scrapeData = async () => {
    const browser = await configureBrowser();
    const page = await browser.newPage();
    const url = 'https://siiauescolar.siiau.udg.mx/wal/sspseca.forma_consulta';
    let buildingName = "DUCT2";
    const fileName = `${buildingName}.json`
    const filePath = path.join(__dirname, './data/', fileName);
    
    const fetchData = async (edifp) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        return await processForm(page, "202510", "D", edifp, edifp);
    };
    

    const result = {
        DUCT2: await fetchData(buildingName)
    };
    
    console.log("===============================================");
    
    // await page.goto('https://siiauescolar.siiau.udg.mx/wal/sspseca.forma_consulta', { waitUntil: 'domcontentloaded' });
    // await processForm(page, "202510", "D", "DUCT2", "DUCT2");
    
    await browser.close();
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
};

module.exports = { scrapeData };