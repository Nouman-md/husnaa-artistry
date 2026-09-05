/* =========================================================
   HUSNA ARTISTRY — COMPLETE SCRIPT
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const WHATSAPP_NUMBER = "919391119262";
const BUSINESS_EMAIL = "aliyasoughat.k@gmail.com";

/* =========================================================
   GLOBAL STATE
   ========================================================= */

let products = [];
let categories = [];

let cart = loadLocal("husna_cart", []);
let wishlist = loadLocal("husna_wishlist", []);

let currentUser = null;

let currentFilter = "all";
let currentSearch = "";
let currentSort = "newest";
let currentMinPrice = "";
let currentMaxPrice = "";

let activeProduct = null;
let activeSize = null;
let activeGalleryIndex = 0;

/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadLocal(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        return fallback;
    }
}

function saveLocal(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("Local storage error:", error);
    }
}

/* =========================================================
   SAFE HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
}

function formatPrice(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "success") {
    const container = $("toastContainer");

    if (!container) {
        alert(message);
        return;
    }

    const toast = document.createElement("div");

    toast.className =
        "toast" + (type === "error" ? " error" : "");

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("leaving");

        setTimeout(() => {
            toast.remove();
        }, 350);
    }, 2800);
}

/* =========================================================
   LOADING SCREEN
   ========================================================= */

window.addEventListener("load", () => {
    setTimeout(() => {
        const loading = $("loadingScreen");

        if (loading) {
            loading.classList.add("hidden");
        }
    }, 800);
});

/* =========================================================
   THEME
   ========================================================= */
function applyTheme(theme) {
    document.documentElement.setAttribute(
        "data-theme",
        theme
    );

    const heroArtworkImage = $("heroArtworkImage");

    if (heroArtworkImage) {
        heroArtworkImage.src =
            theme === "dark"
                ? "assets/hero-islamic-calligraphy-art.png"
                : "assets/hero-islamic-calligraphy-art-white.png";
    }

    saveLocal("husna_theme", theme);
}

function initTheme() {
    const savedTheme = loadLocal("husna_theme", null);

    if (savedTheme) {
        applyTheme(savedTheme);
    }
}

initTheme();

const darkModeBtn = $("darkModeBtn");

if (darkModeBtn) {
    darkModeBtn.addEventListener("click", () => {

        const current =
            document.documentElement.getAttribute(
                "data-theme"
            ) || "light";

        applyTheme(
            current === "dark"
                ? "light"
                : "dark"
        );
    });
}

/* =========================================================
   NAVBAR
   ========================================================= */

const navbar = $("navbar");

if (navbar) {
    window.addEventListener("scroll", () => {
        navbar.classList.toggle(
            "scrolled",
            window.scrollY > 20
        );
    });
}

/* =========================================================
   SIDEBAR
   ========================================================= */

const sidebar = $("sidebar");
const sidebarOverlay = $("sidebarOverlay");
const hamburgerBtn = $("hamburgerBtn");
const closeSidebar = $("closeSidebar");

function openSidebar() {

    if (!sidebar) return;

    sidebar.classList.add("active");

    if (sidebarOverlay) {
        sidebarOverlay.classList.add("active");
    }

    document.body.classList.add("sidebar-open");
}

function closeSidebarFn() {

    if (sidebar) {
        sidebar.classList.remove("active");
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("active");
    }

    document.body.classList.remove("sidebar-open");
}

if (hamburgerBtn) {
    hamburgerBtn.addEventListener(
        "click",
        openSidebar
    );
}

if (closeSidebar) {
    closeSidebar.addEventListener(
        "click",
        closeSidebarFn
    );
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener(
        "click",
        closeSidebarFn
    );
}

/* Sidebar navigation */

document.querySelectorAll(".sidebar-link").forEach(link => {

    link.addEventListener("click", () => {

        closeSidebarFn();

        const target = link.getAttribute("href");

        if (
            target &&
            target.startsWith("#")
        ) {
            setTimeout(() => {

                const section =
                    document.querySelector(target);

                if (section) {
                    section.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }

            }, 100);
        }
    });
});

document.getElementById("sidebarWishlistBtn")?.addEventListener("click", () => {
    closeSidebarFn();
    renderWishlist();
    openDrawer("wishlistDrawer", "wishlistOverlay");
});

document.getElementById("sidebarCartBtn")?.addEventListener("click", () => {
    closeSidebarFn();
    renderCart();
    openDrawer("cartDrawer", "cartOverlay");
});

document.getElementById("sidebarAccountBtn")?.addEventListener("click", () => {
    closeSidebarFn();

    if (typeof getToken === "function" && getToken()) {
        openModal("accountModal");
        loadAccountTab("profile");
    } else {
        openModal("loginModal");
    }
});

document.getElementById("sidebarOrdersLink")?.addEventListener("click", (event) => {
    event.preventDefault();

    closeSidebarFn();

    if (typeof getToken === "function" && getToken()) {
        openModal("accountModal");
        loadAccountTab("orders");
    } else {
        openModal("loginModal");
    }
});
/* =========================================================
   NORMAL NAVIGATION
   ========================================================= */

document.querySelectorAll(
    '.navbar-links a, .footer-col a[href^="#"]'
).forEach(link => {

    link.addEventListener("click", event => {

        const href =
            link.getAttribute("href");

        if (!href || !href.startsWith("#")) {
            return;
        }

        const target =
            document.querySelector(href);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});

/* =========================================================
   MODALS
   ========================================================= */

function openModal(id) {

    const modal = $(id);

    if (!modal) {
        console.warn(
            "Modal not found:",
            id
        );
        return;
    }

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add("modal-open");
}

function closeModal(id) {

    const modal = $(id);

    if (!modal) return;

    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    const anyModal =
        document.querySelector(
            ".modal-overlay.active"
        );

    if (!anyModal) {
        document.body.classList.remove(
            "modal-open"
        );
    }
}

/* Close buttons */

document.querySelectorAll(
    "[data-close]"
).forEach(button => {

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeModal(
                button.dataset.close
            );
        }
    );
});

/* Click outside modal */

document.querySelectorAll(
    ".modal-overlay"
).forEach(overlay => {

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {
                closeModal(overlay.id);
            }
        }
    );
});

/* Switch Login/Register */

document.querySelectorAll(
    "[data-switch]"
).forEach(link => {

    link.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const current =
                link.closest(
                    ".modal-overlay"
                );

            if (current) {
                closeModal(current.id);
            }

            openModal(
                link.dataset.switch
            );
        }
    );
});

/* ESC */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        closeSidebarFn();

        document
            .querySelectorAll(
                ".modal-overlay.active"
            )
            .forEach(modal => {
                closeModal(modal.id);
            });

        closeAllDrawers();
    }
);

/* =========================================================
   DRAWERS
   ========================================================= */

function openDrawer(drawerId, overlayId) {

    const drawer = $(drawerId);
    const overlay = $(overlayId);

    if (!drawer) return;

    drawer.classList.add("active");

    if (overlay) {
        overlay.classList.add("active");
    }

    document.body.classList.add(
        "drawer-open"
    );
}

function closeDrawer(drawerId, overlayId) {

    const drawer = $(drawerId);
    const overlay = $(overlayId);

    if (drawer) {
        drawer.classList.remove("active");
    }

    if (overlay) {
        overlay.classList.remove("active");
    }

    const anyDrawer =
        document.querySelector(
            ".drawer.active"
        );

    if (!anyDrawer) {
        document.body.classList.remove(
            "drawer-open"
        );
    }
}

function closeAllDrawers() {

    closeDrawer(
        "cartDrawer",
        "cartOverlay"
    );

    closeDrawer(
        "wishlistDrawer",
        "wishlistOverlay"
    );
}

/* CART BUTTON */

const cartBtn = $("cartBtn");

if (cartBtn) {

    cartBtn.addEventListener(
        "click",
        () => {

            renderCart();

            openDrawer(
                "cartDrawer",
                "cartOverlay"
            );
        }
    );
}

/* WISHLIST BUTTON */

const wishlistBtn = $("wishlistBtn");

if (wishlistBtn) {

    wishlistBtn.addEventListener(
        "click",
        () => {

            renderWishlist();

            openDrawer(
                "wishlistDrawer",
                "wishlistOverlay"
            );
        }
    );
}

/* Drawer close buttons */

document.querySelectorAll(
    "[data-close-drawer]"
).forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const drawer =
                button.dataset.closeDrawer;

            if (drawer === "cartDrawer") {

                closeDrawer(
                    "cartDrawer",
                    "cartOverlay"
                );

            } else if (
                drawer === "wishlistDrawer"
            ) {

                closeDrawer(
                    "wishlistDrawer",
                    "wishlistOverlay"
                );
            }
        }
    );
});

/* Explicit close IDs */

const cartClose = $("cartClose");

if (cartClose) {
    cartClose.addEventListener(
        "click",
        () =>
            closeDrawer(
                "cartDrawer",
                "cartOverlay"
            )
    );
}

const wishlistClose = $("wishlistClose");

if (wishlistClose) {
    wishlistClose.addEventListener(
        "click",
        () =>
            closeDrawer(
                "wishlistDrawer",
                "wishlistOverlay"
            )
    );
}

/* Drawer overlays */

const cartOverlay = $("cartOverlay");

