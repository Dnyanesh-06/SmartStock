// ======================================================
// SMARTSTOCK - INVENTORY MANAGEMENT SYSTEM
// ======================================================

const API_URL = "/api/products";

let products = [];


// ======================================================
// LOAD PRODUCTS
// ======================================================

async function loadProducts() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load products");
        }

        products = await response.json();

        displayProducts(products);
        updateDashboard(products);

    } catch (error) {
        console.error("Load error:", error);

        document.getElementById("productTableBody").innerHTML = `
            <tr>
                <td colspan="7" class="error">
                    Unable to connect to Flask server.
                </td>
            </tr>
        `;
    }
}


// ======================================================
// DISPLAY PRODUCTS
// ======================================================

function displayProducts(productList) {
    const tableBody =
        document.getElementById("productTableBody");

    if (productList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = productList.map(product => {

        const lowStock =
            Number(product.quantity) < 10;

        return `
            <tr>

                <td>
                    <strong>${product.product_id}</strong>
                </td>

                <td>
                    ${product.name}
                </td>

                <td>
                    <span class="category">
                        ${product.category}
                    </span>
                </td>

                <td>
                    ${product.quantity}
                </td>

                <td>
                    ₹${Number(product.price).toLocaleString("en-IN")}
                </td>

                <td>
                    ${
                        lowStock
                            ? `
                                <span class="status low">
                                    Low Stock
                                </span>
                              `
                            : `
                                <span class="status available">
                                    Available
                                </span>
                              `
                    }
                </td>

                <td>
                    <div class="actions">

                        <button
                            class="stock-btn"
                            onclick="updateStock(${product.id})"
                            title="Update Stock"
                        >
                            📊
                        </button>

                        <button
                            class="edit-btn"
                            onclick="editProduct(${product.id})"
                            title="Edit Product"
                        >
                            ✏
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteProduct(${product.id})"
                            title="Delete Product"
                        >
                            🗑
                        </button>

                    </div>
                </td>

            </tr>
        `;

    }).join("");
}


// ======================================================
// UPDATE DASHBOARD
// ======================================================

function updateDashboard(productList) {

    const totalProducts =
        productList.length;

    const totalStock =
        productList.reduce(
            (total, product) =>
                total + Number(product.quantity),
            0
        );

    const lowStock =
        productList.filter(
            product =>
                Number(product.quantity) < 10
        ).length;

    const inventoryValue =
        productList.reduce(
            (total, product) =>
                total +
                Number(product.quantity) *
                Number(product.price),
            0
        );

    document.getElementById("totalProducts")
        .textContent = totalProducts;

    document.getElementById("totalStock")
        .textContent = totalStock;

    document.getElementById("lowStock")
        .textContent = lowStock;

    document.getElementById("inventoryValue")
        .textContent =
        "₹" + inventoryValue.toLocaleString("en-IN");
}


// ======================================================
// OPEN ADD PRODUCT MODAL
// ======================================================

function openAddModal() {

    document.getElementById("productModal")
        .classList.add("show");

    document.getElementById("modalTitle")
        .textContent = "Add Product";

    document.getElementById("productForm")
        .reset();

    document.getElementById("editId")
        .value = "";

    document.getElementById("productId")
        .disabled = false;
}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeModal() {

    document.getElementById("productModal")
        .classList.remove("show");

    // Make Products active after closing

    document.querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.remove("active");
        });

    const productsNav =
        document.querySelector('a[href="#products"]');

    if (productsNav) {
        productsNav.classList.add("active");
    }
}


// ======================================================
// ADD / EDIT PRODUCT
// ======================================================

