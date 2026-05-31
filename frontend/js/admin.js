const adminToken = localStorage.getItem("freshnestAdminToken");

if (!adminToken) {
  window.location.href = "login.html";
}

const BASE_API_URL =
  "https://freshnet-juice-ordering-web-app-production.up.railway.app";

const JUICE_API_URL = `${BASE_API_URL}/api/juices`;
const ORDER_API_URL = `${BASE_API_URL}/api/orders`;
const CHANGE_PASSWORD_API_URL = `${BASE_API_URL}/api/auth/change-password`;

const juiceForm = document.getElementById("juiceForm");
const adminProductList = document.getElementById("adminProductList");
const adminOrdersList = document.getElementById("adminOrdersList");
const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");
const logoutBtn = document.getElementById("logoutBtn");

const formTitle = document.getElementById("formTitle");
const editingJuiceId = document.getElementById("editingJuiceId");
const submitJuiceBtn = document.getElementById("submitJuiceBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const changePasswordForm = document.getElementById("changePasswordForm");

const authHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${adminToken}`,
};

function logoutAdmin() {
  localStorage.removeItem("freshnestAdminToken");
  localStorage.removeItem("freshnestAdminName");
  localStorage.removeItem("freshnestAdminEmail");
  window.location.href = "login.html";
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutAdmin);
}

/* =====================
   CUSTOMER CONTACT HELPERS
===================== */
function formatPhoneForWhatsApp(phone) {
  let cleaned = String(phone).replace(/\D/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "94" + cleaned.substring(1);
  } else if (!cleaned.startsWith("94")) {
    cleaned = "94" + cleaned;
  }

  return cleaned;
}

function createCustomerMessage(order) {
  const itemsText = order.items
    .map((item) => {
      return `• ${item.name} x ${item.quantity} = Rs. ${
        Number(item.price) * Number(item.quantity)
      }`;
    })
    .join("\n");

  let paymentReferenceText = "";

  if (order.paymentReference) {
    paymentReferenceText = `Payment Reference: ${order.paymentReference}\n`;
  }

  return `
Hello ${order.customerName},

Your FreshNest order has been received.

🧃 Ordered Items
${itemsText}

Order Status: ${order.status}
Total Amount: Rs. ${order.totalAmount}
Payment Method: ${order.paymentMethod || "Cash on Delivery"}
${paymentReferenceText}Delivery Type: ${order.deliveryType || "Delivery"}

We will contact you shortly.

Thank you,
FreshNest
  `.trim();
}

function openCustomerWhatsApp(phone, message) {
  const whatsappNumber = formatPhoneForWhatsApp(phone);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  window.open(whatsappUrl, "_blank");
}

function openCustomerSMS(phone, message) {
  const cleanedPhone = String(phone).replace(/\s/g, "");
  const isAppleDevice = /iPhone|iPad|iPod|Macintosh/i.test(
    navigator.userAgent
  );

  const smsUrl = isAppleDevice
    ? `sms:${cleanedPhone}&body=${encodeURIComponent(message)}`
    : `sms:${cleanedPhone}?body=${encodeURIComponent(message)}`;

  window.location.href = smsUrl;
}

/* =====================
   PRODUCTS
===================== */
async function fetchJuices() {
  try {
    const response = await fetch(JUICE_API_URL);
    const juices = await response.json();

    if (juices.length === 0) {
      adminProductList.innerHTML = `<p class="empty-cart">No products added yet.</p>`;
      return;
    }

    adminProductList.innerHTML = juices
      .map((juice) => {
        return `
          <div class="admin-product-card">
            <div>
              <h3>${juice.name}</h3>
              <p>${juice.category} • Rs. ${juice.price}</p>
              <span>${juice.description}</span>

              <div class="availability-line">
                Status:
                <strong class="${
                  juice.isAvailable ? "available-text" : "unavailable-text"
                }">
                  ${juice.isAvailable ? "Available" : "Unavailable"}
                </strong>
              </div>
            </div>

            <div class="admin-product-actions">
              <button class="edit-btn" onclick='startEditProduct(${JSON.stringify(
                juice
              )})'>
                Edit
              </button>

              <button class="availability-btn" onclick="toggleAvailability('${
                juice._id
              }', ${!juice.isAvailable})">
                ${juice.isAvailable ? "Mark Unavailable" : "Mark Available"}
              </button>

              <button class="delete-btn" onclick="deleteJuice('${juice._id}')">
                Delete
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    adminProductList.innerHTML = `<p class="empty-cart">Failed to load products.</p>`;
    console.error("Product fetch error:", error);
  }
}

juiceForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const juiceData = {
    name: document.getElementById("juiceName").value.trim(),
    category: document.getElementById("juiceCategory").value,
    price: Number(document.getElementById("juicePrice").value),
    description: document.getElementById("juiceDescription").value.trim(),
    image: document.getElementById("juiceImage").value.trim(),
  };

  const editId = editingJuiceId.value;

  try {
    const url = editId ? `${JUICE_API_URL}/${editId}` : JUICE_API_URL;
    const method = editId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: authHeaders,
      body: JSON.stringify(juiceData),
    });

    const data = await response.json();

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      logoutAdmin();
      return;
    }

    if (!response.ok) {
      alert(data.message || "Failed to save product.");
      return;
    }

    alert(editId ? "Product updated successfully!" : "Juice added successfully!");

    resetProductForm();
    fetchJuices();
  } catch (error) {
    alert("Backend connection failed.");
    console.error("Product save error:", error);
  }
});

function startEditProduct(juice) {
  editingJuiceId.value = juice._id;

  document.getElementById("juiceName").value = juice.name;
  document.getElementById("juiceCategory").value = juice.category;
  document.getElementById("juicePrice").value = juice.price;
  document.getElementById("juiceDescription").value = juice.description;
  document.getElementById("juiceImage").value = juice.image || "";

  formTitle.textContent = "Edit Juice";
  submitJuiceBtn.textContent = "Update Juice";
  cancelEditBtn.style.display = "block";

  window.scrollTo({
    top: juiceForm.offsetTop - 100,
    behavior: "smooth",
  });
}

function resetProductForm() {
  juiceForm.reset();
  editingJuiceId.value = "";
  formTitle.textContent = "Add New Juice";
  submitJuiceBtn.textContent = "Add Juice";
  cancelEditBtn.style.display = "none";
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", resetProductForm);
}

async function toggleAvailability(id, newStatus) {
  try {
    const response = await fetch(`${JUICE_API_URL}/${id}/availability`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ isAvailable: newStatus }),
    });

    const data = await response.json();

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      logoutAdmin();
      return;
    }

    if (!response.ok) {
      alert(data.message || "Failed to update availability.");
      return;
    }

    fetchJuices();
  } catch (error) {
    alert("Failed to update availability.");
    console.error("Availability update error:", error);
  }
}

async function deleteJuice(id) {
  const confirmDelete = confirm("Are you sure you want to delete this juice?");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${JUICE_API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      logoutAdmin();
      return;
    }

    if (!response.ok) {
      alert("Failed to delete product.");
      return;
    }

    fetchJuices();
  } catch (error) {
    alert("Failed to delete juice.");
    console.error("Product delete error:", error);
  }
}

