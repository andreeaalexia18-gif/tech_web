const API_URL = 'http://localhost:3000/api';

// --- Stare Globala ---
let currentPage = 1;
let currentLimit = 500;
let currentSearch = '';
let currentFilter = '';

// --- Functii Generale (Index) ---
async function loadArtworks() {
    const url = `${API_URL}/artworks?page=${currentPage}&limit=${currentLimit}&search=${currentSearch}&filter=${currentFilter}`;
    const res = await fetch(url);
    const json = await res.json();
    
    const grid = document.getElementById('artGrid');
    if(grid) {
        grid.innerHTML = '';
        json.data.forEach(item => {
            // Folosim un placeholder daca nu exista imagine
            const imgSrc = item.data.image ? item.data.image : 'https://via.placeholder.com/200?text=No+Image';
            
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${imgSrc}" alt="Art">
                <h3>${item.data.title}</h3>
                <p>${item.data.artistDisplayName}</p>
                <a href="detail.html?id=${item.id}"><button>Detalii</button></a>
            `;
            grid.appendChild(card);
        });
        document.getElementById('pageInfo').innerText = `Pagina ${json.page}`;
    }
    
    // Pentru Admin Table
    const tableBody = document.getElementById('adminTableBody');
    if(tableBody) {
        tableBody.innerHTML = '';
        json.data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.data.title}</td>
                <td>${item.data.artistDisplayName}</td>
                <td>
                    <button onclick="editItem(${item.id})">Editează</button>
                    <button onclick="deleteItem(${item.id})" style="color:red">Șterge</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

function search() {
    currentSearch = document.getElementById('searchInput').value;
    currentPage = 1;
    loadArtworks();
}

function filter(dept) {
    currentFilter = dept;
    currentPage = 1;
    loadArtworks();
}

function changeLimit() {
    currentLimit = document.getElementById('limitSelect').value;
    currentPage = 1;
    loadArtworks();
}

function nextPage() { currentPage++; loadArtworks(); }
function prevPage() { if(currentPage > 1) currentPage--; loadArtworks(); }

// --- Functii Detaliu ---
async function loadDetail(id) {
    const res = await fetch(`${API_URL}/artworks/${id}`);
    if(res.ok) {
        const item = await res.json();
        const d = item.data;
        const imgSrc = d.image ? d.image : 'https://via.placeholder.com/400?text=No+Image';
        
        document.getElementById('detailContainer').innerHTML = `
            <h1>${d.title}</h1>
            <img src="${imgSrc}">
            <div class="info">
                <p><strong>Artist:</strong> ${d.artistDisplayName}</p>
                <p><strong>Departament:</strong> ${d.department}</p>
                <p><strong>Tip:</strong> ${d.objectName}</p>
                <p><strong>Numar Inventar:</strong> ${d.accessionNumber}</p>
            </div>
        `;
    } else {
        document.getElementById('detailContainer').innerText = 'Nu a fost găsit.';
    }
}

// --- Functii Admin / Auth ---
function login() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    
    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            localStorage.setItem('token', data.token);
            checkAuth();
        } else {
            document.getElementById('loginError').innerText = data.message;
        }
    });
}

function checkAuth() {
    if(document.getElementById('loginSection')) {
        const token = localStorage.getItem('token');
        if(token) {
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('adminContent').classList.remove('hidden');
            loadArtworks(); // Incarca tabelul
        } else {
            document.getElementById('loginSection').classList.remove('hidden');
            document.getElementById('adminContent').classList.add('hidden');
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.reload();
}

// --- Functii Admin (CRUD) ---
// Conversie Imagine in Base64
document.getElementById('inpImage')?.addEventListener('change', function() {
    const reader = new FileReader();
    reader.onload = function() {
        document.getElementById('inpImageBase64').value = reader.result;
    }
    reader.readAsDataURL(this.files[0]);
});

function showAddForm() {
    document.getElementById('itemForm').classList.remove('hidden');
    document.getElementById('formTitle').innerText = 'Adaugă Element';
    document.getElementById('editId').value = '';
    // Reset inputs
    document.getElementById('inpTitle').value = '';
    document.getElementById('inpArtist').value = '';
    document.getElementById('inpDept').value = '';
    document.getElementById('inpImage').value = '';
    document.getElementById('inpImageBase64').value = '';
}

function hideForm() {
    document.getElementById('itemForm').classList.add('hidden');
}

async function saveItem() {
    const id = document.getElementById('editId').value;
    const dataObj = {
        title: document.getElementById('inpTitle').value,
        artistDisplayName: document.getElementById('inpArtist').value,
        department: document.getElementById('inpDept').value,
        image: document.getElementById('inpImageBase64').value // Base64 string
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/artworks/${id}` : `${API_URL}/artworks`;

    await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataObj)
    });

    hideForm();
    loadArtworks();
}

async function editItem(id) {
    // Luam datele curente pentru a popula formularul
    const res = await fetch(`${API_URL}/artworks/${id}`);
    const item = await res.json();
    
    showAddForm();
    document.getElementById('formTitle').innerText = 'Editează Element';
    document.getElementById('editId').value = item.id;
    
    document.getElementById('inpTitle').value = item.data.title;
    document.getElementById('inpArtist').value = item.data.artistDisplayName;
    document.getElementById('inpDept').value = item.data.department;
    document.getElementById('inpImageBase64').value = item.data.image || '';
}

async function deleteItem(id) {
    if(confirm('Sigur vrei să ștergi?')) {
        await fetch(`${API_URL}/artworks/${id}`, { method: 'DELETE' });
        loadArtworks();
    }
}