if (cartOverlay) {

    cartOverlay.addEventListener(
        "click",
        () =>
            closeDrawer(
                "cartDrawer",
                "cartOverlay"
            )
    );
}

const wishlistOverlay = $(
    "wishlistOverlay"
);

if (wishlistOverlay) {

    wishlistOverlay.addEventListener(
        "click",
        () =>
            closeDrawer(
                "wishlistDrawer",
                "wishlistOverlay"
            )
    );
}

/* =========================================================
   ACCOUNT
   ========================================================= */

const accountBtn = $("accountBtn");

if (accountBtn) {

    accountBtn.addEventListener(
        "click",
        () => {

            if (
                typeof getToken === "function" &&
                getToken()
            ) {

                openModal("accountModal");

                loadAccountTab(
                    "profile"
                );

            } else {

                openModal("loginModal");
            }
        }
    );
}

/* =========================================================
   SIDEBAR LOGIN / REGISTER
   ========================================================= */

document.querySelectorAll(
    "[data-open]"
).forEach(button => {

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const modalId =
                button.dataset.open;

            closeSidebarFn();

            openModal(modalId);
        }
    );
});

/* =========================================================
   API CHECK
   ========================================================= */

function apiAvailable() {

    return (
        typeof apiFetch === "function"
    );
}

/* =========================================================
   LOAD CATEGORIES
   ========================================================= */

async function loadCategories() {

    if (!apiAvailable()) {

        console.error(
            "apiFetch() not found. Make sure api.js loads before script.js."
        );

        return;
    }

    try {

        const result =
            await apiFetch(
                "/categories"
            );

        categories =
            Array.isArray(result)
                ? result
                : [];

        renderCategoryFilters();

    } catch (error) {

        console.error(
            "Category loading failed:",
            error
        );

        renderCategoryFilters();
    }
}

/* =========================================================
   CATEGORY FILTERS
   ========================================================= */

function renderCategoryFilters() {

    const container =
        $("categoryFilters");

    const sidebarCats =
        $("sidebarCategories");

    /* Main collection filters */

    if (container) {

        container.innerHTML =
            `<button
                class="filter-chip active"
                data-category="all">
                All
            </button>` +

            categories.map(
                category =>
                    `<button
                        class="filter-chip"
                        data-category="${escapeHtml(category.name)}">
                        ${escapeHtml(category.name)}
                    </button>`
            ).join("");

        container
            .querySelectorAll(
                ".filter-chip"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        container
                            .querySelectorAll(
                                ".filter-chip"
                            )
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );

                        button.classList.add(
                            "active"
                        );

                        currentFilter =
                            button.dataset.category;

                        loadProducts();
                    }
                );
            });
    }

    /* Sidebar categories */

    if (sidebarCats) {

        if (!categories.length) {

            sidebarCats.innerHTML =
                `<p class="sidebar-empty">
                    No categories yet
                </p>`;

            return;
        }

        sidebarCats.innerHTML =
            `<button
                class="sidebar-category active"
                data-category="all">
                All Pieces
            </button>` +

            categories.map(
                category =>
                    `<button
                        class="sidebar-category"
                        data-category="${escapeHtml(category.name)}">
                        ${escapeHtml(category.name)}
                    </button>`
            ).join("");

        sidebarCats
            .querySelectorAll(
                "[data-category]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        currentFilter =
                            button.dataset.category;

                        sidebarCats
                            .querySelectorAll(
                                "[data-category]"
                            )
                            .forEach(
                                item =>
                                    item.classList.toggle(
                                        "active",
                                        item.dataset.category ===
                                        currentFilter
                                    )
                            );

                        if (container) {

                            container
                                .querySelectorAll(
                                    ".filter-chip"
                                )
                                .forEach(
                                    chip =>
                                        chip.classList.toggle(
                                            "active",
                                            chip.dataset.category ===
                                            currentFilter
                                        )
                                );
                        }

                        closeSidebarFn();

                        const productsSection =
                            $("products");

                        if (
                            productsSection
                        ) {

                            productsSection.scrollIntoView({
                                behavior: "smooth"
                            });
                        }

                        loadProducts();
                    }
                );
            });
    }
}

/* =========================================================
   SEARCH
   ========================================================= */

let searchTimer = null;

function handleSearch(value) {

    currentSearch =
        value.trim();

    const desktop =
        $("searchInput");

    const mobile =
        $("searchInputMobile");

    if (desktop) {
        desktop.value =
            currentSearch;
    }

    if (mobile) {
        mobile.value =
            currentSearch;
    }

    clearTimeout(searchTimer);

    searchTimer =
        setTimeout(
            loadProducts,
            350
        );
}

const searchInput =
    $("searchInput");

if (searchInput) {

    searchInput.addEventListener(
        "input",
        event =>
            handleSearch(
                event.target.value
            )
    );
}

const searchInputMobile =
    $("searchInputMobile");

if (searchInputMobile) {

    searchInputMobile.addEventListener(
        "input",
        event =>
            handleSearch(
                event.target.value
            )
    );
}

/* =========================================================
   SORT
   ========================================================= */

const sortSelect =
    $("sortSelect");

if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        event => {

            currentSort =
                event.target.value;

            loadProducts();
        }
    );
}

/* =========================================================
   PRICE FILTER
   ========================================================= */

const applyPriceFilter =
    $("applyPriceFilter");

if (applyPriceFilter) {

    applyPriceFilter.addEventListener(
        "click",
        () => {

            const min =
                $("minPrice");

            const max =
                $("maxPrice");

            currentMinPrice =
                min ? min.value : "";

            currentMaxPrice =
                max ? max.value : "";

            loadProducts();
        }
    );
}

/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

    if (!apiAvailable()) {
        return;
    }

    const grid =
        $("productsGrid");

    if (grid) {

        grid.innerHTML =
            `<div class="products-loading">
                Loading collection...
            </div>`;
    }

    try {

        const params =
            new URLSearchParams();

        if (
            currentFilter &&
            currentFilter !== "all"
        ) {
            params.set(
                "category",
                currentFilter
            );
        }

        if (currentSearch) {
            params.set(
                "search",
                currentSearch
            );
        }

        if (currentMinPrice) {
            params.set(
                "minPrice",
                currentMinPrice
            );
        }

        if (currentMaxPrice) {
            params.set(
                "maxPrice",
                currentMaxPrice
            );
        }

        if (currentSort) {
            params.set(
                "sort",
                currentSort
            );
        }

        const result =
            await apiFetch(
                "/products?" +
                params.toString()
            );

        products =
            Array.isArray(result)
                ? result
                : (
                    result.products ||
                    []
                );

        renderProducts();

    } catch (error) {

        console.error(
            "Product loading failed:",
            error
        );

        products = [];

        renderProducts();

        showToast(
            error.message ||
            "Unable to load collection.",
            "error"
        );
    }
}

/* =========================================================
   WISHLIST CHECK
   ========================================================= */

function isWishlisted(productId) {

    return wishlist.some(
        item => {

            if (
                typeof item ===
                "string"
            ) {
                return item ===
                    productId;
            }

            return (
                item &&
                item._id === productId
            );
        }
    );
}

/* =========================================================
   PRODUCT GRID
   ========================================================= */

