// index.js
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Servir archivos estáticos desde la carpeta "uploads"

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Renombrar el archivo
    },
});

const upload = multer({ storage });

// Crear conexión a la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Rutas

// Obtener todas las películas
app.get('/movies', (req, res) => {
    db.query('SELECT * FROM movies', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener las películas' });
        }
        res.json(results);
    });
});

app.get('/movies/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM movies WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener la película' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Película no encontrada' });
        }
        res.json(results[0]); // Asegúrate de enviar solo un objeto
    });
});

// Agregar una nueva película
app.post('/movies', upload.single('image'), (req, res) => {
    const { name, release_date } = req.body;
    const image = req.file.filename;

    db.query('INSERT INTO movies (name, release_date, image) VALUES (?, ?, ?)', [name, release_date, image], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al agregar la película' });
        }
        res.status(201).json({ id: results.insertId, name, release_date, image });
    });
});

// Eliminar una película
app.delete('/movies/:id', (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM movies WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar la película' });
        }
        res.json({ message: 'Película eliminada con éxito' });
    });
});

// Actualizar una película
app.put('/movies/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, release_date } = req.body;
    const image = req.file ? req.file.filename : null;

    db.query('UPDATE movies SET name = ?, release_date = ?, image = ? WHERE id = ?', [name, release_date, image, id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al actualizar la película' });
        }
        res.json({ message: 'Película actualizada con éxito' });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});