/* =====================
   ORDERS
===================== */
async function fetchOrders() {
  try {
    const response = await fetch(ORDER_API_URL, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const orders = await response.json();

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      logoutAdmin();
      return;
    }

    if (orders.length === 0) {
      adminOrdersList.innerHTML = `<p class="empty-cart">No orders placed yet.</p>`;
      return;
    }

    adminOrdersList.innerHTML = orders
      .map((order) => {
        const itemsHTML = order.items
          .map((item) => {
            return `<li>${item.name} — Rs. ${item.price} × ${item.quantity}</li>`;
          })
          .join("");

        const orderDate = new Date(order.createdAt).toLocaleString();
        const customerMessage = createCustomerMessage(order);

        return `
          <div class="admin-order-card">
            <div class="order-top-row">
              <div>
                <h3>${order.customerName}</h3>
                <p>${order.phoneNumber}</p>
              </div>

              <span class="order-status ${order.status.toLowerCase()}">
                ${order.status}
              </span>
            </div>

            <div class="order-details">
              <p><strong>Address:</strong> ${
                order.address || "Not provided"
              }</p>
              <p><strong>Delivery Type:</strong> ${
                order.deliveryType || "Delivery"
              }</p>
              <p><strong>Payment Method:</strong> ${
                order.paymentMethod || "Cash on Delivery"
              }</p>
              ${
                order.paymentReference
                  ? `<p><strong>Payment Reference:</strong> ${order.paymentReference}</p>`
                  : ""
              }
              <p><strong>Date:</strong> ${orderDate}</p>
            </div>

            <div class="order-items">
              <h4>Items</h4>
              <ul>${itemsHTML}</ul>
            </div>

            <div class="admin-contact-actions">
              <button 
                class="whatsapp-customer-btn"
                data-phone="${order.phoneNumber}"
                data-message="${encodeURIComponent(customerMessage)}">
                WhatsApp Customer
              </button>

              <button 
                class="sms-customer-btn"
                data-phone="${order.phoneNumber}"
                data-message="${encodeURIComponent(customerMessage)}">
                SMS Customer
              </button>
            </div>

            <div class="order-bottom-row">
              <h4>Total: Rs. ${order.totalAmount}</h4>

              <select onchange="updateOrderStatus('${order._id}', this.value)">
                <option value="Pending" ${
                  order.status === "Pending" ? "selected" : ""
                }>Pending</option>
                <option value="Preparing" ${
                  order.status === "Preparing" ? "selected" : ""
                }>Preparing</option>
                <option value="Delivered" ${
                  order.status === "Delivered" ? "selected" : ""
                }>Delivered</option>
                <option value="Cancelled" ${
                  order.status === "Cancelled" ? "selected" : ""
                }>Cancelled</option>
              </select>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    adminOrdersList.innerHTML = `<p class="empty-cart">Failed to load orders.</p>`;
    console.error("Order fetch error:", error);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`${ORDER_API_URL}/${orderId}/status`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await response.json();

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      logoutAdmin();
      return;
    }

    if (!response.ok) {
      alert(data.message || "Failed to update order status.");
      return;
    }

    fetchOrders();
  } catch (error) {
    alert("Failed to update order status.");
    console.error("Status update error:", error);
  }
}

/* =====================
   CHANGE PASSWORD
===================== */
if (changePasswordForm) {
  changePasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentPassword = document
      .getElementById("currentPassword")
      .value.trim();

    const newPassword = document.getElementById("newPassword").value.trim();

    const confirmNewPassword = document
      .getElementById("confirmNewPassword")
      .value.trim();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      const response = await fetch(CHANGE_PASSWORD_API_URL, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        logoutAdmin();
        return;
      }

      if (!response.ok) {
        alert(data.message || "Failed to change password.");
        return;
      }

      alert("Password changed successfully. Please login again.");

      changePasswordForm.reset();
      logoutAdmin();
    } catch (error) {
      console.error("Change password error:", error);
      alert("Backend connection failed.");
    }
  });
}

/* =====================
   CONTACT BUTTON EVENTS
===================== */
adminOrdersList.addEventListener("click", (event) => {
  const target = event.target;

  if (target.classList.contains("whatsapp-customer-btn")) {
    const phone = target.dataset.phone;
    const message = decodeURIComponent(target.dataset.message);
    openCustomerWhatsApp(phone, message);
  }

  if (target.classList.contains("sms-customer-btn")) {
    const phone = target.dataset.phone;
    const message = decodeURIComponent(target.dataset.message);
    openCustomerSMS(phone, message);
  }
});

refreshOrdersBtn.addEventListener("click", fetchOrders);

/* =====================
   INITIAL LOAD
===================== */
resetProductForm();
fetchJuices();
fetchOrders();