function renderProducts() {

    const grid =
        $("productsGrid");

    const emptyState =
        $("emptyProductsState");

    if (!grid) return;

    if (!products.length) {

        grid.innerHTML = "";

        if (emptyState) {

            emptyState.style.display =
                "block";

            const heading =
                emptyState.querySelector(
                    "h3"
                );

            const paragraph =
                emptyState.querySelector(
                    "p"
                );

            const hasFilters =
                currentFilter !==
                    "all" ||
                currentSearch ||
                currentMinPrice ||
                currentMaxPrice;

            if (heading) {

                heading.textContent =
                    hasFilters
                        ? "No pieces match your search"
                        : "New pieces are being lettered";
            }

            if (paragraph) {

                paragraph.textContent =
                    hasFilters
                        ? "Try a different keyword, category, or price range."
                        : "Our collection is being prepared by hand. Please check back soon.";
            }
        }

        return;
    }

    if (emptyState) {
        emptyState.style.display =
            "none";
    }

    grid.innerHTML =
        products.map(product => {

            const image =
                product.images &&
                product.images.length
                    ? product.images[0]
                    : "";

            const wished =
                isWishlisted(
                    product._id
                );

            const stockLabel =
                product.stockStatus ===
                "in_stock"
                    ? "In Stock"
                    : "Made to Order";

            const stockClass =
                product.stockStatus ===
                "in_stock"
                    ? "in-stock"
                    : "";

            const rating =
                Number(
                    product.ratingAverage ||
                    0
                );

            const ratingCount =
                Number(
                    product.ratingCount ||
                    0
                );

            return `
                <article
                    class="product-card"
                    data-id="${escapeHtml(product._id)}"
                >

                    <div class="product-card-img">

                        ${
                            image
                                ? `
                                    <img
                                        src="${escapeHtml(image)}"
                                        alt="${escapeHtml(product.name)}"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <div class="product-image-placeholder">
                                        Husna Artistry
                                    </div>
                                `
                        }

                        <span
                            class="stock-tag ${stockClass}">
                            ${stockLabel}
                        </span>

                        <button
                            class="product-card-wish ${
                                wished
                                    ? "active"
                                    : ""
                            }"
                            data-wish-id="${escapeHtml(product._id)}"
                            aria-label="Add to wishlist"
                            type="button"
                        >
                            ♥
                        </button>

                    </div>

                    <div class="product-card-body">

                        <span class="product-card-cat">
                            ${escapeHtml(product.category || "Artwork")}
                        </span>

                        <h3 class="product-card-name">
                            ${escapeHtml(product.name)}
                        </h3>

                        ${
                            ratingCount > 0
                                ? `
                                    <span class="product-card-rating">
                                        ★ ${rating.toFixed(1)}
                                        (${ratingCount})
                                    </span>
                                `
                                : ""
                        }

                        <p class="product-card-caption">
                            ${escapeHtml(product.description || "")}
                        </p>

                       <div class="product-card-footer">

    <div class="product-card-price-wrap">

    ${
        product.saleActive
            ? `
               <div class="product-card-sale-prices">

    <span class="product-card-price">
        ${formatPrice(product.offerPrice)}
    </span>

    <span class="product-card-original-price">
        ${formatPrice(product.originalPrice)}
    </span>

    <span class="product-card-discount">
        ${
            product.originalPrice > 0
                ? Math.round(
                    ((product.originalPrice - product.offerPrice) /
                    product.originalPrice) * 100
                  )
                : 0
        }% OFF
    </span>

</div>

<span class="product-card-sale-label">
    Super Deals
</span>
            `
            : `
                <span class="product-card-price">
                    ${formatPrice(product.originalPrice)}
                </span>
            `
    }

</div>

    <button
        class="product-card-add"
        data-add-id="${escapeHtml(product._id)}"
        type="button"
    >
        Add to Cart
    </button>

</div>

                    </div>

                </article>
            `;

        }).join("");

    /* Product open */

    grid
        .querySelectorAll(
            ".product-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            "[data-wish-id]"
                        ) ||
                        event.target.closest(
                            "[data-add-id]"
                        )
                    ) {
                        return;
                    }

                    openProductModal(
                        card.dataset.id
                    );
                }
            );
        });

    /* Wishlist */

    grid
        .querySelectorAll(
            "[data-wish-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    toggleWishlist(
                        button.dataset.wishId
                    );
                }
            );
        });

    /* Add to cart */

    grid
        .querySelectorAll(
            "[data-add-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    const product =
                        products.find(
                            item =>
                                item._id ===
                                button.dataset.addId
                        );

                    if (!product) return;

                    const size =
                        product.sizes &&
                        product.sizes.length
                            ? product.sizes[0]
                            : "Standard";

                    addToCart(
                        product,
                        size,
                        1
                    );
                }
            );
        });
}

/* =========================================================
   PRODUCT MODAL
   ========================================================= */

async function openProductModal(id) {

    if (!apiAvailable()) return;

    try {

        const data =
            await apiFetch(
                "/products/" +
                id
            );

        activeProduct =
            data.product ||
            data;

        activeSize =
            activeProduct.sizes &&
            activeProduct.sizes.length
                ? activeProduct.sizes[0]
                : "Standard";

        activeGalleryIndex = 0;

        renderProductModal(
            activeProduct
        );

        renderReviews(
            activeProduct,
            data.reviews || []
        );

        openModal(
            "productModal"
        );

    } catch (error) {

        showToast(
            error.message ||
            "Unable to open product.",
            "error"
        );
    }
}

/* =========================================================
   PRODUCT MODAL UI
   ========================================================= */

function renderProductModal(product) {

    const body =
        $("productModalBody");

    if (!body) return;

    const images =
        product.images || [];

    const sizes =
        product.sizes &&
        product.sizes.length
            ? product.sizes
            : ["Standard"];

    const image =
        images[activeGalleryIndex] ||
        "";

    const rating =
        Number(
            product.ratingAverage ||
            0
        );

    const ratingCount =
        Number(
            product.ratingCount ||
            0
        );

    body.innerHTML = `

        <div class="pm-gallery">

            <div class="pm-gallery-main">

                ${
                    image
                        ? `
                            <img
                                src="${escapeHtml(image)}"
                                alt="${escapeHtml(product.name)}"
                            >
                        `
                        : `
                            <div class="product-image-placeholder">
                                Husna Artistry
                            </div>
                        `
                }

            </div>

            ${
                images.length > 1
                    ? `
                        <div class="pm-gallery-thumbs">

                            ${
                                images.map(
                                    (img, index) =>
                                        `
                                            <img
                                                src="${escapeHtml(img)}"
                                                data-idx="${index}"
                                                class="${
                                                    index ===
                                                    activeGalleryIndex
                                                        ? "active"
                                                        : ""
                                                }"
                                                alt=""
                                            >
                                        `
                                ).join("")
                            }

                        </div>
                    `
                    : ""
            }

        </div>

        <div class="pm-details">

            <span class="pm-cat">
                ${escapeHtml(product.category || "Artwork")}
            </span>

            <h2 class="pm-name">
                ${escapeHtml(product.name)}
            </h2>

            ${
                ratingCount > 0
                    ? `
                        <div class="pm-rating">
                            ★ ${rating.toFixed(1)}
                            · ${ratingCount}
                            review${ratingCount === 1 ? "" : "s"}
                        </div>
                    `
                    : ""
            }

            <span class="pm-stock">
                ${
                    product.stockStatus ===
                    "in_stock"
                        ? "In Stock"
                        : "Made to Order"
                }
            </span>

         <div class="pm-price">

    ${
        product.saleActive &&
        Number(product.offerPrice) < Number(product.originalPrice)
            ? `
                <span class="pm-price-current">
                    ${formatPrice(product.offerPrice)}
                </span>

                <span class="pm-price-original">
                    ${formatPrice(product.originalPrice)}
                </span>

                <span class="pm-price-discount">
                    ${Math.round(
                        (
                            (Number(product.originalPrice) -
                             Number(product.offerPrice)) /
                            Number(product.originalPrice)
                        ) * 100
                    )}% OFF
                </span>
            `
            : `
                <span class="pm-price-current">
                    ${formatPrice(product.originalPrice)}
                </span>
            `
    }

</div>

            <p class="pm-desc">
                ${escapeHtml(product.description || "")}
            </p>

            <div class="pm-sizes">

                <label>
                    Frame Size
                </label>

                <div class="pm-size-options">

                    ${
                        sizes.map(
                            size =>
                                `
                                    <button
                                        class="pm-size-chip ${
                                            size ===
                                            activeSize
                                                ? "active"
                                                : ""
                                        }"
                                        data-size="${escapeHtml(size)}"
                                        type="button"
                                    >
                                        ${escapeHtml(size)}
                                    </button>
                                `
                        ).join("")
                    }

                </div>

            </div>

            <div class="pm-actions">

                <button
                    class="btn btn-primary"
                    id="pmAddToCart"
                    type="button"
                >
                    Add to Cart
                </button>

                <button
                    class="btn btn-outline"
                    id="pmToggleWish"
                    type="button"
                >
                    ${
                        isWishlisted(
                            product._id
                        )
                            ? "In Wishlist"
                            : "Add to Wishlist"
                    }
                </button>

            </div>

        </div>
    `;

    /* Gallery */

    body
        .querySelectorAll(
            ".pm-gallery-thumbs img"
        )
        .forEach(thumb => {

            thumb.addEventListener(
                "click",
                () => {

                    activeGalleryIndex =
                        Number(
                            thumb.dataset.idx
                        );

                    renderProductModal(
                        product
                    );
                }
            );
        });

    /* Sizes */

    body
        .querySelectorAll(
            ".pm-size-chip"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    activeSize =
                        button.dataset.size;

                    renderProductModal(
                        product
                    );
                }
            );
        });

    /* Add */

    const addButton =
        $("pmAddToCart");

    if (addButton) {

        addButton.addEventListener(
            "click",
            () => {

                addToCart(
                    product,
                    activeSize,
                    1
                );
            }
        );
    }

    /* Wishlist */

    const wishButton =
        $("pmToggleWish");

    if (wishButton) {

        wishButton.addEventListener(
            "click",
            async () => {

                await toggleWishlist(
                    product._id
                );

                renderProductModal(
                    product
                );
            }
        );
    }
}

/* =========================================================
   REVIEWS
   ========================================================= */

