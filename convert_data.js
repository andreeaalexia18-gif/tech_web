const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'baza_de_date.json';

// --- FUNCȚIE DE AUTO-DETECTARE A FIȘIERULUI ---
function findDatabaseFile() {
    const files = fs.readdirSync('.');
    // Căutăm fișiere care NU sunt scripturi JS și NU sunt json-uri mici
    // și luăm fișierul cu dimensiunea cea mai mare (baza de date e mare)
    let largestFile = null;
    let maxSize = 0;

    files.forEach(file => {
        const stats = fs.statSync(file);
        const ext = path.extname(file).toLowerCase();
        
        // Ignorăm fișierele de sistem/scripturi cunoscute
        if (file === 'convert_data.js' || file === 'server.js' || file === 'package.json' || file === 'package-lock.json' || file === OUTPUT_FILE) return;
        if (stats.isDirectory()) return;

        // Dacă e fișier text sau sql și e mare, e candidatul nostru
        if (stats.size > maxSize) {
            maxSize = stats.size;
            largestFile = file;
        }
    });
    return largestFile;
}

try {
    const detectedFile = findDatabaseFile();

    if (!detectedFile) {
        throw new Error("Nu am găsit niciun fișier care să semene a bază de date (SQL sau TXT mare) în acest folder!");
    }

    console.log(`🔎 Am detectat automat fișierul: "${detectedFile}"`);
    console.log(`⏳ Încep citirea...`);

    let content = fs.readFileSync(detectedFile, 'utf8');

    // Regex robust pentru SQL values
    const regex = /\(\s*(\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g;
    
    let match;
    const items = [];
    let success = 0;

    console.log("⚙️  Procesez datele...");

    while ((match = regex.exec(content)) !== null) {
        try {
            const id = parseInt(match[1]);
            let jsonString = match[2];
            jsonString = jsonString.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
            
            const dataObj = JSON.parse(jsonString);
            if (!dataObj.image) dataObj.image = dataObj.PrimaryImage || dataObj.primaryImage || "";

            items.push({ id, data: dataObj });
            success++;
        } catch (err) {}
    }

    console.log("---------------------------------------------------");
    console.log(`✅ REZULTAT: Am extras ${success} elemente din ${detectedFile}!`);
    console.log("---------------------------------------------------");

    if (success > 0) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(items, null, 2), 'utf8');
        console.log(`💾 Gata! Baza de date a fost salvată în ${OUTPUT_FILE}.`);
        console.log(`👉 Rulează: node server.js`);
    } else {
        console.log("❌ Nu am găsit date valide în fișierul detectat.");
    }

} catch (e) {
    console.error("❌ EROARE:", e.message);
    console.log("Sfat: Asigură-te că fișierul SQL/TXT este în același folder cu acest script.");
}