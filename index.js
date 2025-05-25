const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 25565; // порт птеродактиля

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Простая "база данных" в JSON файле
const DB_FILE = './data/players.json';

// Инициализация БД
async function initDB() {
    try {
        await fs.access(DB_FILE);
    } catch {
        await fs.mkdir('./data', { recursive: true });
        await fs.writeFile(DB_FILE, '{}');
    }
}

// Чтение данных игрока
app.post('/api/load', async (req, res) => {
    try {
        const { telegram_id } = req.body;
        const data = await fs.readFile(DB_FILE, 'utf8');
        const players = JSON.parse(data);
        
        res.json(players[telegram_id] || {
            coins: 0,
            gems: 0,
            clickPower: 1,
            autoClickers: 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Load failed' });
    }
});

// Сохранение данных игрока
app.post('/api/save', async (req, res) => {
    try {
        const { telegram_id, gameData } = req.body;
        const data = await fs.readFile(DB_FILE, 'utf8');
        const players = JSON.parse(data);
        
        players[telegram_id] = gameData;
        
        await fs.writeFile(DB_FILE, JSON.stringify(players, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Save failed' });
    }
});

// Лидерборд
app.get('/api/leaderboard', async (req, res) => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        const players = JSON.parse(data);
        
        const leaderboard = Object.entries(players)
            .map(([id, data]) => ({ ...data, id }))
            .sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0))
            .slice(0, 100);
            
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json([]);
    }
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 NoseCoin server running on port ${PORT}`);
    });
});