function renderReviews(
    product,
    reviews = []
) {

    const container =
        $("pmReviews");

    if (!container) return;

    function stars(number) {

        const rating =
            Math.max(
                0,
                Math.min(
                    5,
                    Number(number)
                )
            );

        return (
            "★".repeat(rating) +
            "☆".repeat(5 - rating)
        );
    }

    container.innerHTML = `

        <h4>
            Customer Reviews
        </h4>

        ${
            reviews.length
                ? reviews.map(
                    review =>
                        `
                            <div class="review-item">

                                <div class="review-item-head">

                                    <span>
                                        ${escapeHtml(
                                            review.name ||
                                            "Customer"
                                        )}
                                    </span>

                                    <span class="review-stars">
                                        ${stars(
                                            review.rating
                                        )}
                                    </span>

                                </div>

                                <p class="review-comment">
                                    ${escapeHtml(
                                        review.comment
                                    )}
                                </p>

                            </div>
                        `
                ).join("")
                : `
                    <p class="account-empty">
                        No reviews yet.
                        Be the first to share your experience.
                    </p>
                `
        }

        <div id="reviewFormArea"></div>
    `;

    const formArea =
        $("reviewFormArea");

    if (!formArea) return;

    /* Not logged in */

    if (
        typeof getToken === "function" &&
        !getToken()
    ) {

        formArea.innerHTML = `
            <p class="review-login-note">

                <a
                    href="#"
                    id="reviewLoginLink"
                >
                    Log in
                </a>

                to leave a review.

            </p>
        `;

        const loginLink =
            $("reviewLoginLink");

        if (loginLink) {

            loginLink.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    closeModal(
                        "productModal"
                    );

                    openModal(
                        "loginModal"
                    );
                }
            );
        }

        return;
    }

    /* Review form */

    const userId =
        currentUser &&
        (
            currentUser.id ||
            currentUser._id
        );

    const alreadyReviewed =
        reviews.some(
            review =>
                userId &&
                (
                    review.user ===
                    userId
                )
        );

    if (alreadyReviewed) {

        formArea.innerHTML = `
            <p class="review-login-note">
                You've already reviewed this piece.
                Thank you!
            </p>
        `;

        return;
    }

    formArea.innerHTML = `

        <form
            class="review-form"
            id="reviewForm"
        >

            <select
                name="rating"
                required
            >

                <option value="">
                    Rate this piece
                </option>

                <option value="5">
                    ★★★★★ Excellent
                </option>

                <option value="4">
                    ★★★★ Very Good
                </option>

                <option value="3">
                    ★★★ Good
                </option>

                <option value="2">
                    ★★ Fair
                </option>

                <option value="1">
                    ★ Poor
                </option>

            </select>

            <textarea
                name="comment"
                rows="3"
                placeholder="Share your experience with this piece..."
                required
            ></textarea>

            <button
                type="submit"
                class="btn btn-outline btn-small"
            >
                Submit Review
            </button>

        </form>
    `;

    const reviewForm =
        $("reviewForm");

    if (!reviewForm) return;

    reviewForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            try {

                await apiFetch(
                    `/products/${product._id}/reviews`,
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                rating:
                                    Number(
                                        reviewForm.rating.value
                                    ),

                                comment:
                                    reviewForm.comment.value.trim()
                            })
                    }
                );

                showToast(
                    "Thank you for your review!"
                );

                await openProductModal(
                    product._id
                );

                await loadProducts();

            } catch (error) {

                showToast(
                    error.message ||
                    "Unable to submit review.",
                    "error"
                );
            }
        }
    );
}

/* =========================================================
   WISHLIST
   ========================================================= */

async function toggleWishlist(
    productId
) {

    const currentlyWished =
        isWishlisted(productId);

    try {

        if (
            typeof getToken === "function" &&
            getToken()
        ) {

            if (currentlyWished) {

                const result =
                    await apiFetch(
                        "/wishlist/" +
                        productId,
                        {
                            method:
                                "DELETE"
                        }
                    );

                wishlist =
                    result.products ||
                    [];

            } else {

                const result =
                    await apiFetch(
                        "/wishlist",
                        {
                            method:
                                "POST",

                            body:
                                JSON.stringify({
                                    productId
                                })
                        }
                    );

                wishlist =
                    result.products ||
                    [];
            }

        } else {

            if (currentlyWished) {

                wishlist =
                    wishlist.filter(
                        item => {

                            if (
                                typeof item ===
                                "string"
                            ) {
                                return (
                                    item !==
                                    productId
                                );
                            }

                            return (
                                item._id !==
                                productId
                            );
                        }
                    );

            } else {

                wishlist.push(
                    productId
                );
            }

            saveLocal(
                "husna_wishlist",
                wishlist
            );
        }

        updateBadges();

        renderProducts();

        renderWishlist();

        showToast(
            currentlyWished
                ? "Removed from wishlist."
                : "Added to wishlist."
        );

    } catch (error) {

        showToast(
            error.message ||
            "Wishlist update failed.",
            "error"
        );
    }
}

/* =========================================================
   RENDER WISHLIST
   ========================================================= */

function renderWishlist() {

    const container =
        $("wishlistItems");

    if (!container) return;

    const items =
        wishlist
            .map(item => {

                if (
                    typeof item ===
                    "object"
                ) {
                    return item;
                }

                return products.find(
                    product =>
                        product._id ===
                        item
                );
            })
            .filter(Boolean);

    if (!items.length) {

        container.innerHTML = `

            <div class="drawer-empty">

                Your wishlist is empty.

                <br>

                Tap the heart on any piece
                to save it here.

            </div>
        `;

        return;
    }

    container.innerHTML =
        items.map(product => {

            const image =
                product.images &&
                product.images.length
                    ? product.images[0]
                    : "";

            return `

                <div
                    class="drawer-item"
                >

                    ${
                        image
                            ? `
                                <img
                                    src="${escapeHtml(image)}"
                                    alt="${escapeHtml(product.name)}"
                                >
                            `
                            : ""
                    }

                    <div
                        class="drawer-item-info"
                    >

                        <div
                            class="drawer-item-name"
                        >
                            ${escapeHtml(
                                product.name
                            )}
                        </div>

                   <div
    class="drawer-item-meta"
>
    ${formatPrice(
        product.saleActive
            ? product.offerPrice
            : product.originalPrice
    )}
</div>
                        <div
                            class="drawer-item-actions"
                        >

                            <button
                                class="drawer-item-remove"
                                data-remove-wish="${escapeHtml(product._id)}"
                                type="button"
                            >
                                Remove
                            </button>

                            <button
                                class="drawer-item-add"
                                data-wish-add-cart="${escapeHtml(product._id)}"
                                type="button"
                            >
                                Add to Cart
                            </button>

                        </div>

                    </div>

                </div>
            `;

        }).join("");

    /* Remove */

    container
        .querySelectorAll(
            "[data-remove-wish]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    toggleWishlist(
                        button.dataset
                            .removeWish
                    );
                }
            );
        });

    /* Add wishlist item to cart */

    container
        .querySelectorAll(
            "[data-wish-add-cart]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const product =
                        items.find(
                            item =>
                                item._id ===
                                button.dataset
                                    .wishAddCart
                        );

                    if (!product) return;

                    const size =
                        product.sizes &&
                        product.sizes.length
                            ? product.sizes[0]
                            : "Standard";

                    addToCart(
                        product,
                        size,
                        1
                    );
                }
            );
        });
}

/* =========================================================
   CART
   ========================================================= */

function cartItemFromServer(item) {

    const product =
        item.product || {};

    return {

        productId:
            product._id,

        name:
            product.name,

      price:
    Number(
        product.saleActive
            ? product.offerPrice
            : product.originalPrice
    ),

        size:
            item.size ||
            "Standard",

        qty:
            Number(
                item.qty || 1
            ),

        image:
            product.images &&
            product.images.length
                ? product.images[0]
                : ""
    };
}

/* =========================================================
   ADD TO CART
   ========================================================= */

async function addToCart(
    product,
    size = "Standard",
    qty = 1
) {

    if (!product) return;

    try {

        if (
            typeof getToken === "function" &&
            getToken()
        ) {

            const result =
                await apiFetch(
                    "/cart",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                productId:
                                    product._id,

                                size,

                                qty
                            })
                    }
                );

            cart =
                (
                    result.items ||
                    []
                ).map(
                    cartItemFromServer
                );

        } else {

            const existing =
                cart.find(
                    item =>
                        item.productId ===
                            product._id &&
                        item.size ===
                            size
                );

            if (existing) {

                existing.qty += qty;

            } else {

                cart.push({

                    productId:
                        product._id,

                    name:
                        product.name,

                  price:
    Number(
        product.saleActive
            ? product.offerPrice
            : product.originalPrice
    ),
                    size,

                    qty,

                    image:
                        product.images &&
                        product.images.length
                            ? product.images[0]
                            : ""
                });
            }

            saveLocal(
                "husna_cart",
                cart
            );
        }

        updateBadges();

        renderCart();

        showToast(
            "Added to your cart."
        );

    } catch (error) {

        showToast(
            error.message ||
            "Unable to add item to cart.",
            "error"
        );
    }
}

/* =========================================================
   UPDATE CART QTY
   ========================================================= */

async function updateCartQty(
    productId,
    size,
    newQty
) {

    try {

        if (
            typeof getToken === "function" &&
            getToken()
        ) {

            const result =
                await apiFetch(
                    "/cart/item",
                    {
                        method:
                            "PUT",

                        body:
                            JSON.stringify({
                                productId,
                                size,
                                qty:
                                    Math.max(
                                        0,
                                        newQty
                                    )
                            })
                    }
                );

            cart =
                (
                    result.items ||
                    []
                ).map(
                    cartItemFromServer
                );

        } else {

            if (newQty <= 0) {

                cart =
                    cart.filter(
                        item =>
                            !(
                                item.productId ===
                                    productId &&
                                item.size ===
                                    size
                            )
                    );

            } else {

                const item =
                    cart.find(
                        cartItem =>
                            cartItem.productId ===
                                productId &&
                            cartItem.size ===
                                size
                    );

                if (item) {

                    item.qty =
                        newQty;
                }
            }

            saveLocal(
                "husna_cart",
                cart
            );
        }

        updateBadges();

        renderCart();

    } catch (error) {

        showToast(
            error.message ||
            "Unable to update cart.",
            "error"
        );
    }
}

