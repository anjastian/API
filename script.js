const API_URL = "https://jsonplaceholder.typicode.com/posts";
const LIMIT = 10;

const container = document.getElementById("posts-container");
const modal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const toastContainer = document.getElementById("toast-container");
const responsePreview = document.getElementById("response-preview");

// ============================================================
// Toast Notification
// ============================================================
function showToast(message, type = "success") {
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ""}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}

// ============================================================
// Loading & Error UI
// ============================================================
function showLoading() {
  container.innerHTML = `
    <div class="loader">
      <div class="spinner"></div>
      <span>Memuat data dari API...</span>
    </div>
  `;
}

function showError(message) {
  container.innerHTML = `
    <div class="error-msg">
      ⚠️ ${message}
    </div>
  `;
}

// ============================================================
// Render Posts
// ============================================================
function renderPosts(posts) {
  const listHTML = posts
    .map(
      (post, index) => `
      <article class="post-card" id="post-${post.id}" style="animation-delay: ${index * 0.07}s">
        <div class="post-header">
          <span class="post-number">${post.id}</span>
        </div>
        <h2 class="post-title">${post.title}</h2>
        <p class="post-body">${post.body}</p>
        <div class="post-footer">
          <div class="post-meta">
            <span class="badge">User ${post.userId}</span>
            <span>•</span>
            <span>Post #${post.id}</span>
          </div>
          <div class="post-actions">
            <button class="btn btn-put" onclick="openEditModal(${post.id}, 'PUT')" title="Update seluruh data (PUT)">
              ✏️ PUT
            </button>
            <button class="btn btn-patch" onclick="openEditModal(${post.id}, 'PATCH')" title="Update sebagian data (PATCH)">
              🔧 PATCH
            </button>
            <button class="btn btn-delete" onclick="deletePost(${post.id})" title="Hapus post (DELETE)">
              🗑️ DELETE
            </button>
          </div>
        </div>
      </article>
    `
    )
    .join("");

  container.innerHTML = `<div class="posts-list">${listHTML}</div>`;
}

// ============================================================
// GET — Fetch Posts
// ============================================================
async function fetchPosts() {
  showLoading();

  try {
    const response = await fetch(`${API_URL}?_limit=${LIMIT}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const posts = await response.json();
    renderPosts(posts);
    showToast(`Berhasil memuat ${posts.length} post (GET)`, "success");
  } catch (error) {
    console.error("Gagal mengambil data:", error);
    showError("Gagal memuat data. Periksa koneksi internet Anda dan coba lagi.");
    showToast("Gagal memuat data dari API", "error");
  }
}

// ============================================================
// DELETE — Hapus Post
// ============================================================
async function deletePost(id) {
  const card = document.getElementById(`post-${id}`);

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    showToast(`Post #${id} berhasil dihapus (DELETE — Status ${response.status})`, "success");

    // Animate card removal
    if (card) {
      card.classList.add("deleted");
      setTimeout(() => card.remove(), 450);
    }
  } catch (error) {
    console.error("Gagal menghapus:", error);
    showToast(`Gagal menghapus Post #${id}`, "error");
  }
}

// ============================================================
// Modal — Open / Close
// ============================================================
function openEditModal(id, method) {
  const card = document.getElementById(`post-${id}`);
  const title = card.querySelector(".post-title").textContent;
  const body = card.querySelector(".post-body").textContent;

  document.getElementById("edit-post-id").value = id;
  document.getElementById("edit-method").value = method;
  document.getElementById("edit-title").value = title;
  document.getElementById("edit-body").value = body;

  // Update modal UI based on method
  const modalTitle = document.getElementById("modal-title");
  const methodBadge = document.getElementById("modal-method-badge");

  if (method === "PUT") {
    modalTitle.textContent = "Update Post (PUT)";
    methodBadge.textContent = "PUT — Replace seluruh data";
    methodBadge.className = "modal-method put";
  } else {
    modalTitle.textContent = "Patch Post (PATCH)";
    methodBadge.textContent = "PATCH — Update sebagian data";
    methodBadge.className = "modal-method patch";
  }

  // Reset response preview
  responsePreview.classList.remove("visible");
  responsePreview.innerHTML = "";

  // Show modal
  modal.classList.add("active");
}

function closeModal() {
  modal.classList.remove("active");
}

// Close modal on overlay click
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// Close modal on cancel button
document.getElementById("btn-modal-cancel").addEventListener("click", closeModal);

// Close modal on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ============================================================
// PUT / PATCH — Submit Form
// ============================================================
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("edit-post-id").value;
  const method = document.getElementById("edit-method").value;
  const title = document.getElementById("edit-title").value.trim();
  const body = document.getElementById("edit-body").value.trim();
  const submitBtn = document.getElementById("btn-modal-submit");

  if (!title || !body) {
    showToast("Judul dan isi tidak boleh kosong", "error");
    return;
  }

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";

  // Build request body
  const requestBody =
    method === "PUT"
      ? { id: Number(id), title, body, userId: 1 }
      : { title, body };

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: method,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();

    // Show response preview inside modal
    responsePreview.innerHTML = `
      <div class="response-label status-ok">✅ Response — ${response.status} ${response.statusText}</div>
${JSON.stringify(data, null, 2)}
    `;
    responsePreview.classList.add("visible");

    // Update the card in the DOM
    const card = document.getElementById(`post-${id}`);
    if (card) {
      card.querySelector(".post-title").textContent = data.title || title;
      card.querySelector(".post-body").textContent = data.body || body;
    }

    showToast(`Post #${id} berhasil di-update (${method} — Status ${response.status})`, "success");
  } catch (error) {
    console.error(`Gagal ${method}:`, error);

    responsePreview.innerHTML = `
      <div class="response-label status-err">❌ Error</div>
${error.message}
    `;
    responsePreview.classList.add("visible");

    showToast(`Gagal meng-update Post #${id}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Simpan";
  }
});

// ============================================================
// Initialize
// ============================================================
fetchPosts();
