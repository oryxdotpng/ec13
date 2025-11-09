const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose(); // Import sqlite3
const app = express();
const port = 3000;

// SQLite database setup
const db = new sqlite3.Database('./forum.db', (err) => {
    if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        // Create table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                author TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        `);
    }
});

// Categories and their passwords (this is just an example)
const categoryPasswords = {
    'r': 'rpassword',
    't': 'techpassword',
    'm': 'musicpassword',
    'a': process.env.a,
    'f': 'foodpassword',
    'p': 'pornpassword',
    'c':  'convopassword',
    'sci':  'scipassword',
    'rel':  'religionpwd',
    'hn':  'hentaipwd',
    'h':  'historypwd',
    'fet': 'fetishpwd',
    'meme': 'memepwd',
    'tv': 'tvpassword',
    'aco':  process.env.aco,
    'vg':  'videogamepwd'
};

// Middlewares
app.use(bodyParser.json());
app.use(express.static('public'));

// Endpoint to get posts by category
app.get('/posts/:category', (req, res) => {
    const { category } = req.params;
    
    // Fetch posts from SQLite database for the given category
    db.all('SELECT * FROM posts WHERE category = ?', [category], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch posts.' });
        }
        res.json(rows);  // Send all posts for the specified category
    });
});

// Endpoint to add a post
app.post('/add-post', (req, res) => {
    const { category, author, content } = req.body;
    const timestamp = new Date().toISOString();

    // Insert post into SQLite database
    db.run('INSERT INTO posts (category, author, content, timestamp) VALUES (?, ?, ?, ?)', 
        [category, author, content, timestamp], 
        function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Failed to add post.' });
            }
            const newPost = {
                id: this.lastID,  // Get the last inserted ID
                category,
                author,
                content,
                timestamp
            };
            res.json({ post: newPost });  // Return the new post details
        }
    );
});

// Endpoint to delete a post
app.delete('/delete-post', (req, res) => {
    const { id, category, password } = req.body;

    // Check password for the category
    if (categoryPasswords[category] !== password) {
        return res.status(403).json({ error: 'Incorrect password for this category.' });
    }

    // Delete post by ID from SQLite database
    db.run('DELETE FROM posts WHERE id = ?', [id], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to delete post.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        res.json({ message: 'Post deleted successfully.' });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