/* =========================================================
   REMOVE CART ITEM
   ========================================================= */

async function removeFromCart(
    productId,
    size
) {

    try {

        if (
            typeof getToken === "function" &&
            getToken()
        ) {

            const result =
                await apiFetch(
                    "/cart/item",
                    {
                        method:
                            "DELETE",

                        body:
                            JSON.stringify({
                                productId,
                                size
                            })
                    }
                );

            cart =
                (
                    result.items ||
                    []
                ).map(
                    cartItemFromServer
                );

        } else {

            cart =
                cart.filter(
                    item =>
                        !(
                            item.productId ===
                                productId &&
                            item.size ===
                                size
                        )
                );

            saveLocal(
                "husna_cart",
                cart
            );
        }

        updateBadges();

        renderCart();

        showToast(
            "Removed from cart."
        );

    } catch (error) {

        showToast(
            error.message ||
            "Unable to remove item.",
            "error"
        );
    }
}

/* =========================================================
   RENDER CART
   ========================================================= */

function renderCart() {

    const container =
        $("cartItems");

    if (!container) return;

    if (!cart.length) {

        container.innerHTML = `

            <div class="drawer-empty">

                Your cart is empty.

                <br>

                Explore the collection
                to find your piece.

            </div>
        `;

        updateCartTotalUI(0);

        return;
    }

    let subtotal = 0;

    container.innerHTML =
        cart.map(item => {

            const price =
                Number(
                    item.price || 0
                );

            const qty =
                Number(
                    item.qty || 1
                );

            subtotal +=
                price * qty;

            const key =
                `${item.productId}|${item.size}`;

            return `

                <div
                    class="drawer-item"
                >

                    ${
                        item.image
                            ? `
                                <img
                                    src="${escapeHtml(item.image)}"
                                    alt="${escapeHtml(item.name)}"
                                >
                            `
                            : ""
                    }

                    <div
                        class="drawer-item-info"
                    >

                        <div
                            class="drawer-item-name"
                        >
                            ${escapeHtml(
                                item.name
                            )}
                        </div>

                        <div
                            class="drawer-item-meta"
                        >
                            Size:
                            ${escapeHtml(
                                item.size
                            )}
                            ·
                            ${formatPrice(
                                price
                            )}
                        </div>

                        <div
                            class="drawer-item-qty"
                        >

                            <button
                                class="qty-btn"
                                data-dec="${escapeHtml(key)}"
                                type="button"
                            >
                                −
                            </button>

                            <span>
                                ${qty}
                            </span>

                            <button
                                class="qty-btn"
                                data-inc="${escapeHtml(key)}"
                                type="button"
                            >
                                +
                            </button>

                        </div>

                        <button
                            class="drawer-item-remove"
                            data-remove="${escapeHtml(key)}"
                            type="button"
                        >
                            Remove
                        </button>

                    </div>

                </div>
            `;

        }).join("");

    updateCartTotalUI(
        subtotal
    );

    /* Plus */

    container
        .querySelectorAll(
            "[data-inc]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const [
                        productId,
                        ...sizeParts
                    ] =
                        button.dataset
                            .inc
                            .split("|");

                    const size =
                        sizeParts.join("|");

                    const item =
                        cart.find(
                            cartItem =>
                                cartItem.productId ===
                                    productId &&
                                cartItem.size ===
                                    size
                        );

                    if (!item) return;

                    updateCartQty(
                        productId,
                        size,
                        item.qty + 1
                    );
                }
            );
        });

    /* Minus */

    container
        .querySelectorAll(
            "[data-dec]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const [
                        productId,
                        ...sizeParts
                    ] =
                        button.dataset
                            .dec
                            .split("|");

                    const size =
                        sizeParts.join("|");

                    const item =
                        cart.find(
                            cartItem =>
                                cartItem.productId ===
                                    productId &&
                                cartItem.size ===
                                    size
                        );

                    if (!item) return;

                    updateCartQty(
                        productId,
                        size,
                        item.qty - 1
                    );
                }
            );
        });

    /* Remove */

    container
        .querySelectorAll(
            "[data-remove]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const [
                        productId,
                        ...sizeParts
                    ] =
                        button.dataset
                            .remove
                            .split("|");

                    const size =
                        sizeParts.join("|");

                    removeFromCart(
                        productId,
                        size
                    );
                }
            );
        });
}

/* =========================================================
   CART TOTAL — SUPPORT BOTH HTML VERSIONS
   ========================================================= */

function updateCartTotalUI(
    total
) {

    const subtotal =
        $("cartSubtotal");

    const cartTotal =
        $("cartTotal");

    if (subtotal) {

        subtotal.textContent =
            formatPrice(total);
    }

    if (cartTotal) {

        cartTotal.textContent =
            formatPrice(total);
    }
}

/* =========================================================
   BADGES
   ========================================================= */

function updateBadges() {

    const cartBadge =
        $("cartBadge");

    const wishlistBadge =
        $("wishlistBadge");

    const cartCount =
        cart.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.qty || 0
                ),
            0
        );

    if (cartBadge) {

        cartBadge.textContent =
            cartCount;
    }

    if (wishlistBadge) {

        wishlistBadge.textContent =
            wishlist.length;
    }
}

/* =========================================================
   CHECKOUT
   ========================================================= */

const checkoutBtn =
    $("checkoutBtn");

if (checkoutBtn) {

    checkoutBtn.addEventListener(
        "click",
        () => {

            if (!cart.length) {

                showToast(
                    "Your cart is empty.",
                    "error"
                );

                return;
            }

            saveLocal(
                "husna_checkout_cart",
                cart
            );

            /*
             * Keep your existing checkout page.
             */

            window.location.href =
                "/checkout.html";
        }
    );
}

/* =========================================================
   LOGIN
   ========================================================= */

const loginForm =
    $("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            if (!apiAvailable()) {

                showToast(
                    "API is not connected.",
                    "error"
                );

                return;
            }

            const email =
                loginForm.email.value.trim();

            const password =
                loginForm.password.value;

            try {

                const result =
                    await apiFetch(
                        "/auth/login",
                        {
                            method:
                                "POST",

                            body:
                                JSON.stringify({
                                    email,
                                    password
                                })
                        }
                    );

                if (
                    typeof setToken ===
                    "function"
                ) {

                    setToken(
                        result.token
                    );
                }

                currentUser =
                    result.user ||
                    null;

                loginForm.reset();

                closeModal(
                    "loginModal"
                );

                showToast(
                    `Welcome back${
                        currentUser &&
                        currentUser.name
                            ? ", " +
                              currentUser.name
                            : ""
                    }!`
                );

                await syncCartAfterLogin();

                await loadProducts();

            } catch (error) {

                showToast(
                    error.message ||
                    "Login failed.",
                    "error"
                );
            }
        }
    );
}

/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

let resetEmail = "";
let resetCodeVerified = false;


/* ---------- OPEN FORGOT PASSWORD ---------- */

const forgotPasswordLink =
  document.getElementById("forgotPasswordLink");

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();

    resetEmail = "";
    resetCodeVerified = false;

    const emailStep =
      document.getElementById("forgotPasswordEmailStep");

    const codeStep =
      document.getElementById("forgotPasswordCodeStep");

    const resetStep =
      document.getElementById("forgotPasswordResetStep");

    if (emailStep) emailStep.style.display = "block";
    if (codeStep) codeStep.style.display = "none";
    if (resetStep) resetStep.style.display = "none";

    const emailInput =
      document.getElementById("forgotPasswordEmail");

    if (emailInput) emailInput.value = "";

    const codeInput =
      document.getElementById("resetCode");

    if (codeInput) codeInput.value = "";

    const passwordInput =
      document.getElementById("newResetPassword");

    if (passwordInput) passwordInput.value = "";

    const confirmInput =
      document.getElementById("confirmResetPassword");

    if (confirmInput) confirmInput.value = "";

    closeModal("loginModal");
    openModal("forgotPasswordModal");
  });
}


/* ---------- SEND RESET CODE ---------- */

const forgotPasswordEmailForm =
  document.getElementById("forgotPasswordEmailForm");

if (forgotPasswordEmailForm) {

  forgotPasswordEmailForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      const emailInput =
        document.getElementById("forgotPasswordEmail");

      const email =
        emailInput.value.trim().toLowerCase();

      if (!email) {
        showToast(
          "Please enter your email address.",
          "error"
        );
        return;
      }

      try {

        const button =
          document.getElementById("sendResetCodeBtn");

        if (button) {
          button.disabled = true;
          button.textContent = "Sending...";
        }

        await apiFetch(
          "/auth/forgot-password",
          {
            method: "POST",

            body: JSON.stringify({
              email
            })
          }
        );

        resetEmail = email;

        document.getElementById(
          "forgotPasswordEmailStep"
        ).style.display = "none";

        document.getElementById(
          "forgotPasswordCodeStep"
        ).style.display = "block";

        showToast(
          "If that email is registered, a verification code has been sent."
        );

      } catch (error) {

        showToast(
          error.message ||
          "Could not send the verification code.",
          "error"
        );

      } finally {

        const button =
          document.getElementById("sendResetCodeBtn");

        if (button) {
          button.disabled = false;
          button.textContent =
            "Send Verification Code";
        }

      }

    }
  );

}