document.getElementById("productForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const editId =
            document.getElementById("editId").value;

        const productData = {

            product_id:
                document.getElementById("productId")
                    .value.trim(),

            name:
                document.getElementById("productName")
                    .value.trim(),

            category:
                document.getElementById("productCategory")
                    .value.trim(),

            quantity:
                Number(
                    document.getElementById("productQuantity")
                        .value
                ),

            price:
                Number(
                    document.getElementById("productPrice")
                        .value
                )
        };


        // Frontend validation

        if (
            !productData.product_id ||
            !productData.name ||
            !productData.category
        ) {
            alert("Please fill in all required fields.");
            return;
        }

        if (
            productData.quantity < 0 ||
            productData.price < 0
        ) {
            alert("Quantity and price cannot be negative.");
            return;
        }


        try {

            let response;


            // UPDATE

            if (editId) {

                response = await fetch(
                    `${API_URL}/${editId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            name: productData.name,
                            category: productData.category,
                            quantity: productData.quantity,
                            price: productData.price
                        })
                    }
                );

            }


            // ADD

            else {

                response = await fetch(
                    API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(productData)
                    }
                );
            }


            const result =
                await response.json();


            if (!response.ok) {

                alert(
                    result.error ||
                    "Something went wrong."
                );

                return;
            }


            alert(
                editId
                    ? "Product updated successfully!"
                    : "Product added successfully!"
            );


            closeModal();

            await loadProducts();


        } catch (error) {

            console.error("Save error:", error);

            alert(
                "Unable to connect to Flask server."
            );
        }

    });


// ======================================================
// EDIT PRODUCT
// ======================================================

function editProduct(id) {

    const product =
        products.find(
            product => product.id === id
        );

    if (!product) {
        return;
    }


    document.getElementById("productModal")
        .classList.add("show");

    document.getElementById("modalTitle")
        .textContent = "Edit Product";

    document.getElementById("editId")
        .value = product.id;

    document.getElementById("productId")
        .value = product.product_id;

    document.getElementById("productName")
        .value = product.name;

    document.getElementById("productCategory")
        .value = product.category;

    document.getElementById("productQuantity")
        .value = product.quantity;

    document.getElementById("productPrice")
        .value = product.price;


    // Product ID cannot be changed while editing

    document.getElementById("productId")
        .disabled = true;
}


// ======================================================
// UPDATE STOCK
// ======================================================

async function updateStock(id) {

    const product =
        products.find(
            product => product.id === id
        );

    if (!product) {
        return;
    }


    const newQuantity =
        prompt(
            `Enter new stock quantity for "${product.name}":`,
            product.quantity
        );


    // Cancel

    if (newQuantity === null) {
        return;
    }


    const quantity =
        Number(newQuantity);


    // Validation

    if (
        !Number.isInteger(quantity) ||
        quantity < 0
    ) {
        alert(
            "Please enter a valid non-negative whole number."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/${id}/stock`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        quantity: quantity
                    })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.error ||
                "Unable to update stock."
            );

            return;
        }


        alert(
            "Stock updated successfully!"
        );


        await loadProducts();


    } catch (error) {

        console.error("Stock error:", error);

        alert(
            "Unable to connect to Flask server."
        );
    }
}


// ======================================================
// DELETE PRODUCT
// ======================================================

async function deleteProduct(id) {

    const product =
        products.find(
            product => product.id === id
        );

    if (!product) {
        return;
    }


    const confirmed =
        confirm(
            `Are you sure you want to delete "${product.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.error ||
                "Unable to delete product."
            );

            return;
        }


        alert(
            "Product deleted successfully!"
        );


        await loadProducts();


    } catch (error) {

        console.error("Delete error:", error);

        alert(
            "Unable to connect to Flask server."
        );
    }
}


// ======================================================
// SEARCH PRODUCTS
// ======================================================

async function searchProducts() {

    const query =
        document.getElementById("searchInput")
            .value
            .trim();


    // Empty search → show all products

    if (query === "") {

        displayProducts(products);

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/search?q=${encodeURIComponent(query)}`
            );


        if (!response.ok) {
            throw new Error("Search failed");
        }


        const results =
            await response.json();


        displayProducts(results);


    } catch (error) {

        console.error("Search error:", error);

        alert("Search failed.");
    }
}


// ======================================================
// SIDEBAR NAVIGATION
// ======================================================

function showSection(section, element) {

    // Remove active state

    document.querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.remove("active");
        });


    // Set clicked item as active

    element.classList.add("active");


    // Dashboard

    if (section === "dashboard") {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // Products

    else if (section === "products") {

        const productsSection =
            document.getElementById("products");

        if (productsSection) {

            productsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    }
}


// ======================================================
// ADD PRODUCT FROM SIDEBAR
// ======================================================

function openAddProductFromNav(event, element) {

    // Prevent #add-product from appearing in URL

    event.preventDefault();


    // Remove active state

    document.querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.remove("active");
        });


    // Make Add Product active

    element.classList.add("active");


    // Open modal

    openAddModal();
}


// ======================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ======================================================

window.addEventListener("click", function(event) {

    const modal =
        document.getElementById("productModal");


    if (event.target === modal) {

        closeModal();
    }

});


// ======================================================
// INITIALIZE APPLICATION
// ======================================================

loadProducts();