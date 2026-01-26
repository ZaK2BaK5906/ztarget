// =====================================
// WEAZEL NEWS - NUI SCRIPT (FIXED)
// =====================================

let articles = [];
let currentIndex = 0;
let totalArticles = 0;
let articleImages = [];
let selectedArticles = [];
let categories = [];
let currentVendorId = null;
let printCost = 10;
let imageModalMode = 'list'; // 'list' ou 'inline'

// =====================================
// UTILITY - GET RESOURCE NAME
// =====================================

function getResourceName() {
    if (typeof GetParentResourceName === 'function') {
        return GetParentResourceName();
    }
    return 'p_weazelnews';
}

// =====================================
// CAMERA OVERLAY
// =====================================

let dateTimeInterval = null;

function showOverlay(data) {
    const overlay = document.getElementById('camera-overlay');
    const reporterName = document.getElementById('reporter-name');
    const liveBadge = document.querySelector('.live-badge');
    const recIndicator = document.querySelector('.rec-indicator');
    const breakingNews = document.querySelector('.breaking-news');
    const corners = document.querySelectorAll('.corner');
    const logoText = document.querySelector('.logo-text');
    const ticker = document.getElementById('ticker');

    reporterName.textContent = data.reporterName || 'Reporter';
    if (logoText) logoText.textContent = data.title || 'WEAZEL';
    if (data.subtitle) {
        const liveBadgeText = liveBadge.querySelector('span:last-child');
        if (liveBadgeText) liveBadgeText.textContent = data.subtitle;
    }
    if (ticker && data.ticker) ticker.textContent = data.ticker;

    if (liveBadge) liveBadge.style.display = data.showLiveBadge !== false ? 'flex' : 'none';
    if (recIndicator) recIndicator.style.display = data.showRecIndicator !== false ? 'flex' : 'none';
    if (breakingNews) breakingNews.style.display = data.showTicker !== false ? 'flex' : 'none';
    corners.forEach(corner => {
        corner.style.display = data.showCorners !== false ? 'block' : 'none';
    });

    overlay.classList.remove('hidden');

    if (dateTimeInterval) clearInterval(dateTimeInterval);
    if (data.showDateTime !== false) {
        updateDateTime();
        dateTimeInterval = setInterval(updateDateTime, 1000);
    }
}

function hideOverlay() {
    const overlay = document.getElementById('camera-overlay');
    overlay.classList.add('hidden');
    if (dateTimeInterval) {
        clearInterval(dateTimeInterval);
        dateTimeInterval = null;
    }
}

function updateDateTime() {
    const datetime = document.getElementById('datetime');
    const now = new Date();
    datetime.textContent = now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// =====================================
// IMAGE MODAL (REMPLACE PROMPT)
// =====================================

function openImageModal(mode) {
    imageModalMode = mode;
    document.getElementById('image-modal').classList.remove('hidden');
    document.getElementById('image-url-input').value = '';
    setTimeout(() => {
        document.getElementById('image-url-input').focus();
    }, 100);
}

function closeImageModal() {
    document.getElementById('image-modal').classList.add('hidden');
}

function confirmImageUrl() {
    const url = document.getElementById('image-url-input').value.trim();
    if (!url) {
        shakeElement(document.getElementById('image-url-input'));
        return;
    }

    if (imageModalMode === 'inline') {
        // Inserer dans le contenu
        const content = document.getElementById('article-content');
        const pos = content.selectionStart;
        const text = content.value;
        content.value = text.slice(0, pos) + `[IMG:${url}]` + text.slice(pos);
        content.focus();
    } else {
        // Ajouter a la liste
        articleImages.push(url);
        renderImagesList();
    }

    closeImageModal();
}

// =====================================
// ARTICLE WRITER
// =====================================

function openWriter(data) {
    const writer = document.getElementById('article-writer');
    writer.classList.remove('hidden');

    // Populate categories
    const categorySelect = document.getElementById('article-category');
    categorySelect.innerHTML = '';
    categories = data.categories || ['Actualites', 'Politique', 'Economie', 'Sport', 'Faits Divers', 'Culture', 'Meteo', 'Interview'];
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    // Reset form
    document.getElementById('article-title').value = '';
    document.getElementById('article-subtitle').value = '';
    document.getElementById('article-category').value = 'Actualites';
    document.getElementById('article-content').value = '';
    document.getElementById('char-count').textContent = '0';
    document.getElementById('images-list').innerHTML = '';
    articleImages = [];

    setTimeout(() => document.getElementById('article-title').focus(), 100);
}

function closeWriter() {
    document.getElementById('article-writer').classList.add('hidden');
    fetch(`https://${getResourceName()}/closeWriter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}

function publishArticle() {
    const title = document.getElementById('article-title').value.trim();
    const subtitle = document.getElementById('article-subtitle').value.trim();
    const category = document.getElementById('article-category').value;
    const content = document.getElementById('article-content').value.trim();

    if (!title) {
        shakeElement(document.getElementById('article-title'));
        return;
    }
    if (!content) {
        shakeElement(document.getElementById('article-content'));
        return;
    }

    fetch(`https://${getResourceName()}/publishArticle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title, subtitle, category, content,
            images: articleImages,
            status: 'published'
        })
    }).catch(() => {});
}

