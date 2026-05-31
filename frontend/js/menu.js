const API_URL = "http://localhost:5000/api/juices";

console.log("menu.js loaded");

const cartCountText = document.getElementById("cartCount");
const filterButtons = document.querySelectorAll(".filter-btn");
const menuProductsBox = document.getElementById("menuProducts");

let allJuices = [];

function getCart() {
  return JSON.parse(localStorage.getItem("freshnestCart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("freshnestCart", JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();

  if (cartCountText) {
    cartCountText.textContent = cart.reduce((sum, item) => {
      return sum + item.quantity;
    }, 0);
  }
}

function addToCart(name, price) {
  let cart = getCart();

  const existingItem = cart.find((item) => item.name === name);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      name: name,
      price: price,
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartCount();

  alert(`${name} added to cart!`);
}

function renderProducts(products) {
  console.log("Rendering products:", products);

  if (!menuProductsBox) {
    console.error("menuProducts div not found in menu.html");
    return;
  }

  if (!products || products.length === 0) {
    menuProductsBox.innerHTML = `
      <p class="empty-cart">No products available yet. Add products from admin page.</p>
    `;
    return;
  }

  menuProductsBox.innerHTML = products
    .map((juice) => {
      const imagePath = juice.image || "images/juice-bottles.png";

      return `
        <div class="product-card menu-product" data-category="${juice.category}">
          <div class="product-img">
            <img src="${imagePath}" alt="${juice.name}">
          </div>

          <h3>${juice.name}</h3>
          <p>${juice.description}</p>

          <div class="product-bottom">
            <span>Rs. ${juice.price}</span>
            <button 
              class="add-btn" 
              onclick="addToCart('${juice.name}', ${juice.price})"
            >
              Add
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function fetchJuices() {
  try {
    console.log("Fetching juices from backend...");

    const response = await fetch(API_URL);
    const juices = await response.json();

    console.log("Fetched juices:", juices);

    allJuices = juices.filter((juice) => juice.isAvailable !== false);
    renderProducts(allJuices);
  } catch (error) {
    if (menuProductsBox) {
      menuProductsBox.innerHTML = `
        <p class="empty-cart">Failed to load products. Check backend server.</p>
      `;
    }

    console.error("Fetch error:", error);
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const category = button.dataset.category;

    if (category === "all") {
      renderProducts(allJuices);
      return;
    }

    const filteredProducts = allJuices.filter((juice) => {
      return juice.category === category;
    });

    renderProducts(filteredProducts);
  });
});

updateCartCount();
fetchJuices();