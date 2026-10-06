from flask import Flask, request, jsonify, send_from_directory
import sqlite3
from datetime import datetime

app = Flask(__name__)
FRONTEND_FOLDER = "../frontend"


@app.route("/")
def home():
    return send_from_directory(FRONTEND_FOLDER, "index.html")


@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_FOLDER, filename)


DATABASE = "database.db"


# ---------------- DATABASE CONNECTION ----------------

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# ---------------- INITIALIZE DATABASE ----------------

def init_db():
    conn = get_db_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            price REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# ---------------- GET ALL PRODUCTS ----------------

@app.route("/api/products", methods=["GET"])
def get_products():

    conn = get_db_connection()

    products = conn.execute("""
        SELECT * FROM products
        ORDER BY id DESC
    """).fetchall()

    conn.close()

    return jsonify([dict(product) for product in products])


# ---------------- SEARCH PRODUCTS ----------------

@app.route("/api/products/search", methods=["GET"])
def search_products():

    query = request.args.get("q", "").strip()

    conn = get_db_connection()

    products = conn.execute("""
        SELECT * FROM products
        WHERE product_id LIKE ?
           OR name LIKE ?
           OR category LIKE ?
        ORDER BY id DESC
    """, (
        f"%{query}%",
        f"%{query}%",
        f"%{query}%"
    )).fetchall()

    conn.close()

    return jsonify([dict(product) for product in products])


# ---------------- ADD PRODUCT ----------------

@app.route("/api/products", methods=["POST"])
def add_product():

    data = request.get_json()

    product_id = data.get("product_id")
    name = data.get("name")
    category = data.get("category")
    quantity = data.get("quantity")
    price = data.get("price")

    # Validation
    if not product_id or not name or not category:
        return jsonify({
            "error": "Product ID, name and category are required."
        }), 400

    try:
        quantity = int(quantity)
        price = float(price)
    except (TypeError, ValueError):
        return jsonify({
            "error": "Quantity must be an integer and price must be a number."
        }), 400

    if quantity < 0:
        return jsonify({
            "error": "Quantity cannot be negative."
        }), 400

    if price < 0:
        return jsonify({
            "error": "Price cannot be negative."
        }), 400

    conn = get_db_connection()

    try:

        conn.execute("""
            INSERT INTO products
            (product_id, name, category, quantity, price, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            product_id,
            name,
            category,
            quantity,
            price,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))

        conn.commit()

    except sqlite3.IntegrityError:

        conn.close()

        return jsonify({
            "error": "Product ID already exists."
        }), 409

    conn.close()

    return jsonify({
        "message": "Product added successfully."
    }), 201


# ---------------- UPDATE PRODUCT ----------------

@app.route("/api/products/<int:id>", methods=["PUT"])
def update_product(id):

    data = request.get_json()

    name = data.get("name")
    category = data.get("category")
    quantity = data.get("quantity")
    price = data.get("price")

    if not name or not category:
        return jsonify({
            "error": "Name and category are required."
        }), 400

    try:
        quantity = int(quantity)
        price = float(price)
    except (TypeError, ValueError):
        return jsonify({
            "error": "Invalid quantity or price."
        }), 400

    if quantity < 0 or price < 0:
        return jsonify({
            "error": "Quantity and price cannot be negative."
        }), 400

    conn = get_db_connection()

    product = conn.execute(
        "SELECT * FROM products WHERE id = ?",
        (id,)
    ).fetchone()

    if product is None:
        conn.close()

        return jsonify({
            "error": "Product not found."
        }), 404

    conn.execute("""
        UPDATE products
        SET name = ?,
            category = ?,
            quantity = ?,
            price = ?
        WHERE id = ?
    """, (
        name,
        category,
        quantity,
        price,
        id
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Product updated successfully."
    })


# ---------------- UPDATE STOCK ----------------

@app.route("/api/products/<int:id>/stock", methods=["PUT"])
def update_stock(id):

    data = request.get_json()

    quantity = data.get("quantity")

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):

        return jsonify({
            "error": "Quantity must be an integer."
        }), 400

    if quantity < 0:

        return jsonify({
            "error": "Stock cannot be negative."
        }), 400

    conn = get_db_connection()

    product = conn.execute(
        "SELECT * FROM products WHERE id = ?",
        (id,)
    ).fetchone()

    if product is None:

        conn.close()

        return jsonify({
            "error": "Product not found."
        }), 404

    conn.execute("""
        UPDATE products
        SET quantity = ?
        WHERE id = ?
    """, (quantity, id))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Stock updated successfully."
    })


# ---------------- DELETE PRODUCT ----------------

@app.route("/api/products/<int:id>", methods=["DELETE"])
def delete_product(id):

    conn = get_db_connection()

    product = conn.execute(
        "SELECT * FROM products WHERE id = ?",
        (id,)
    ).fetchone()

    if product is None:

        conn.close()

        return jsonify({
            "error": "Product not found."
        }), 404

    conn.execute(
        "DELETE FROM products WHERE id = ?",
        (id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Product deleted successfully."
    })


# ---------------- RUN SERVER ----------------

if __name__ == "__main__":

    init_db()

    app.run(
        debug=True,
        port=5000
    )