/* ---------- VERIFY RESET CODE ---------- */

const verifyResetCodeForm =
  document.getElementById("verifyResetCodeForm");

if (verifyResetCodeForm) {

  verifyResetCodeForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      const codeInput =
        document.getElementById("resetCode");

      const code =
        codeInput.value.trim();

      if (!/^\d{6}$/.test(code)) {

        showToast(
          "Please enter the 6-digit verification code.",
          "error"
        );

        return;
      }

      if (!resetEmail) {

        showToast(
          "Please request a new verification code.",
          "error"
        );

        return;
      }

      try {

        const button =
          document.getElementById("verifyResetCodeBtn");

        if (button) {
          button.disabled = true;
          button.textContent = "Verifying...";
        }

        await apiFetch(
          "/auth/verify-reset-code",
          {
            method: "POST",

            body: JSON.stringify({
              email: resetEmail,
              code
            })
          }
        );

        resetCodeVerified = true;

        document.getElementById(
          "forgotPasswordCodeStep"
        ).style.display = "none";

        document.getElementById(
          "forgotPasswordResetStep"
        ).style.display = "block";

        showToast(
          "Code verified. Create your new password."
        );

      } catch (error) {

        showToast(
          error.message ||
          "Invalid or expired verification code.",
          "error"
        );

      } finally {

        const button =
          document.getElementById("verifyResetCodeBtn");

        if (button) {
          button.disabled = false;
          button.textContent = "Verify Code";
        }

      }

    }
  );

}


/* ---------- RESEND RESET CODE ---------- */

const resendResetCode =
  document.getElementById("resendResetCode");

if (resendResetCode) {

  resendResetCode.addEventListener(
    "click",
    async (e) => {

      e.preventDefault();

      if (!resetEmail) {

        showToast(
          "Please enter your email address first.",
          "error"
        );

        return;
      }

      try {

        resendResetCode.style.pointerEvents =
          "none";

        await apiFetch(
          "/auth/forgot-password",
          {
            method: "POST",

            body: JSON.stringify({
              email: resetEmail
            })
          }
        );

        document.getElementById(
          "resetCode"
        ).value = "";

        showToast(
          "A new verification code has been sent."
        );

      } catch (error) {

        showToast(
          error.message ||
          "Could not resend the verification code.",
          "error"
        );

      } finally {

        setTimeout(() => {

          resendResetCode.style.pointerEvents =
            "";

        }, 3000);

      }

    }
  );

}


/* ---------- RESET PASSWORD ---------- */

const resetPasswordForm =
  document.getElementById("resetPasswordForm");

if (resetPasswordForm) {

  resetPasswordForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      if (!resetCodeVerified) {

        showToast(
          "Please verify your code first.",
          "error"
        );

        return;
      }

      const password =
        document.getElementById(
          "newResetPassword"
        ).value;

      const confirmPassword =
        document.getElementById(
          "confirmResetPassword"
        ).value;


      /* ---------- PASSWORD VALIDATION ---------- */

      if (password.length < 8) {

        showToast(
          "Password must be at least 8 characters.",
          "error"
        );

        return;
      }

      if (password.length > 128) {

        showToast(
          "Password cannot exceed 128 characters.",
          "error"
        );

        return;
      }

      if (!/[A-Z]/.test(password)) {

        showToast(
          "Password must contain an uppercase letter.",
          "error"
        );

        return;
      }

      if (!/[a-z]/.test(password)) {

        showToast(
          "Password must contain a lowercase letter.",
          "error"
        );

        return;
      }

      if (!/[0-9]/.test(password)) {

        showToast(
          "Password must contain a number.",
          "error"
        );

        return;
      }

      if (!/[^A-Za-z0-9]/.test(password)) {

        showToast(
          "Password must contain a special character.",
          "error"
        );

        return;
      }

      if (/\s/.test(password)) {

        showToast(
          "Password cannot contain spaces.",
          "error"
        );

        return;
      }

      if (password !== confirmPassword) {

        showToast(
          "Passwords do not match.",
          "error"
        );

        return;
      }


      try {

        const button =
          document.getElementById("resetPasswordBtn");

        if (button) {
          button.disabled = true;
          button.textContent = "Resetting...";
        }

        await apiFetch(
          "/auth/reset-password",
          {
            method: "POST",

            body: JSON.stringify({
              email: resetEmail,
              code:
                document.getElementById(
                  "resetCode"
                ).value.trim(),
              newPassword: password
            })
          }
        );

        resetEmail = "";
        resetCodeVerified = false;

        resetPasswordForm.reset();

        closeModal(
          "forgotPasswordModal"
        );

        openModal("loginModal");

        showToast(
          "Password reset successfully. Please log in."
        );

      } catch (error) {

        showToast(
          error.message ||
          "Could not reset your password.",
          "error"
        );

      } finally {

        const button =
          document.getElementById("resetPasswordBtn");

        if (button) {
          button.disabled = false;
          button.textContent =
            "Reset Password";
        }

      }

    }
  );

}


/* ---------- BACK TO LOGIN ---------- */

const backToLoginFromForgot =
  document.getElementById(
    "backToLoginFromForgot"
  );

if (backToLoginFromForgot) {

  backToLoginFromForgot.addEventListener(
    "click",
    (e) => {

      e.preventDefault();

      closeModal(
        "forgotPasswordModal"
      );

      openModal("loginModal");

    }
  );

}


const backToLoginFromReset =
  document.getElementById(
    "backToLoginFromReset"
  );

if (backToLoginFromReset) {

  backToLoginFromReset.addEventListener(
    "click",
    (e) => {

      e.preventDefault();

      resetEmail = "";
      resetCodeVerified = false;

      closeModal(
        "forgotPasswordModal"
      );

      openModal("loginModal");

    }
  );

}

/* =========================================================
   REGISTER
   ========================================================= */

const registerForm =
    $("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            if (!apiAvailable()) {

                showToast(
                    "API is not connected.",
                    "error"
                );

                return;
            }

            const name =
                registerForm.name.value.trim();

            const email =
                registerForm.email.value.trim();

            const password =
                registerForm.password.value;

            try {

                const result =
                    await apiFetch(
                        "/auth/register",
                        {
                            method:
                                "POST",

                            body:
                                JSON.stringify({
                                    name,
                                    email,
                                    password
                                })
                        }
                    );

                if (
                    typeof setToken ===
                    "function"
                ) {

                    setToken(
                        result.token
                    );
                }

                currentUser =
                    result.user ||
                    null;

                registerForm.reset();

                closeModal(
                    "registerModal"
                );

                showToast(
                    `Welcome${
                        currentUser &&
                        currentUser.name
                            ? ", " +
                              currentUser.name
                            : ""
                    }! Your account is ready.`
                );

                await syncCartAfterLogin();

                await loadProducts();

            } catch (error) {

                showToast(
                    error.message ||
                    "Registration failed.",
                    "error"
                );
            }
        }
    );
}

/* =========================================================
   ACCOUNT TABS
   ========================================================= */

document.querySelectorAll(
    ".account-tab"
).forEach(tab => {

    tab.addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".account-tab"
                )
                .forEach(item =>
                    item.classList.remove(
                        "active"
                    )
                );

            tab.classList.add(
                "active"
            );

            loadAccountTab(
                tab.dataset.tab
            );
        }
    );
});

/* =========================================================
   ACCOUNT
   ========================================================= */