function saveDraft() {
    const title = document.getElementById('article-title').value.trim();
    const subtitle = document.getElementById('article-subtitle').value.trim();
    const category = document.getElementById('article-category').value;
    const content = document.getElementById('article-content').value.trim();

    if (!title) {
        shakeElement(document.getElementById('article-title'));
        return;
    }

    fetch(`https://${getResourceName()}/saveDraft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title, subtitle, category, content,
            images: articleImages,
            status: 'draft'
        })
    }).catch(() => {});
}

// Editor toolbar functions
function insertImage() {
    openImageModal('inline');
}

function insertSeparator() {
    const content = document.getElementById('article-content');
    const pos = content.selectionStart;
    const text = content.value;
    content.value = text.slice(0, pos) + '\n---\n' + text.slice(pos);
    content.focus();
}

function insertQuote() {
    const content = document.getElementById('article-content');
    const pos = content.selectionStart;
    const end = content.selectionEnd;
    const text = content.value;
    const selected = text.slice(pos, end);
    content.value = text.slice(0, pos) + `[QUOTE]${selected || 'Texte de la citation'}[/QUOTE]` + text.slice(end);
    content.focus();
}

function insertSubtitle() {
    const content = document.getElementById('article-content');
    const pos = content.selectionStart;
    const end = content.selectionEnd;
    const text = content.value;
    const selected = text.slice(pos, end);
    content.value = text.slice(0, pos) + `[H2]${selected || 'Titre de section'}[/H2]` + text.slice(end);
    content.focus();
}

function addImageUrl() {
    openImageModal('list');
}

function removeImage(index) {
    articleImages.splice(index, 1);
    renderImagesList();
}

function renderImagesList() {
    const container = document.getElementById('images-list');
    container.innerHTML = articleImages.map((url, i) => `
        <div class="image-item">
            <div class="preview"><img src="${url}" onerror="this.style.display='none'" alt=""></div>
            <span style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${url.substring(0, 30)}...</span>
            <button class="remove-btn" onclick="removeImage(${i})"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease';
    element.style.borderColor = '#8b0000';
    setTimeout(() => {
        element.style.animation = '';
        element.style.borderColor = '';
    }, 500);
}

// =====================================
// NOTE WRITER
// =====================================

function openNoteWriter(data) {
    document.getElementById('note-writer').classList.remove('hidden');
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    setTimeout(() => document.getElementById('note-title').focus(), 100);
}

function closeNoteWriter() {
    document.getElementById('note-writer').classList.add('hidden');
    fetch(`https://${getResourceName()}/closeNoteWriter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}

function saveNote() {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();

    if (!title) {
        shakeElement(document.getElementById('note-title'));
        return;
    }
    if (!content) {
        shakeElement(document.getElementById('note-content'));
        return;
    }

    fetch(`https://${getResourceName()}/saveNote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
    }).catch(() => {});
}

