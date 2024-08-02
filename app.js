const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

// Set up multer for file uploads 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // It is used to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'sql.freedb.tech',
    user: 'freedb_doracloset',
    password: 'P%gUSd5V?F$Tp2z',
    database: 'freedb_doracloset'
});

connection.connect((err) => { // when an error occurs
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');

// Middleware to fetch categories for the navbar
app.use((req, res, next) => {
    const sql = 'SELECT * FROM categories';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving categories');
        }
        res.locals.categories = results;
        next();
    });
});

// Middleware for rendering navbar on every page
app.use((req, res, next) => {
    res.locals.pageTitle = 'DoraCloset'; 
    next();
});

// Enable static files and form processing
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// Display Categories on main page
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM categories';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving categories');
        }
        res.render('index', { categories: results });
    });
});

// Display Products by Category
app.get('/category/:id', (req, res) => {
    const categoryId = req.params.id;
    const sql = 'SELECT * FROM products WHERE categoryId = ?';
    connection.query(sql, [categoryId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving products by category');
        }
        res.render('categoryProducts', { products: results });
    });
});

// Display All Products
app.get('/products', (req, res) => {
    const sql = `SELECT p.productId, p.productName, p.quantity, p.price, p.image, c.categoryName 
                 FROM products p
                 JOIN categories c ON p.categoryId = c.categoryId`;
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving products');
        }
        res.render('products', { products: results });
    });
});

// Display Add New Product
app.get('/addProduct', (req, res) => {
    res.locals.pageTitle = 'Add New Product';
    const sql = 'SELECT * FROM categories';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving categories');
        }
        res.render('addProduct', { categories: results });
    });
});

// Add new product action
app.post('/addProduct', upload.single('image'), (req, res) => {
    const { name, quantity, price, categoryId } = req.body;
    let image = req.file ? req.file.filename : null;

    const sql = 'INSERT INTO products (productName, quantity, price, image, categoryId) VALUES (?, ?, ?, ?, ?)';
    connection.query(sql, [name, quantity, price, image, categoryId], (error, results) => {
        if (error) {
            console.error("Error adding product:", error);
            res.status(500).send('Error adding product');
        } else {
            res.redirect('/products');
        }
    });
});

// Edit product
app.get('/editProduct/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'SELECT * FROM products WHERE productId = ?';
    connection.query(sql, [productId], (error, productResults) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving product');
        }

        const categorySql = 'SELECT * FROM categories';
        connection.query(categorySql, (error, categoryResults) => {
            if (error) {
                console.error('Database query error:', error.message);
                return res.status(500).send('Error retrieving categories');
            }
            res.render('editProduct', { product: productResults[0], categories: categoryResults });
        });
    });
});


// Edit product
app.post('/editProduct/:id', upload.single('image'), (req, res) => {
    const productId = req.params.id;
    const { productName, quantity, price, categoryId } = req.body;
    let image = req.file ? req.file.filename : req.body.currentImage;

    const sql = 'UPDATE products SET productName = ?, quantity = ?, price = ?, image = ?, categoryId = ? WHERE productId = ?';
    connection.query(sql, [productName, quantity, price, image, categoryId, productId], (error, results) => {
        if (error) {
            console.error("Error updating product:", error);
            res.status(500).send('Error updating product');
        } else {
            res.redirect('/products');
        }
    });
});


// Delete product
app.post('/deleteProduct/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'DELETE FROM products WHERE productId = ?';
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error('Error deleting product:', error);
            res.status(500).send('Error deleting product');
        } else {
            res.redirect('/products');
        }
    });
});

// Display All Categories
app.get('/categories', (req, res) => {
    const sql = 'SELECT * FROM categories';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving categories');
        }
        res.render('categories', { categories: results });
    });
});

// Add New Category 
app.get('/addCategory', (req, res) => {
    res.locals.pageTitle = 'Add New Category';
    res.render('addCategory');
});

// Add new category action
app.post('/addCategory', (req, res) => {
    const { categoryName } = req.body;
    const sql = 'INSERT INTO categories (categoryName) VALUES (?)';
    connection.query(sql, [categoryName], (error, results) => {
        if (error) {
            console.error("Error adding category:", error);
            res.status(500).send('Error adding category');
        } else {
            res.redirect('/categories');
        }
    });
});

// Edit category 
app.get('/editCategory/:id', (req, res) => {
    const categoryId = req.params.id;
    const sql = 'SELECT * FROM categories WHERE categoryId = ?';
    connection.query(sql, [categoryId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving category');
        }
        res.render('editCategory', { category: results[0] });
    });
});

// Edit category action
app.post('/editCategory/:id', (req, res) => {
    const categoryId = req.params.id;
    const { categoryName } = req.body;
    const sql = 'UPDATE categories SET categoryName = ? WHERE categoryId = ?';
    connection.query(sql, [categoryName, categoryId], (error, results) => {
        if (error) {
            console.error("Error updating category:", error);
            res.status(500).send('Error updating category');
        } else {
            res.redirect('/categories');
        }
    });
});

// Delete category
app.post('/deleteCategory/:id', (req, res) => {
    const categoryId = req.params.id;
    const sql = 'DELETE FROM categories WHERE categoryId = ?';
    connection.query(sql, [categoryId], (error, results) => {
        if (error) {
            console.error('Error deleting category:', error);
            res.status(500).send('Error deleting category');
        } else {
            res.redirect('/categories');
        }
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
