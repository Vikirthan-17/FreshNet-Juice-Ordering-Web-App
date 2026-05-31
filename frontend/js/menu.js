console.log("menu.js loaded");

const API_URL =
  "https://freshnet-juice-ordering-web-app-production.up.railway.app/api/juices";

const menuProducts = document.getElementById("menuProducts");
const filterButtons = document.querySelectorAll(".filter-btn");
const cartCount = document.getElementById("cartCount");

let allProducts = [];

function getCart() {
  return JSON.parse(localStorage.getItem("freshnestCart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("freshnestCart", JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();

  const totalQuantity = cart.reduce((sum, item) => {
    return sum + Number(item.quantity);
  }, 0);

  if (cartCount) {
    cartCount.textContent = totalQuantity;
  }
}

function addToCart(product) {
  const cart = getCart();

  const existingProduct = cart.find((item) => item.name === product.name);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      name: product.name,
      price: Number(product.price),
      category: product.category,
      description: product.description,
      image: product.image,
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartCount();

  alert(`${product.name} added to cart!`);
}

function renderProducts(products) {
  if (!products || products.length === 0) {
    menuProducts.innerHTML = `
      <p class="empty-cart">No products available.</p>
    `;
    return;
  }

  menuProducts.innerHTML = products
    .map((product) => {
      return `
        <div class="product-card">
          <div class="product-img">
            <img src="${product.image}" alt="${product.name}">
          </div>

          <h3>${product.name}</h3>
          <p>${product.description}</p>

          <div class="product-bottom">
            <span>Rs. ${product.price}</span>
            <button class="add-btn" data-id="${product._id}">
              Add
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  const addButtons = document.querySelectorAll(".add-btn");

  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.dataset.id;
      const selectedProduct = allProducts.find(
        (product) => product._id === productId
      );

      if (selectedProduct) {
        addToCart(selectedProduct);
      }
    });
  });
}

async function fetchProducts() {
  try {
    console.log("Fetching juices from backend...");

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const products = await response.json();

    allProducts = products.filter((product) => product.isAvailable);

    renderProducts(allProducts);
  } catch (error) {
    console.error("Fetch error:", error);

    menuProducts.innerHTML = `
      <p class="empty-cart">Failed to load products. Check backend server.</p>
    `;
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const selectedCategory = button.dataset.category;

    if (selectedCategory === "all") {
      renderProducts(allProducts);
      return;
    }

    const filteredProducts = allProducts.filter((product) => {
      return product.category.toLowerCase() === selectedCategory.toLowerCase();
    });

    renderProducts(filteredProducts);
  });
});

fetchProducts();
updateCartCount();