// =====================================
// NOTE READER
// =====================================

function openNoteReader(data) {
    document.getElementById('note-reader').classList.remove('hidden');
    document.getElementById('note-title-display').textContent = data.title;
    document.getElementById('note-content-display').textContent = data.content;
    document.getElementById('note-date').textContent = data.date || new Date().toLocaleDateString('fr-FR');
}

function closeNoteReader() {
    document.getElementById('note-reader').classList.add('hidden');
    fetch(`https://${getResourceName()}/closeNoteReader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}

// =====================================
// NEWSPAPER READER
// =====================================

function openNewspaper(data) {
    articles = data.articles || [];
    currentIndex = (data.currentIndex || 1) - 1;
    totalArticles = data.totalArticles || articles.length;

    if (articles.length === 0) return;

    document.getElementById('newspaper-reader').classList.remove('hidden');
    document.getElementById('newspaper-date').textContent = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('newspaper-edition').textContent = data.editionName || 'Edition Standard';

    displayArticle(currentIndex);
    updatePageIndicator();
}

function closeNewspaper() {
    document.getElementById('newspaper-reader').classList.add('hidden');
    fetch(`https://${getResourceName()}/closeNewspaper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}

function displayArticle(index) {
    if (index < 0 || index >= articles.length) return;

    const article = articles[index];
    document.getElementById('np-article-title').textContent = article.title;
    document.getElementById('np-article-subtitle').textContent = article.subtitle || '';
    document.getElementById('np-article-author').textContent = 'Par ' + article.author;
    document.getElementById('np-article-category').textContent = article.category;

    // Parse content with special formatting
    document.getElementById('np-article-content').innerHTML = parseArticleContent(article.content);

    const mainArticle = document.querySelector('.main-article');
    if (mainArticle) {
        mainArticle.style.animation = 'none';
        setTimeout(() => mainArticle.style.animation = 'fadeIn 0.3s ease', 10);
    }
}

function parseArticleContent(content) {
    if (!content) return '';

    // Escape HTML
    let html = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Parse [IMG:url]
    html = html.replace(/\[IMG:(.*?)\]/g, '<div class="article-image"><img src="$1" alt="Image"></div>');

    // Parse ---
    html = html.replace(/^---$/gm, '<hr class="article-separator">');

    // Parse [QUOTE]...[/QUOTE]
    html = html.replace(/\[QUOTE\]([\s\S]*?)\[\/QUOTE\]/g, '<blockquote class="article-quote">$1</blockquote>');

    // Parse [H2]...[/H2]
    html = html.replace(/\[H2\](.*?)\[\/H2\]/g, '<h2 class="article-h2">$1</h2>');

    // Paragraphs
    html = html.split('\n\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');

    return html;
}

function changePage(data) {
    const newIndex = (data.currentIndex || 1) - 1;
    const direction = data.direction;

    const newspaper = document.querySelector('.newspaper');
    if (newspaper) {
        newspaper.classList.add(direction === 'next' ? 'page-turning-next' : 'page-turning-prev');

        setTimeout(() => {
            currentIndex = newIndex;
            displayArticle(currentIndex);
            updatePageIndicator();
            newspaper.classList.remove('page-turning-next', 'page-turning-prev');
        }, 200);
    }
}

function updatePageIndicator() {
    document.getElementById('current-page').textContent = currentIndex + 1;
    document.getElementById('total-pages').textContent = totalArticles;
}

// =====================================
// NEWSPAPER SHOP
// =====================================

function openShop(data) {
    currentVendorId = data.vendorId;
    document.getElementById('newspaper-shop').classList.remove('hidden');

    const editionsList = document.getElementById('editions-list');
    const noEditions = document.getElementById('no-editions');

    if (!data.editions || data.editions.length === 0) {
        editionsList.innerHTML = '';
        noEditions.classList.remove('hidden');
    } else {
        noEditions.classList.add('hidden');
        editionsList.innerHTML = data.editions.map(ed => `
            <div class="edition-item" onclick="buyEdition(${ed.id})">
                <h3>${ed.name}</h3>
                <div class="edition-info">
                    <span>${ed.articles} article(s)</span>
                    <span class="edition-price">$${ed.price}</span>
                </div>
            </div>
        `).join('');
    }
}

function closeShop() {
    document.getElementById('newspaper-shop').classList.add('hidden');
    fetch(`https://${getResourceName()}/closeShop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}

function buyEdition(editionId) {
    fetch(`https://${getResourceName()}/buyEdition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editionId, vendorId: currentVendorId })
    }).catch(() => {});
}

// =====================================
// PRINT INTERFACE
// =====================================

function openPrint(data) {
    document.getElementById('print-interface').classList.remove('hidden');
    document.getElementById('edition-name').value = '';
    document.getElementById('edition-price').value = data.defaultPrice || 50;
    printCost = data.printCost || 10;
    document.getElementById('print-cost').textContent = '$' + printCost;
    selectedArticles = [];
    updateSelectedCount();

    const articlesSelect = document.getElementById('articles-select');
    if (!data.articles || data.articles.length === 0) {
        articlesSelect.innerHTML = '<p style="color:#6b6b6b;text-align:center;padding:20px;font-style:italic;">Aucun article publie disponible</p>';
    } else {
        articlesSelect.innerHTML = data.articles.map(a => `
            <div class="article-select-item" onclick="toggleArticleSelect(${a.id}, this)">
                <input type="checkbox" id="article-${a.id}">
                <div class="article-info">
                    <h4>${a.title}</h4>
                    <span>${a.category} - Par ${a.author}</span>
                </div>
            </div>
        `).join('');
    }
}

function closePrint() {
    document.getElementById('print-interface').classList.add('hidden');
    fetch(`https://${getResourceName()}/closePrint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}

function toggleArticleSelect(articleId, element) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    const index = selectedArticles.indexOf(articleId);

    if (index > -1) {
        selectedArticles.splice(index, 1);
        checkbox.checked = false;
        element.classList.remove('selected');
    } else if (selectedArticles.length < 5) {
        selectedArticles.push(articleId);
        checkbox.checked = true;
        element.classList.add('selected');
    }

    updateSelectedCount();
}

function updateSelectedCount() {
    document.getElementById('selected-count').textContent = selectedArticles.length;
}

function printEdition() {
    const name = document.getElementById('edition-name').value.trim();
    const price = parseInt(document.getElementById('edition-price').value) || 50;

    if (!name) {
        shakeElement(document.getElementById('edition-name'));
        return;
    }
    if (selectedArticles.length === 0) {
        return;
    }

    fetch(`https://${getResourceName()}/printEdition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, articleIds: selectedArticles })
    }).catch(() => {});
}

