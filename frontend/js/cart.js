const ORDER_API_URL = "https://freshnet-juice-ordering-web-app-production.up.railway.app/api/orders";

// Real shop WhatsApp number.
// Format: country code + number, no + sign.
const SHOP_WHATSAPP_NUMBER = "94776945474";

const cartItemsBox = document.getElementById("cartItems");
const cartTotalText = document.getElementById("cartTotal");
const checkoutTotalText = document.getElementById("checkoutTotal");
const clearCartBtn = document.getElementById("clearCartBtn");
const checkoutForm = document.getElementById("checkoutForm");

const deliveryTypeSelect = document.getElementById("deliveryType");
const paymentMethodSelect = document.getElementById("paymentMethod");
const paymentInfoBox = document.getElementById("paymentInfoBox");
const paymentReferenceInput = document.getElementById("paymentReference");

function getCart() {
  return JSON.parse(localStorage.getItem("freshnestCart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("freshnestCart", JSON.stringify(cart));
}

function calculateTotal(cart) {
  return cart.reduce((sum, item) => {
    return sum + Number(item.price) * Number(item.quantity);
  }, 0);
}

function updatePaymentOptions() {
  if (!deliveryTypeSelect || !paymentMethodSelect) return;

  const selectedDeliveryType = deliveryTypeSelect.value;

  if (selectedDeliveryType === "Pickup") {
    paymentMethodSelect.innerHTML = `
      <option value="Pay at Shop">Pay at Shop</option>
      <option value="Bank Transfer">Bank Transfer</option>
    `;
  } else {
    paymentMethodSelect.innerHTML = `
      <option value="Cash on Delivery">Cash on Delivery</option>
      <option value="Bank Transfer">Bank Transfer</option>
    `;
  }

  updatePaymentInfoBox();
}

function updatePaymentInfoBox() {
  if (!paymentMethodSelect || !paymentInfoBox) return;

  if (paymentMethodSelect.value === "Bank Transfer") {
    paymentInfoBox.style.display = "block";
  } else {
    paymentInfoBox.style.display = "none";

    if (paymentReferenceInput) {
      paymentReferenceInput.value = "";
    }
  }
}

function renderCart() {
  const cart = getCart();

  if (cart.length === 0) {
    cartItemsBox.innerHTML = `<p class="empty-cart">No items added yet.</p>`;
    cartTotalText.textContent = "0";
    checkoutTotalText.textContent = "0";
    return;
  }

  let total = 0;

  cartItemsBox.innerHTML = cart
    .map((item, index) => {
      const itemTotal = Number(item.price) * Number(item.quantity);
      total += itemTotal;

      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p>Rs. ${item.price} × ${item.quantity} = Rs. ${itemTotal}</p>
          </div>

          <div class="quantity-controls">
            <button onclick="decreaseQuantity(${index})">−</button>
            <span>${item.quantity}</span>
            <button onclick="increaseQuantity(${index})">+</button>
          </div>

          <button class="remove-btn" onclick="removeFromCart(${index})">
            Remove
          </button>
        </div>
      `;
    })
    .join("");

  cartTotalText.textContent = total;
  checkoutTotalText.textContent = total;
}

function increaseQuantity(index) {
  const cart = getCart();
  cart[index].quantity += 1;
  saveCart(cart);
  renderCart();
}

function decreaseQuantity(index) {
  const cart = getCart();

  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
  } else {
    cart.splice(index, 1);
  }

  saveCart(cart);
  renderCart();
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

function createWhatsAppMessage(orderData, totalAmount) {
  const itemsText = orderData.items
    .map((item) => {
      return `• ${item.name} x ${item.quantity} = Rs. ${
        Number(item.price) * Number(item.quantity)
      }`;
    })
    .join("\n");

  let paymentNote = "";

  if (orderData.paymentMethod === "Bank Transfer") {
    paymentNote = `
💳 Bank Transfer Details
Bank: Commercial Bank
Account Name: FreshNest Juice Bar
Account Number: 1234567890
Branch: Colombo
Payment Reference: ${orderData.paymentReference || "Not provided"}

📌 I will send the bank slip here for confirmation.
`;
  }

  return `
🍃 FreshNest Order Confirmation

Hello FreshNest, I would like to confirm my order.

👤 Customer Details
Name: ${orderData.customerName}
Phone: ${orderData.phoneNumber}
Address: ${orderData.address || "Not provided"}

🚚 Order Type
Delivery Type: ${orderData.deliveryType}
Payment Method: ${orderData.paymentMethod}

🧃 Ordered Items
${itemsText}

💰 Total Amount: Rs. ${totalAmount}

${paymentNote}

Thank you.
  `.trim();
}

if (deliveryTypeSelect) {
  deliveryTypeSelect.addEventListener("change", updatePaymentOptions);
}

if (paymentMethodSelect) {
  paymentMethodSelect.addEventListener("change", updatePaymentInfoBox);
}

if (clearCartBtn) {
  clearCartBtn.addEventListener("click", () => {
    const confirmClear = confirm("Are you sure you want to clear the cart?");
    if (!confirmClear) return;

    localStorage.removeItem("freshnestCart");
    renderCart();
  });
}

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const cart = getCart();

  if (cart.length === 0) {
    alert("Your cart is empty. Please add items before placing an order.");
    return;
  }

  const customerName = document.getElementById("customerName").value.trim();
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  const address = document.getElementById("address").value.trim();
  const deliveryType = deliveryTypeSelect.value;
  const paymentMethod = paymentMethodSelect.value;

  const paymentReference = paymentReferenceInput
    ? paymentReferenceInput.value.trim()
    : "";

  if (!customerName || !phoneNumber) {
    alert("Please enter your name and phone number.");
    return;
  }

  if (phoneNumber.length < 9) {
    alert("Please enter a valid phone number.");
    return;
  }

  if (deliveryType === "Delivery" && !address) {
    alert("Please enter delivery address.");
    return;
  }

  if (deliveryType === "Pickup" && paymentMethod === "Cash on Delivery") {
    alert("Cash on Delivery is not available for Pickup.");
    updatePaymentOptions();
    return;
  }

  const orderData = {
    customerName,
    phoneNumber,
    address,
    deliveryType,
    paymentMethod,
    paymentReference,
    items: cart,
  };

  const totalAmount = calculateTotal(cart);

  // Open a blank tab immediately to avoid browser popup blocking.
  const whatsappWindow = window.open("", "_blank");

  try {
    const response = await fetch(ORDER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      if (whatsappWindow) {
        whatsappWindow.close();
      }

      alert(data.message || "Failed to place order.");
      return;
    }

    const whatsappMessage = createWhatsAppMessage(orderData, totalAmount);
    const whatsappUrl = `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    alert(
      "Order placed successfully!\n\nYour order has been saved.\nWhatsApp confirmation is opening now.\nPlease tap Send to confirm with FreshNest."
    );

    localStorage.removeItem("freshnestCart");
    checkoutForm.reset();

    updatePaymentOptions();
    renderCart();

    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappUrl;
    } else {
      window.location.href = whatsappUrl;
    }
  } catch (error) {
    if (whatsappWindow) {
      whatsappWindow.close();
    }

    console.error("Order error:", error);
    alert("Backend connection failed. Make sure server is running.");
  }
});

updatePaymentOptions();
renderCart();