async function loadAccountTab(
    tab
) {

    const body =
        $("accountBody");

    if (!body) return;

    body.innerHTML =
        `<p class="account-empty">
            Loading...
        </p>`;

    if (!apiAvailable()) {

        body.innerHTML =
            `<p class="account-empty">
                Account API is unavailable.
            </p>`;

        return;
    }

    /* PROFILE */

    if (tab === "profile") {

        try {

            const result =
                await apiFetch(
                    "/auth/me"
                );

            const user =
                result.user ||
                result;

            currentUser =
                user;

            body.innerHTML = `

                <form
                    id="profileForm"
                    class="auth-form"
                >

                    <label>
                        Name

                        <input
                            type="text"
                            name="name"
                            value="${escapeHtml(
                                user.name || ""
                            )}"
                            required
                        >
                    </label>

                    <label>
                        Email

                        <input
                            type="email"
                            value="${escapeHtml(
                                user.email || ""
                            )}"
                            disabled
                        >
                    </label>

                    <label>
                        Phone

                        <input
                            type="tel"
                            name="phone"
                            value="${escapeHtml(
                                user.phone || ""
                            )}"
                        >
                    </label>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Save Changes
                    </button>

                </form>

                <form
                    id="passwordForm"
                    class="auth-form"
                >

                    <label>
                        Current Password

                        <input
                            type="password"
                            name="currentPassword"
                            required
                        >
                    </label>

                    <label>
                        New Password

                        <input
                            type="password"
                            name="newPassword"
                            minlength="6"
                            required
                        >
                    </label>

                    <button
                        type="submit"
                        class="btn btn-outline"
                    >
                        Change Password
                    </button>

                </form>

                <button
                    id="logoutBtn"
                    class="btn btn-outline btn-block"
                    type="button"
                >
                    Log Out
                </button>
            `;

            /* Profile update */

            const profileForm =
                $("profileForm");

            if (profileForm) {

                profileForm.addEventListener(
                    "submit",
                    async event => {

                        event.preventDefault();

                        try {

                            await apiFetch(
                                "/auth/me",
                                {
                                    method:
                                        "PUT",

                                    body:
                                        JSON.stringify({
                                            name:
                                                profileForm.name.value.trim(),

                                            phone:
                                                profileForm.phone.value.trim()
                                        })
                                }
                            );

                            showToast(
                                "Profile updated."
                            );

                        } catch (error) {

                            showToast(
                                error.message,
                                "error"
                            );
                        }
                    }
                );
            }

            /* Password */

            const passwordForm =
                $("passwordForm");

            if (passwordForm) {

                passwordForm.addEventListener(
                    "submit",
                    async event => {

                        event.preventDefault();

                        try {

                            await apiFetch(
                                "/auth/change-password",
                                {
                                    method:
                                        "PUT",

                                    body:
                                        JSON.stringify({
                                            currentPassword:
                                                passwordForm
                                                    .currentPassword
                                                    .value,

                                            newPassword:
                                                passwordForm
                                                    .newPassword
                                                    .value
                                        })
                                }
                            );

                            passwordForm.reset();

                            showToast(
                                "Password changed."
                            );

                        } catch (error) {

                            showToast(
                                error.message,
                                "error"
                            );
                        }
                    }
                );
            }

            /* Logout */

            const logoutBtn =
                $("logoutBtn");

            if (logoutBtn) {

                logoutBtn.addEventListener(
                    "click",
                    () => {

                        if (
                            typeof setToken ===
                            "function"
                        ) {
                            setToken(null);
                        }

                        currentUser =
                            null;

                        cart = [];
                        wishlist = [];

                        saveLocal(
                            "husna_cart",
                            []
                        );

                        saveLocal(
                            "husna_wishlist",
                            []
                        );

                        updateBadges();

                        closeModal(
                            "accountModal"
                        );

                        showToast(
                            "You've been logged out."
                        );
                    }
                );
            }

        } catch (error) {

            body.innerHTML =
                `<p class="account-empty">
                    Could not load account.
                </p>`;
        }

        return;
    }

    /* ORDERS */

    if (tab === "orders") {

        try {

            const result =
                await apiFetch(
                    "/orders/my"
                );

            const orders =
                Array.isArray(result)
                    ? result
                    : result.orders || [];

            if (!orders.length) {

                body.innerHTML =
                    `<p class="account-empty">
                        No orders yet.
                        Once you check out,
                        your orders will appear here.
                    </p>`;

                return;
            }

            body.innerHTML =
                orders.map(
                    order =>
                        `

                            <div
                                class="order-card"
                            >

                                <div
                                    class="order-card-head"
                                >

                                    <span>
                                        #${escapeHtml(
                                            String(
                                                order._id ||
                                                ""
                                            ).slice(-8)
                                        ).toUpperCase()}
                                    </span>

                                    <span
                                        class="order-status-pill ${
                                            escapeHtml(
                                                order.orderStatus ||
                                                ""
                                            )
                                        }"
                                    >
                                        ${escapeHtml(
                                            order.orderStatus ||
                                            "placed"
                                        )}
                                    </span>

                                </div>

                                <div
                                    class="drawer-item-meta"
                                >

                                    ${
                                        order.createdAt
                                            ? new Date(
                                                order.createdAt
                                            ).toLocaleDateString(
                                                "en-IN"
                                            )
                                            : ""
                                    }

                                    ·

                                    ${formatPrice(
                                        order.totalAmount
                                    )}

                                </div>

                                ${
                                    [
                                        "placed",
                                        "confirmed"
                                    ].includes(
                                        order.orderStatus
                                    )
                                        ? `
                                            <button
                                                class="btn btn-outline btn-small"
                                                data-cancel-order="${escapeHtml(order._id)}"
                                                type="button"
                                            >
                                                Cancel Order
                                            </button>
                                        `
                                        : ""
                                }

                            </div>
                        `
                ).join("");

            body
                .querySelectorAll(
                    "[data-cancel-order]"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            if (
                                !confirm(
                                    "Cancel this order?"
                                )
                            ) {
                                return;
                            }

                            try {

                                await apiFetch(
                                    `/orders/${button.dataset.cancelOrder}/cancel`,
                                    {
                                        method:
                                            "PATCH",

                                        body:
                                            JSON.stringify({})
                                    }
                                );

                                showToast(
                                    "Order cancelled."
                                );

                                loadAccountTab(
                                    "orders"
                                );

                            } catch (error) {

                                showToast(
                                    error.message,
                                    "error"
                                );
                            }
                        }
                    );
                });

        } catch (error) {

            body.innerHTML =
                `<p class="account-empty">
                    Could not load orders.
                </p>`;
        }

        return;
    }

    /* ADDRESSES */

    if (tab === "addresses") {

        try {

            const result =
                await apiFetch(
                    "/auth/me"
                );

            const user =
                result.user ||
                result;

            const addresses =
                user.addresses || [];

            body.innerHTML = `

                ${
                    addresses.length
                        ? addresses.map(
                            address =>
                                `

                                    <div
                                        class="address-card"
                                    >

                                        <button
                                            data-remove-address="${escapeHtml(address._id)}"
                                            type="button"
                                        >
                                            Remove
                                        </button>

                                        <strong>
                                            ${escapeHtml(
                                                address.fullName
                                            )}
                                        </strong>

                                        <br>

                                        ${escapeHtml(
                                            address.houseNo
                                        )},
                                        ${escapeHtml(
                                            address.street
                                        )}

                                        ${
                                            address.area
                                                ? ", " +
                                                  escapeHtml(
                                                      address.area
                                                  )
                                                : ""
                                        }

                                        <br>

                                        ${escapeHtml(
                                            address.city
                                        )},
                                        ${escapeHtml(
                                            address.state
                                        )}
                                        -
                                        ${escapeHtml(
                                            address.pincode
                                        )}

                                        <br>

                                        ${escapeHtml(
                                            address.mobile
                                        )}

                                    </div>
                                `
                        ).join("")
                        : `
                            <p class="account-empty">
                                No saved addresses yet.
                            </p>
                        `
                }

                <p class="account-orders-title">
                    Addresses you save at checkout
                    will appear here.
                </p>
            `;

            body
                .querySelectorAll(
                    "[data-remove-address]"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            try {

                                await apiFetch(
                                    "/auth/addresses/" +
                                    button.dataset
                                        .removeAddress,
                                    {
                                        method:
                                            "DELETE"
                                    }
                                );

                                showToast(
                                    "Address removed."
                                );

                                loadAccountTab(
                                    "addresses"
                                );

                            } catch (error) {

                                showToast(
                                    error.message,
                                    "error"
                                );
                            }
                        }
                    );
                });

        } catch (error) {

            body.innerHTML =
                `<p class="account-empty">
                    Could not load addresses.
                </p>`;
        }
    }
}

/* =========================================================
   SYNC CART AFTER LOGIN
   ========================================================= */

async function syncCartAfterLogin() {

    if (!apiAvailable()) return;

    try {

        const serverCart =
            await apiFetch(
                "/cart"
            );

        const serverItems =
            serverCart.items || [];

        if (
            !serverItems.length &&
            cart.length
        ) {

            for (
                const item of cart
            ) {

                await apiFetch(
                    "/cart",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                productId:
                                    item.productId,

                                size:
                                    item.size,

                                qty:
                                    item.qty
                            })
                    }
                );
            }

            const refreshed =
                await apiFetch(
                    "/cart"
                );

            cart =
                (
                    refreshed.items ||
                    []
                ).map(
                    cartItemFromServer
                );

        } else {

            cart =
                serverItems.map(
                    cartItemFromServer
                );
        }

        saveLocal(
            "husna_cart",
            cart
        );

        updateBadges();

    } catch (error) {

        console.warn(
            "Cart sync failed:",
            error
        );
    }

    try {

        const serverWishlist =
            await apiFetch(
                "/wishlist"
            );

        wishlist =
            serverWishlist.products ||
            [];

        updateBadges();

    } catch (error) {

        console.warn(
            "Wishlist sync failed:",
            error
        );
    }
}

/* =========================================================
   FAQ
   ========================================================= */

const FAQ_DATA = [

    {
        q: "Are all artworks handmade?",
        a: "Yes. Each Arabic calligraphy artwork is carefully created with attention to detail unless otherwise stated in the product description."
    },

    {
        q: "Do you offer custom calligraphy?",
        a: "Yes. We create custom Arabic calligraphy based on your requested text, subject to approval and design feasibility."
    },

    {
        q: "Can I cancel or modify my order?",
        a: "You can cancel an order from My Account before it ships. Once production begins on a custom piece, changes are not possible."
    },

    {
        q: "Do you accept returns, exchanges, or refunds?",
        a: "All sales are final. We do not accept returns, exchanges, or refunds."
    },

    {
        q: "What if my order arrives damaged?",
        a: "Contact us within 48 hours of delivery with clear photos of the item and its packaging."
    },

    {
        q: "How long will my order take?",
        a: "Processing time depends on the artwork and whether it is custom-made. Estimated shipping times are shared at checkout."
    },

    {
        q: "Do you ship internationally?",
        a: "We currently ship all over India. For international requests, please contact us directly."
    },

    {
        q: "How should I care for my artwork?",
        a: "Keep your artwork away from direct sunlight, excessive humidity, and water. Handle it with care."
    },

    {
        q: "Can I use your artwork commercially?",
        a: "No. All artwork is protected by copyright and may not be reproduced, distributed, or used commercially without permission."
    },

    {
        q: "How can I contact you?",
        a: "You can reach Husna Artistry through the Contact section, WhatsApp, phone, or email."
    }
];