// =====================================
// STOCK INTERFACE
// =====================================

function openStock(data) {
    currentVendorId = data.vendorId;
    document.getElementById('stock-interface').classList.remove('hidden');
    document.getElementById('stock-title').textContent = 'Stock - ' + (data.vendorLabel || 'Point de vente');

    // Current stock
    const currentStock = document.getElementById('current-stock');
    const noCurrentStock = document.getElementById('no-current-stock');
    if (!data.stock || data.stock.length === 0) {
        currentStock.innerHTML = '';
        noCurrentStock.classList.remove('hidden');
    } else {
        noCurrentStock.classList.add('hidden');
        currentStock.innerHTML = data.stock.map(s => `
            <div class="stock-item">
                <div class="stock-info">
                    <h4>${s.name}</h4>
                    <span>$${s.price}</span>
                </div>
                <div class="stock-quantity">${s.quantity}</div>
            </div>
        `).join('');
    }

    // Editions available to add
    const editionsAvailable = document.getElementById('editions-available');
    const noEditionsStock = document.getElementById('no-editions-stock');
    if (!data.editions || data.editions.length === 0) {
        editionsAvailable.innerHTML = '';
        noEditionsStock.classList.remove('hidden');
    } else {
        noEditionsStock.classList.add('hidden');
        editionsAvailable.innerHTML = data.editions.map(e => `
            <div class="edition-add-item">
                <div class="edition-info">
                    <h4>${e.name}</h4>
                    <span>${e.articles} article(s)</span>
                </div>
                <div class="add-controls">
                    <input type="number" id="qty-${e.id}" value="1" min="1" max="50">
                    <button class="btn-add" onclick="addStock(${e.id})">Ajouter</button>
                </div>
            </div>
        `).join('');
    }
}

