const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_FILE = 'baza_de_date.json';

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Limita mare pentru imagini Base64
app.use(express.static('public')); // Serveste fisierele frontend

// --- Functii Utilitare ---
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) return [];
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data || '[]');
};

const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- Rute API ---

// 1. Login (Simplificat pentru proiect)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // User: admin, Parola: admin
    if (username === 'admin' && password === 'admin') {
        res.json({ success: true, token: 'admin-token-secret' });
    } else {
        res.status(401).json({ success: false, message: 'Date incorecte' });
    }
});

// 2. Citire Date (cu Paginare, Cautare, Filtrare)
app.get('/api/artworks', (req, res) => {
    let db = readDB();
    const { page = 1, limit = 10, search = '', filter = '' } = req.query;

    // A. Cautare Generala
    if (search) {
        const term = search.toLowerCase();
        db = db.filter(item => {
            const d = item.data;
            return (d.title && d.title.toLowerCase().includes(term)) ||
                   (d.artistDisplayName && d.artistDisplayName.toLowerCase().includes(term)) ||
                   (d.objectName && d.objectName.toLowerCase().includes(term));
        });
    }

    // B. Filtrare (ex: dupa departament)
if (filter) {
        const filterLower = filter.toLowerCase(); // Transformăm ce cauți în litere mici
        db = db.filter(item => {
            // Dacă elementul nu are departament, îl sărim
            if (!item.data.department) return false;
            
            // Verificăm dacă departamentul conține cuvântul căutat (ex: "American" în "The American Wing")
            return item.data.department.toLowerCase().includes(filterLower);
        });
}
    // C. Paginare
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = db.slice(startIndex, endIndex);

    res.json({
        total: db.length,
        page: parseInt(page),
        limit: parseInt(limit),
        data: paginatedResults
    });
});

// 3. Detaliu (Un singur element)
app.get('/api/artworks/:id', (req, res) => {
    const db = readDB();
    const item = db.find(i => i.id == req.params.id);
    if (item) res.json(item);
    else res.status(404).json({ message: 'Nu a fost gasit' });
});

// 4. Adaugare (Doar Admin)
app.post('/api/artworks', (req, res) => {
    const db = readDB();
    const newId = db.length > 0 ? Math.max(...db.map(i => i.id)) + 1 : 1;
    
    const newItem = {
        id: newId,
        data: req.body // Body-ul contine JSON-ul cu title, image, etc.
    };

    db.push(newItem);
    writeDB(db);
    res.json({ success: true, id: newId });
});

// 5. Editare (Doar Admin)
app.put('/api/artworks/:id', (req, res) => {
    const db = readDB();
    const index = db.findIndex(i => i.id == req.params.id);

    if (index !== -1) {
        db[index].data = { ...db[index].data, ...req.body };
        writeDB(db);
        res.json({ success: true });
    } else {
        res.status(404).json({ message: 'Nu a fost gasit' });
    }
});

// 6. Stergere (Doar Admin)
app.delete('/api/artworks/:id', (req, res) => {
    let db = readDB();
    const initialLength = db.length;
    db = db.filter(i => i.id != req.params.id);

    if (db.length < initialLength) {
        writeDB(db);
        res.json({ success: true });
    } else {
        res.status(404).json({ message: 'Nu a fost gasit' });
    }
});

app.listen(PORT, () => {
    console.log(`Server pornit la http://localhost:${PORT}`);
});