function renderFaq() {

    const list =
        $("faqList");

    if (!list) return;

    list.innerHTML =
        FAQ_DATA.map(
            (item, index) =>
                `

                    <div
                        class="faq-item"
                        data-idx="${index}"
                    >

                        <button
                            class="faq-question"
                            type="button"
                        >

                            <span>
                                ${escapeHtml(
                                    item.q
                                )}
                            </span>

                            <span
                                class="plus"
                            >
                                +
                            </span>

                        </button>

                        <div
                            class="faq-answer"
                        >

                            <p>
                                ${escapeHtml(
                                    item.a
                                )}
                            </p>

                        </div>

                    </div>
                `
        ).join("");

    list
        .querySelectorAll(
            ".faq-item"
        )
        .forEach(item => {

            const question =
                item.querySelector(
                    ".faq-question"
                );

            if (!question) return;

            question.addEventListener(
                "click",
                () => {

                    const wasOpen =
                        item.classList.contains(
                            "open"
                        );

                    list
                        .querySelectorAll(
                            ".faq-item"
                        )
                        .forEach(
                            faq =>
                                faq.classList.remove(
                                    "open"
                                )
                        );

                    if (!wasOpen) {

                        item.classList.add(
                            "open"
                        );
                    }
                }
            );
        });
}

/* =========================================================
   CONTACT
   ========================================================= */

const contactForm =
    $("contactForm");

if (contactForm) {

    contactForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const name =
                contactForm.name.value.trim();

            const email =
                contactForm.email.value.trim();

            const message =
                contactForm.message.value.trim();

            const whatsappMessage =
                `Hello Husna Artistry,

I'm ${name} (${email}).

${message}`;

            window.open(
                `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    whatsappMessage
                )}`,
                "_blank"
            );

            contactForm.reset();

            showToast(
                "Opening WhatsApp..."
            );
        }
    );
}

/* =========================================================
   POLICIES
   ========================================================= */

const POLICIES = {

    returns: {

        title:
            "Return Policy",

        body:
            `All sales at Husna Artistry are final.

We do not accept returns, exchanges, or refunds on products.

If your order arrives damaged or you receive the wrong item due to our error, contact us within 48 hours of delivery with clear photographs.

For questions, contact ${BUSINESS_EMAIL} or +91 93911 19262.`
    },

    shipping: {

        title:
            "Shipping Policy",

        body:
            `We currently ship all over India.

Shipping is free across India.

Online payment only. Cash on Delivery is not available.

Processing and delivery times depend on the artwork and are shared at order confirmation.`
    },

    privacy: {

        title:
            "Privacy Policy",

        body:
            `Husna Artistry respects your privacy.

Information such as your name, email, phone number and shipping address is used to process orders and communicate with you.

We do not sell or rent personal information.

Payments are processed securely through the payment provider.

For privacy questions, contact ${BUSINESS_EMAIL}.`
    },

    terms: {

        title:
            "Terms & Conditions",

        body:
            `By placing an order with Husna Artistry, you agree to these Terms & Conditions.

1. Products
Artwork is handmade and slight variations may occur.

2. Orders & Payments
Orders are confirmed after the required payment is received.

3. Custom Orders
Customers must provide accurate text and instructions.

4. Shipping
Delivery times are estimates and may vary.

5. Returns
All sales are final.

6. Damaged Items
Contact us within 48 hours with photographs.

7. Intellectual Property
Artwork, photographs and website content remain the property of Husna Artistry.

8. Islamic Content
Please handle Qur'anic and Islamic artwork respectfully.

9. Contact
Email: ${BUSINESS_EMAIL}
Phone: +91 93911 19262`
    }
};

/* Policy links */

document.querySelectorAll(
    "[data-policy]"
).forEach(link => {

    link.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const policy =
                POLICIES[
                    link.dataset.policy
                ];

            if (!policy) return;

            const title =
                $("policyTitle");

            const body =
                $("policyBody");

            if (title) {
                title.textContent =
                    policy.title;
            }

            if (body) {
                body.textContent =
                    policy.body;
            }

            openModal(
                "policyModal"
            );
        }
    );
});

/* =========================================================
   BACK TO TOP
   ========================================================= */

document.querySelectorAll(
    '[href="#home"]'
).forEach(link => {

    link.addEventListener(
        "click",
        event => {

            event.preventDefault();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            closeSidebarFn();
        }
    );
});

/* =========================================================
   INITIALIZATION
   ========================================================= */

async function init() {

    console.log(
        "Husna Artistry JS started."
    );

    /* Footer year */

    const footerYear =
        $("footerYear");

    if (footerYear) {

        footerYear.textContent =
            new Date()
                .getFullYear();
    }

    /* Initial badges */

    updateBadges();

    /* Initial drawers */

    renderCart();

    renderWishlist();

    /* FAQ */

    renderFaq();

    /* User */

    if (
        typeof getToken ===
        "function" &&
        getToken()
    ) {

        try {

            const result =
                await apiFetch(
                    "/auth/me"
                );

            currentUser =
                result.user ||
                result;

            await syncCartAfterLogin();

        } catch (error) {

            if (
                typeof setToken ===
                "function"
            ) {
                setToken(null);
            }

            currentUser =
                null;
        }
    }

    /* Categories */

    await loadCategories();

    /* Products */

    await loadProducts();

    /* Final UI */

    updateBadges();

    renderCart();

    renderWishlist();

    console.log(
        "Husna Artistry initialized successfully."
    );
}

/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}

document.addEventListener("DOMContentLoaded", () => {
    /*
     * FAQ ACCORDION
     * Automatically finds FAQ items and makes them clickable.
     */

    const faqItems = document.querySelectorAll(
        ".faq-item, .faq-card, .faq-question, [data-faq]"
    );

    if (!faqItems.length) {
        console.warn("FAQ elements were not found.");
        return;
    }

    // --------------------------------------------------
    // CASE 1:
    // FAQ item contains question + answer
    // --------------------------------------------------

    document.querySelectorAll(".faq-item, .faq-card").forEach((item) => {
        const question =
            item.querySelector(".faq-question") ||
            item.querySelector("[data-faq-question]") ||
            item.querySelector("button");

        const answer =
            item.querySelector(".faq-answer") ||
            item.querySelector("[data-faq-answer]");

        if (!question || !answer) return;

        // Initial state
        answer.style.maxHeight = "0px";
        answer.style.overflow = "hidden";
        answer.style.opacity = "0";
        answer.style.transition =
            "max-height 0.45s ease, opacity 0.3s ease, padding 0.3s ease";

        question.style.cursor = "pointer";

        question.addEventListener("click", () => {
            const isOpen = item.classList.contains("active");

            // Close all other FAQ items
            document
                .querySelectorAll(".faq-item.active, .faq-card.active")
                .forEach((otherItem) => {
                    if (otherItem !== item) {
                        otherItem.classList.remove("active");

                        const otherAnswer =
                            otherItem.querySelector(".faq-answer") ||
                            otherItem.querySelector("[data-faq-answer]");

                        if (otherAnswer) {
                            otherAnswer.style.maxHeight = "0px";
                            otherAnswer.style.opacity = "0";
                        }
                    }
                });

            // Toggle current item
            if (!isOpen) {
                item.classList.add("active");

                answer.style.maxHeight = answer.scrollHeight + "px";
                answer.style.opacity = "1";
            } else {
                item.classList.remove("active");

                answer.style.maxHeight = "0px";
                answer.style.opacity = "0";
            }
        });
    });

    // --------------------------------------------------
    // CASE 2:
    // FAQ uses data attributes
    // --------------------------------------------------

    document.querySelectorAll("[data-faq-question]").forEach((question) => {
        question.addEventListener("click", () => {
            const targetId = question.getAttribute("data-faq-question");

            const answer = document.querySelector(
                `[data-faq-answer="${targetId}"]`
            );

            if (!answer) return;

            const isOpen = answer.classList.contains("open");

            // Close other answers
            document.querySelectorAll("[data-faq-answer]").forEach((other) => {
                other.classList.remove("open");
                other.style.maxHeight = "0px";
                other.style.opacity = "0";
            });

            if (!isOpen) {
                answer.classList.add("open");
                answer.style.maxHeight = answer.scrollHeight + "px";
                answer.style.opacity = "1";
            }
        });
    });

    // --------------------------------------------------
    // Keyboard accessibility
    // --------------------------------------------------

    document
        .querySelectorAll(".faq-question, [data-faq-question]")
        .forEach((question) => {
            question.setAttribute("tabindex", "0");

            question.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    question.click();
                }
            });
        });

    console.log("FAQ accordion initialized successfully.");
});