function closeStock() {
    document.getElementById('stock-interface').classList.add('hidden');
    fetch(`https://${getResourceName()}/closeStock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}

function addStock(editionId) {
    const qty = parseInt(document.getElementById('qty-' + editionId).value) || 1;
    fetch(`https://${getResourceName()}/addStock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editionId, quantity: qty, vendorId: currentVendorId })
    }).catch(() => {});
}

// =====================================
// NUI MESSAGE HANDLER
// =====================================

window.addEventListener('message', function(event) {
    const data = event.data;

    switch (data.action) {
        case 'showOverlay': showOverlay(data.data); break;
        case 'hideOverlay': hideOverlay(); break;
        case 'openWriter': openWriter(data.data); break;
        case 'closeWriter': document.getElementById('article-writer').classList.add('hidden'); break;
        case 'openNoteWriter': openNoteWriter(data.data); break;
        case 'closeNoteWriter': document.getElementById('note-writer').classList.add('hidden'); break;
        case 'openNoteReader': openNoteReader(data.data); break;
        case 'closeNoteReader': document.getElementById('note-reader').classList.add('hidden'); break;
        case 'openNewspaper': openNewspaper(data.data); break;
        case 'closeNewspaper': document.getElementById('newspaper-reader').classList.add('hidden'); break;
        case 'changePage': changePage(data.data); break;
        case 'openShop': openShop(data.data); break;
        case 'closeShop': document.getElementById('newspaper-shop').classList.add('hidden'); break;
        case 'openPrint': openPrint(data.data); break;
        case 'closePrint': document.getElementById('print-interface').classList.add('hidden'); break;
        case 'openStock': openStock(data.data); break;
        case 'closeStock': document.getElementById('stock-interface').classList.add('hidden'); break;
    }
});

// =====================================
// KEYBOARD HANDLER
// =====================================

document.addEventListener('keydown', function(event) {
    // Handle Enter in image modal
    if (!document.getElementById('image-modal').classList.contains('hidden')) {
        if (event.key === 'Enter') {
            event.preventDefault();
            confirmImageUrl();
        } else if (event.key === 'Escape') {
            closeImageModal();
        }
        return;
    }

    if (event.key === 'Escape') {
        const modals = [
            { id: 'article-writer', close: closeWriter },
            { id: 'note-writer', close: closeNoteWriter },
            { id: 'note-reader', close: closeNoteReader },
            { id: 'newspaper-reader', close: closeNewspaper },
            { id: 'newspaper-shop', close: closeShop },
            { id: 'print-interface', close: closePrint },
            { id: 'stock-interface', close: closeStock }
        ];

        for (const modal of modals) {
            const el = document.getElementById(modal.id);
            if (el && !el.classList.contains('hidden')) {
                modal.close();
                break;
            }
        }
    }
});

// =====================================
// CHARACTER COUNTER
// =====================================

document.addEventListener('DOMContentLoaded', function() {
    const contentArea = document.getElementById('article-content');
    const charCount = document.getElementById('char-count');

    if (contentArea && charCount) {
        contentArea.addEventListener('input', function() {
            charCount.textContent = this.value.length;
            if (this.value.length > 10000) {
                this.value = this.value.substring(0, 10000);
                charCount.textContent = '10000';
            }
        });
    }
});
