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

    // Handle arrow keys for newspaper navigation
    const newspaperReader = document.getElementById('newspaper-reader');
    if (newspaperReader && !newspaperReader.classList.contains('hidden')) {
        if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
            event.preventDefault();
            navigateNewspaper('next');
        } else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
            event.preventDefault();
            navigateNewspaper('prev');
        } else if (event.key === 'Escape') {
            closeNewspaper();
        }
        return;
    }

    if (event.key === 'Escape') {
        const modals = [
            { id: 'article-writer', close: closeWriter },
            { id: 'note-writer', close: closeNoteWriter },
            { id: 'note-reader', close: closeNoteReader },
            { id: 'newspaper-shop', close: closeShop },
            { id: 'print-interface', close: closePrint },
            { id: 'stock-interface', close: closeStock },
            { id: 'edition-editor', close: closeEditionEditor }
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

function navigateNewspaper(direction) {
    if (direction === 'next') {
        fetch(`https://${getResourceName()}/nextPage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        }).catch(() => {});
    } else {
        fetch(`https://${getResourceName()}/prevPage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        }).catch(() => {});
    }
}

// Character counter integre dans DOMContentLoaded final

// =====================================
// EDITEUR D'EDITION AVANCE
// =====================================

let editorArticles = [];
let editorAds = [];
let editorLayout = {
    une: null,
    col1: [],
    col2: [],
    col3: [],
    banner: null
};
let selectedElement = null;
let canvasZoom = 1;
let printCostBase = 10;
let draggedElement = null;
let draggedType = null;
let draggedId = null;
let editorCategories = ['Actualites', 'Politique', 'Economie', 'Sport', 'Faits Divers', 'Culture', 'Meteo', 'Interview'];
let editorArticleImages = [];
let editingArticleId = null;

function openEditionEditor(data) {
    document.getElementById('edition-editor').classList.remove('hidden');

    // Reset
    editorArticles = data.articles || [];
    editorAds = [];
    editorLayout = { une: null, col1: [], col2: [], col3: [], banner: null };
    selectedElement = null;
    canvasZoom = 1;
    printCostBase = data.printCost || 10;
    editorCategories = data.categories || editorCategories;
    editorArticleImages = [];
    editingArticleId = null;

    // Set date
    const dateText = document.getElementById('canvas-date-text');
    if (dateText) {
        dateText.textContent = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    // Render articles and setup
    renderArticlesPool();
    setupEditorCategorySelect();
    updateSummary();
    resetAllZones();
    initDragAndDrop();
}

function closeEditionEditor() {
    document.getElementById('edition-editor').classList.add('hidden');
    fetch(`https://${getResourceName()}/closeEditionEditor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}

function switchEditorTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === 'tab-' + tabName);
    });

    // Si on va sur l'onglet write, focus sur le titre
    if (tabName === 'write') {
        setTimeout(() => {
            const titleInput = document.getElementById('ee-article-title');
            if (titleInput) titleInput.focus();
        }, 100);
    }
}

// =====================================
// DRAG AND DROP AMELIORE
// =====================================

function initDragAndDrop() {
    // Initialiser les zones de drop
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragenter', handleDragEnter);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(event) {
    event.preventDefault();
    const zone = event.currentTarget;
    if (zone && zone.classList.contains('drop-zone')) {
        zone.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    event.preventDefault();
    const zone = event.currentTarget;
    // Verifier qu'on quitte vraiment la zone et pas un enfant
    const rect = zone.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
        zone.classList.remove('drag-over');
    }
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const zone = event.currentTarget;
    zone.classList.remove('drag-over');

    if (!draggedType || draggedId === null) return;

    const zoneName = zone.dataset.zone;

    if (draggedType === 'article') {
        const article = editorArticles.find(a => a.id === draggedId);
        if (!article) return;

        // Verifier si l'article n'est pas deja utilise
        if (isArticleUsed(article.id)) {
            showEditorNotification('Cet article est deja utilise dans l\'edition', 'warning');
            return;
        }

        if (zoneName === 'une') {
            editorLayout.une = { type: 'article', id: article.id, data: article };
        } else if (zoneName.startsWith('col')) {
            editorLayout[zoneName].push({ type: 'article', id: article.id, data: article });
        }
    } else if (draggedType === 'ad') {
        const ad = editorAds.find(a => a.id === draggedId);
        if (!ad) return;

        if (zoneName === 'banner') {
            editorLayout.banner = { type: 'ad', id: ad.id, data: ad };
        } else if (zoneName.startsWith('col')) {
            editorLayout[zoneName].push({ type: 'ad', id: ad.id, data: ad });
        }
    } else if (draggedType === 'element') {
        // Elements decoratifs
        const elementData = { type: 'element', elementType: draggedId, id: Date.now() };
        if (zoneName.startsWith('col')) {
            editorLayout[zoneName].push(elementData);
        }
    }

    renderZone(zoneName);
    renderArticlesPool();
    renderCreatedAds();
    updateSummary();

    // Reset
    draggedElement = null;
    draggedType = null;
    draggedId = null;
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
}

function renderArticlesPool() {
    const pool = document.getElementById('articles-pool');
    if (!pool) return;

    if (editorArticles.length === 0) {
        pool.innerHTML = '<div class="empty-pool"><i class="fas fa-file-alt"></i><p>Aucun article disponible</p><p class="hint">Creez un article avec l\'onglet "Rediger"</p></div>';
        return;
    }

    pool.innerHTML = editorArticles.map((article, index) => {
        const isUsed = isArticleUsed(article.id);
        return `
            <div class="article-card ${isUsed ? 'used' : ''}"
                 draggable="${!isUsed}"
                 data-article-id="${article.id}"
                 data-article-index="${index}"
                 data-drag-type="article"
                 data-drag-id="${article.id}">
                <div class="article-card-status">${isUsed ? '<i class="fas fa-check"></i>' : ''}</div>
                <h4>${article.title}</h4>
                <div class="article-card-meta">
                    <span class="article-card-category">${article.category}</span>
                    <span>${article.author}</span>
                </div>
                <div class="article-card-actions">
                    <button class="btn-card-action" onclick="editArticleInEditor(${article.id})" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="btn-card-action" onclick="previewArticleInEditor(${article.id})" title="Apercu"><i class="fas fa-eye"></i></button>
                </div>
            </div>
        `;
    }).join('');

    // Attacher les evenements drag
    pool.querySelectorAll('.article-card[draggable="true"]').forEach(card => {
        card.addEventListener('dragstart', handleArticleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });
}

function handleArticleDragStart(event) {
    const card = event.currentTarget;
    draggedType = card.dataset.dragType;
    draggedId = parseInt(card.dataset.dragId);
    draggedElement = card;
    card.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `${draggedType}:${draggedId}`);
}

function handleAdDragStart(event) {
    const card = event.currentTarget;
    draggedType = 'ad';
    draggedId = parseInt(card.dataset.adId);
    draggedElement = card;
    card.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `ad:${draggedId}`);
}

function handleElementDragStart(event) {
    const el = event.currentTarget;
    draggedType = 'element';
    draggedId = el.dataset.elementType;
    draggedElement = el;
    el.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `element:${draggedId}`);
}

function handleDragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.drop-zone.drag-over').forEach(z => z.classList.remove('drag-over'));
    draggedElement = null;
    draggedType = null;
    draggedId = null;
}

function isArticleUsed(articleId) {
    if (editorLayout.une && editorLayout.une.id === articleId) return true;
    if (editorLayout.col1.some(item => item.type === 'article' && item.id === articleId)) return true;
    if (editorLayout.col2.some(item => item.type === 'article' && item.id === articleId)) return true;
    if (editorLayout.col3.some(item => item.type === 'article' && item.id === articleId)) return true;
    return false;
}

function filterArticles() {
    const search = document.getElementById('article-search').value.toLowerCase();
    document.querySelectorAll('#articles-pool .article-card').forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        card.style.display = title.includes(search) ? 'flex' : 'none';
    });
}

// Legacy functions pour compatibilite
function dragStart(event, type, id) {
    draggedType = type;
    draggedId = id;
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `${type}:${id}`);
}

function allowDrop(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function dragEnter(event) {
    event.preventDefault();
    const zone = event.target.closest('.drop-zone');
    if (zone) zone.classList.add('drag-over');
}

function dragLeave(event) {
    event.preventDefault();
    const zone = event.target.closest('.drop-zone');
    if (zone) {
        const rect = zone.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX >= rect.right ||
            event.clientY < rect.top || event.clientY >= rect.bottom) {
            zone.classList.remove('drag-over');
        }
    }
}

function dropItem(event) {
    event.preventDefault();
    event.stopPropagation();
    const zone = event.target.closest('.drop-zone');
    if (!zone) return;
    zone.classList.remove('drag-over');

    const zoneName = zone.dataset.zone;

    if (draggedType === 'article') {
        const article = editorArticles.find(a => a.id === draggedId);
        if (!article) return;
        if (isArticleUsed(article.id)) {
            showEditorNotification('Article deja utilise', 'warning');
            return;
        }
        if (zoneName === 'une') {
            editorLayout.une = { type: 'article', id: article.id, data: article };
        } else if (zoneName.startsWith('col')) {
            editorLayout[zoneName].push({ type: 'article', id: article.id, data: article });
        }
    } else if (draggedType === 'ad') {
        const ad = editorAds.find(a => a.id === draggedId);
        if (!ad) return;
        if (zoneName === 'banner') {
            editorLayout.banner = { type: 'ad', id: ad.id, data: ad };
        } else if (zoneName.startsWith('col')) {
            editorLayout[zoneName].push({ type: 'ad', id: ad.id, data: ad });
        }
    } else if (draggedType === 'element') {
        const elementData = { type: 'element', elementType: draggedId, id: Date.now() };
        if (zoneName.startsWith('col')) {
            editorLayout[zoneName].push(elementData);
        }
    }

    renderZone(zoneName);
    renderArticlesPool();
    renderCreatedAds();
    updateSummary();

    draggedElement = null;
    draggedType = null;
    draggedId = null;
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
}

function showEditorNotification(message, type = 'info') {
    let notif = document.getElementById('editor-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'editor-notification';
        document.body.appendChild(notif);
    }
    notif.className = 'editor-notification ' + type;
    notif.textContent = message;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 3000);
}

function renderZone(zoneName) {
    const zone = document.querySelector(`.drop-zone[data-zone="${zoneName}"]`);
    if (!zone) return;

    let content = '';

    if (zoneName === 'une') {
        if (editorLayout.une) {
            const item = editorLayout.une;
            content = createDroppedItemHTML(item, zoneName);
            zone.classList.add('has-content');
        } else {
            content = `<div class="drop-placeholder"><i class="fas fa-newspaper"></i><span>Deposez l'article principal ici</span></div>`;
            zone.classList.remove('has-content');
        }
    } else if (zoneName === 'banner') {
        if (editorLayout.banner) {
            const item = editorLayout.banner;
            content = createDroppedAdHTML(item, zoneName);
            zone.classList.add('has-content');
        } else {
            content = `<div class="drop-placeholder"><i class="fas fa-ad"></i><span>Deposez une publicite banniere ici</span></div>`;
            zone.classList.remove('has-content');
        }
    } else if (zoneName.startsWith('col')) {
        const items = editorLayout[zoneName];
        if (items.length > 0) {
            content = items.map((item, index) => {
                if (item.type === 'article') {
                    return createDroppedItemHTML(item, zoneName, index);
                } else if (item.type === 'ad') {
                    return createDroppedAdHTML(item, zoneName, index);
                } else if (item.type === 'element') {
                    return createDroppedElementHTML(item, zoneName, index);
                }
                return '';
            }).join('');
            zone.classList.add('has-content');
        } else {
            content = `<div class="drop-placeholder small"><i class="fas fa-plus"></i><span>Deposer ici</span></div>`;
            zone.classList.remove('has-content');
        }
    }

    zone.innerHTML = content;
}

function createDroppedElementHTML(item, zoneName, index) {
    const icons = {
        'separator': 'fa-grip-lines',
        'quote': 'fa-quote-right',
        'image': 'fa-image',
        'weather': 'fa-cloud-sun',
        'stocks': 'fa-chart-line',
        'spacer': 'fa-arrows-alt-v'
    };
    const labels = {
        'separator': 'Separateur',
        'quote': 'Citation',
        'image': 'Image',
        'weather': 'Meteo',
        'stocks': 'Bourse',
        'spacer': 'Espace'
    };

    return `
        <div class="dropped-element" onclick="selectElement('${zoneName}', ${index})" data-zone="${zoneName}" data-index="${index}">
            <i class="fas ${icons[item.elementType] || 'fa-cube'}"></i>
            <span>${labels[item.elementType] || item.elementType}</span>
            <button class="item-remove" onclick="removeItem(event, '${zoneName}', ${index})"><i class="fas fa-times"></i></button>
        </div>
    `;
}

function createDroppedItemHTML(item, zoneName, index = 0) {
    const article = item.data;
    const preview = article.content ? article.content.substring(0, 150) + '...' : '';
    return `
        <div class="dropped-item" onclick="selectElement('${zoneName}', ${index})" data-zone="${zoneName}" data-index="${index}">
            <h3 class="item-title">${article.title}</h3>
            <p class="item-preview">${preview}</p>
            <button class="item-remove" onclick="removeItem(event, '${zoneName}', ${index})"><i class="fas fa-times"></i></button>
        </div>
    `;
}

function createDroppedAdHTML(item, zoneName, index = 0) {
    const ad = item.data;
    return `
        <div class="dropped-ad" onclick="selectElement('${zoneName}', ${index})" data-zone="${zoneName}" data-index="${index}">
            <span class="ad-label">Publicite</span>
            <div class="ad-business">${ad.business}</div>
            <div class="ad-slogan">${ad.slogan}</div>
            <button class="item-remove" onclick="removeItem(event, '${zoneName}', ${index})"><i class="fas fa-times"></i></button>
        </div>
    `;
}

function removeItem(event, zoneName, index) {
    event.stopPropagation();

    if (zoneName === 'une') {
        editorLayout.une = null;
    } else if (zoneName === 'banner') {
        editorLayout.banner = null;
    } else {
        editorLayout[zoneName].splice(index, 1);
    }

    renderZone(zoneName);
    renderArticlesPool();
    updateSummary();
}

function selectElement(zoneName, index) {
    // Deselect previous
    document.querySelectorAll('.dropped-item.selected, .dropped-ad.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Select new
    const selector = `.drop-zone[data-zone="${zoneName}"] [data-index="${index}"]`;
    const element = document.querySelector(selector);
    if (element) {
        element.classList.add('selected');
        selectedElement = { zoneName, index };
        showProperties(zoneName, index);
    }
}

function showProperties(zoneName, index) {
    const container = document.getElementById('properties-content');
    let item;

    if (zoneName === 'une') {
        item = editorLayout.une;
    } else if (zoneName === 'banner') {
        item = editorLayout.banner;
    } else {
        item = editorLayout[zoneName][index];
    }

    if (!item) {
        container.innerHTML = `<div class="no-selection"><i class="fas fa-mouse-pointer"></i><p>Selectionnez un element pour modifier ses proprietes</p></div>`;
        return;
    }

    if (item.type === 'article') {
        container.innerHTML = `
            <div class="property-group">
                <label>Titre</label>
                <input type="text" value="${item.data.title}" readonly>
            </div>
            <div class="property-group">
                <label>Auteur</label>
                <input type="text" value="${item.data.author}" readonly>
            </div>
            <div class="property-group">
                <label>Categorie</label>
                <input type="text" value="${item.data.category}" readonly>
            </div>
        `;
    } else if (item.type === 'ad') {
        container.innerHTML = `
            <div class="property-group">
                <label>Entreprise</label>
                <input type="text" value="${item.data.business}" readonly>
            </div>
            <div class="property-group">
                <label>Slogan</label>
                <input type="text" value="${item.data.slogan}" readonly>
            </div>
            <div class="property-group">
                <label>Taille</label>
                <input type="text" value="${item.data.size}" readonly>
            </div>
        `;
    }
}

function resetAllZones() {
    ['une', 'col1', 'col2', 'col3', 'banner'].forEach(zone => {
        renderZone(zone);
    });
}

// =====================================
// CREATION D'ARTICLES DANS L'EDITEUR
// =====================================

function setupEditorCategorySelect() {
    const select = document.getElementById('ee-article-category');
    if (!select) return;
    select.innerHTML = editorCategories.map(cat =>
        `<option value="${cat}">${cat}</option>`
    ).join('');
}

function saveArticleFromEditor() {
    const title = document.getElementById('ee-article-title').value.trim();
    const subtitle = document.getElementById('ee-article-subtitle').value.trim();
    const category = document.getElementById('ee-article-category').value;
    const content = document.getElementById('ee-article-content').value.trim();

    if (!title) {
        shakeElement(document.getElementById('ee-article-title'));
        showEditorNotification('Le titre est requis', 'error');
        return;
    }
    if (!content) {
        shakeElement(document.getElementById('ee-article-content'));
        showEditorNotification('Le contenu est requis', 'error');
        return;
    }

    // Envoyer au serveur
    fetch(`https://${getResourceName()}/saveArticleFromEditor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: editingArticleId,
            title,
            subtitle,
            category,
            content,
            images: editorArticleImages,
            status: 'published'
        })
    }).then(() => {
        showEditorNotification(editingArticleId ? 'Article modifie!' : 'Article cree!', 'success');
        clearEditorArticleForm();
        // Retour a l'onglet articles
        switchEditorTab('articles');
    }).catch(() => {});
}

function saveDraftFromEditor() {
    const title = document.getElementById('ee-article-title').value.trim();
    const subtitle = document.getElementById('ee-article-subtitle').value.trim();
    const category = document.getElementById('ee-article-category').value;
    const content = document.getElementById('ee-article-content').value.trim();

    if (!title) {
        shakeElement(document.getElementById('ee-article-title'));
        return;
    }

    fetch(`https://${getResourceName()}/saveArticleFromEditor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: editingArticleId,
            title,
            subtitle,
            category,
            content,
            images: editorArticleImages,
            status: 'draft'
        })
    }).then(() => {
        showEditorNotification('Brouillon sauvegarde!', 'success');
    }).catch(() => {});
}

function clearEditorArticleForm() {
    document.getElementById('ee-article-title').value = '';
    document.getElementById('ee-article-subtitle').value = '';
    document.getElementById('ee-article-category').value = editorCategories[0] || 'Actualites';
    document.getElementById('ee-article-content').value = '';
    editorArticleImages = [];
    editingArticleId = null;
    renderEditorImagesList();
    updateEditorCharCount();
}

function editArticleInEditor(articleId) {
    const article = editorArticles.find(a => a.id === articleId);
    if (!article) return;

    editingArticleId = articleId;
    document.getElementById('ee-article-title').value = article.title || '';
    document.getElementById('ee-article-subtitle').value = article.subtitle || '';
    document.getElementById('ee-article-category').value = article.category || editorCategories[0];
    document.getElementById('ee-article-content').value = article.content || '';
    editorArticleImages = article.images ? [...article.images] : [];
    renderEditorImagesList();
    updateEditorCharCount();

    switchEditorTab('write');
}

function previewArticleInEditor(articleId) {
    const article = editorArticles.find(a => a.id === articleId);
    if (!article) return;

    const modal = document.getElementById('preview-modal');
    const content = document.getElementById('preview-content');

    content.innerHTML = `
        <div style="font-family: Libre Baskerville, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="font-family: Playfair Display, serif; font-size: 28px; margin-bottom: 10px;">${article.title}</h1>
            ${article.subtitle ? `<p style="font-style: italic; color: #666; margin-bottom: 15px; font-size: 16px;">${article.subtitle}</p>` : ''}
            <div style="font-size: 12px; color: #8b7355; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                Par ${article.author} | ${article.category}
            </div>
            <div style="line-height: 1.8; text-align: justify;">
                ${parseArticleContent(article.content || '')}
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function insertEditorImage() {
    openEditorImageModal('inline');
}

function insertEditorSeparator() {
    const content = document.getElementById('ee-article-content');
    const pos = content.selectionStart;
    const text = content.value;
    content.value = text.slice(0, pos) + '\n---\n' + text.slice(pos);
    content.focus();
    updateEditorCharCount();
}

function insertEditorQuote() {
    const content = document.getElementById('ee-article-content');
    const pos = content.selectionStart;
    const end = content.selectionEnd;
    const text = content.value;
    const selected = text.slice(pos, end);
    content.value = text.slice(0, pos) + `[QUOTE]${selected || 'Citation'}[/QUOTE]` + text.slice(end);
    content.focus();
    updateEditorCharCount();
}

function insertEditorSubtitle() {
    const content = document.getElementById('ee-article-content');
    const pos = content.selectionStart;
    const end = content.selectionEnd;
    const text = content.value;
    const selected = text.slice(pos, end);
    content.value = text.slice(0, pos) + `[H2]${selected || 'Sous-titre'}[/H2]` + text.slice(end);
    content.focus();
    updateEditorCharCount();
}

function updateEditorCharCount() {
    const content = document.getElementById('ee-article-content');
    const counter = document.getElementById('ee-char-count');
    if (content && counter) {
        counter.textContent = content.value.length;
    }
}

function addEditorImageUrl() {
    openEditorImageModal('list');
}

let editorImageModalMode = 'list';

function openEditorImageModal(mode) {
    editorImageModalMode = mode;
    document.getElementById('editor-image-modal').classList.remove('hidden');
    document.getElementById('editor-image-url-input').value = '';
    setTimeout(() => document.getElementById('editor-image-url-input').focus(), 100);
}

function closeEditorImageModal() {
    document.getElementById('editor-image-modal').classList.add('hidden');
}

function confirmEditorImageUrl() {
    const url = document.getElementById('editor-image-url-input').value.trim();
    if (!url) {
        shakeElement(document.getElementById('editor-image-url-input'));
        return;
    }

    if (editorImageModalMode === 'inline') {
        const content = document.getElementById('ee-article-content');
        const pos = content.selectionStart;
        const text = content.value;
        content.value = text.slice(0, pos) + `[IMG:${url}]` + text.slice(pos);
        content.focus();
        updateEditorCharCount();
    } else {
        editorArticleImages.push(url);
        renderEditorImagesList();
    }

    closeEditorImageModal();
}

function removeEditorImage(index) {
    editorArticleImages.splice(index, 1);
    renderEditorImagesList();
}

function renderEditorImagesList() {
    const container = document.getElementById('ee-images-list');
    if (!container) return;

    container.innerHTML = editorArticleImages.map((url, i) => `
        <div class="ee-image-item">
            <img src="${url}" onerror="this.style.display='none'" alt="">
            <span>${url.substring(0, 25)}...</span>
            <button onclick="removeEditorImage(${i})"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

// Recevoir un nouvel article cree
function addArticleToEditor(article) {
    // Ajouter a la liste ou mettre a jour
    const existingIndex = editorArticles.findIndex(a => a.id === article.id);
    if (existingIndex >= 0) {
        editorArticles[existingIndex] = article;
    } else {
        editorArticles.unshift(article);
    }
    renderArticlesPool();
    showEditorNotification('Article ajoute a la liste', 'success');
}

// =====================================
// PUBLICITES AMELIOREES
// =====================================

let adIdCounter = 1;

function createAdBlock() {
    const business = document.getElementById('ad-business').value.trim();
    const slogan = document.getElementById('ad-slogan').value.trim();
    const image = document.getElementById('ad-image').value.trim();
    const size = document.getElementById('ad-size').value;
    const contact = document.getElementById('ad-contact') ? document.getElementById('ad-contact').value.trim() : '';
    const color = document.getElementById('ad-color') ? document.getElementById('ad-color').value : '#8b7355';

    if (!business) {
        shakeElement(document.getElementById('ad-business'));
        return;
    }

    const ad = {
        id: adIdCounter++,
        business,
        slogan: slogan || 'Votre partenaire de confiance',
        image,
        size,
        contact,
        color
    };

    editorAds.push(ad);
    renderCreatedAds();
    showEditorNotification('Publicite creee!', 'success');

    // Clear inputs
    document.getElementById('ad-business').value = '';
    document.getElementById('ad-slogan').value = '';
    document.getElementById('ad-image').value = '';
    if (document.getElementById('ad-contact')) document.getElementById('ad-contact').value = '';
}

function deleteAd(adId) {
    editorAds = editorAds.filter(a => a.id !== adId);
    // Supprimer des zones
    if (editorLayout.banner && editorLayout.banner.id === adId) {
        editorLayout.banner = null;
        renderZone('banner');
    }
    ['col1', 'col2', 'col3'].forEach(col => {
        const idx = editorLayout[col].findIndex(item => item.type === 'ad' && item.id === adId);
        if (idx >= 0) {
            editorLayout[col].splice(idx, 1);
            renderZone(col);
        }
    });
    renderCreatedAds();
    updateSummary();
}

function isAdUsed(adId) {
    if (editorLayout.banner && editorLayout.banner.id === adId) return true;
    for (const col of ['col1', 'col2', 'col3']) {
        if (editorLayout[col].some(item => item.type === 'ad' && item.id === adId)) return true;
    }
    return false;
}

function renderCreatedAds() {
    const container = document.getElementById('created-ads');
    if (!container) return;

    if (editorAds.length === 0) {
        container.innerHTML = '<h4>Publicites creees</h4><p class="empty-hint">Aucune publicite creee</p>';
        return;
    }

    container.innerHTML = `<h4>Publicites creees</h4>` + editorAds.map(ad => {
        const used = isAdUsed(ad.id);
        return `
            <div class="ad-block ${used ? 'used' : ''}"
                 draggable="${!used}"
                 data-ad-id="${ad.id}">
                <div class="ad-block-header">
                    <span class="ad-size-badge">${ad.size}</span>
                    <button class="btn-delete-ad" onclick="deleteAd(${ad.id})" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
                <h5>${ad.business}</h5>
                <p>${ad.slogan}</p>
                ${ad.image ? `<img src="${ad.image}" class="ad-preview-img" onerror="this.style.display='none'">` : ''}
                ${used ? '<div class="used-badge"><i class="fas fa-check"></i></div>' : ''}
            </div>
        `;
    }).join('');

    // Attacher evenements drag
    container.querySelectorAll('.ad-block[draggable="true"]').forEach(block => {
        block.addEventListener('dragstart', handleAdDragStart);
        block.addEventListener('dragend', handleDragEnd);
    });
}

// Templates
function applyTemplate() {
    const template = document.getElementById('layout-template').value;
    const grid = document.getElementById('canvas-grid');

    // Reset layout
    editorLayout.col1 = [];
    editorLayout.col2 = [];
    editorLayout.col3 = [];

    switch (template) {
        case 'classic':
            grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            document.querySelectorAll('.canvas-column').forEach(col => col.style.display = 'block');
            break;
        case 'modern':
            grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            document.querySelectorAll('.canvas-column').forEach(col => col.style.display = 'block');
            break;
        case 'tabloid':
            grid.style.gridTemplateColumns = '2fr 1fr';
            document.querySelector('.canvas-column[data-col="3"]').style.display = 'none';
            break;
        case 'magazine':
            grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            document.querySelectorAll('.canvas-column').forEach(col => col.style.display = 'block');
            break;
        case 'bulletin':
            grid.style.gridTemplateColumns = '1fr';
            document.querySelector('.canvas-column[data-col="2"]').style.display = 'none';
            document.querySelector('.canvas-column[data-col="3"]').style.display = 'none';
            break;
    }

    resetAllZones();
}

// Zoom
function zoomCanvas(delta) {
    canvasZoom = Math.max(0.5, Math.min(1.5, canvasZoom + delta));
    document.getElementById('newspaper-canvas').style.transform = `scale(${canvasZoom})`;
    document.getElementById('zoom-level').textContent = Math.round(canvasZoom * 100) + '%';
}

// Summary
function updateSummary() {
    let articleCount = 0;
    let adCount = 0;

    if (editorLayout.une) articleCount++;
    if (editorLayout.banner) adCount++;

    ['col1', 'col2', 'col3'].forEach(col => {
        editorLayout[col].forEach(item => {
            if (item.type === 'article') articleCount++;
            else adCount++;
        });
    });

    document.getElementById('summary-articles').textContent = articleCount;
    document.getElementById('summary-ads').textContent = adCount;
    document.getElementById('summary-elements').textContent = '0';
    document.getElementById('summary-cost').textContent = '$' + printCostBase;
}

// Preview
function previewEdition() {
    const modal = document.getElementById('preview-modal');
    const content = document.getElementById('preview-content');

    let html = '<div style="font-family: Libre Baskerville, serif; max-width: 700px; margin: 0 auto;">';

    // Header
    html += `
        <div style="text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="font-family: Playfair Display, serif; font-size: 32px; letter-spacing: 3px;">THE WEAZEL GAZETTE</h1>
        </div>
    `;

    // Une
    if (editorLayout.une) {
        const article = editorLayout.une.data;
        html += `
            <div style="margin-bottom: 30px;">
                <h2 style="font-family: Playfair Display, serif; font-size: 28px; margin-bottom: 10px;">${article.title}</h2>
                <p style="font-style: italic; color: #666; margin-bottom: 15px;">Par ${article.author} - ${article.category}</p>
                <p style="line-height: 1.8;">${article.content || ''}</p>
            </div>
        `;
    }

    // Colonnes
    html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">';
    ['col1', 'col2', 'col3'].forEach(col => {
        html += '<div>';
        editorLayout[col].forEach(item => {
            if (item.type === 'article') {
                html += `
                    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #ddd;">
                        <h3 style="font-size: 16px; margin-bottom: 8px;">${item.data.title}</h3>
                        <p style="font-size: 12px; color: #666;">${item.data.content ? item.data.content.substring(0, 200) + '...' : ''}</p>
                    </div>
                `;
            } else {
                html += `
                    <div style="background: #f5f0e1; border: 2px solid #8b7355; padding: 15px; margin-bottom: 15px; text-align: center;">
                        <div style="font-size: 9px; color: #8b7355; text-transform: uppercase; letter-spacing: 1px;">Publicite</div>
                        <div style="font-weight: bold; margin-top: 5px;">${item.data.business}</div>
                        <div style="font-style: italic; font-size: 12px;">${item.data.slogan}</div>
                    </div>
                `;
            }
        });
        html += '</div>';
    });
    html += '</div>';

    // Banner
    if (editorLayout.banner) {
        const ad = editorLayout.banner.data;
        html += `
            <div style="background: #f5f0e1; border: 2px solid #8b7355; padding: 20px; margin-top: 20px; text-align: center;">
                <div style="font-size: 9px; color: #8b7355; text-transform: uppercase; letter-spacing: 1px;">Espace Publicitaire</div>
                <div style="font-size: 20px; font-weight: bold; margin-top: 10px;">${ad.business}</div>
                <div style="font-style: italic;">${ad.slogan}</div>
            </div>
        `;
    }

    html += '</div>';
    content.innerHTML = html;
    modal.classList.remove('hidden');
}

function closePreview() {
    document.getElementById('preview-modal').classList.add('hidden');
}

// Print from editor
function printFromEditor() {
    const name = document.getElementById('ee-edition-name').value.trim();
    const price = parseInt(document.getElementById('ee-price').value) || 50;

    if (!name) {
        shakeElement(document.getElementById('ee-edition-name'));
        return;
    }

    // Collect article IDs
    const articleIds = [];
    if (editorLayout.une) articleIds.push(editorLayout.une.id);
    ['col1', 'col2', 'col3'].forEach(col => {
        editorLayout[col].forEach(item => {
            if (item.type === 'article') {
                articleIds.push(item.id);
            }
        });
    });

    if (articleIds.length === 0) {
        alert('Ajoutez au moins un article a l\'edition');
        return;
    }

    // Collect ads
    const ads = [];
    if (editorLayout.banner) ads.push(editorLayout.banner.data);
    ['col1', 'col2', 'col3'].forEach(col => {
        editorLayout[col].forEach(item => {
            if (item.type === 'ad') {
                ads.push(item.data);
            }
        });
    });

    // Send to server
    fetch(`https://${getResourceName()}/printAdvancedEdition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            price,
            articleIds,
            ads,
            layout: editorLayout,
            template: document.getElementById('layout-template').value
        })
    }).catch(() => {});
}

function columnSettings(colNum) {
    // Modal parametres colonne
    const items = editorLayout['col' + colNum];
    let html = `<div class="column-settings-modal">
        <h4>Colonne ${colNum} - ${items.length} element(s)</h4>
        <div class="column-items-list">`;

    if (items.length === 0) {
        html += '<p class="empty-hint">Aucun element</p>';
    } else {
        items.forEach((item, idx) => {
            if (item.type === 'article') {
                html += `<div class="settings-item">
                    <span><i class="fas fa-file-alt"></i> ${item.data.title}</span>
                    <button onclick="moveItemUp('col${colNum}', ${idx})"><i class="fas fa-arrow-up"></i></button>
                    <button onclick="moveItemDown('col${colNum}', ${idx})"><i class="fas fa-arrow-down"></i></button>
                </div>`;
            } else if (item.type === 'ad') {
                html += `<div class="settings-item ad">
                    <span><i class="fas fa-ad"></i> ${item.data.business}</span>
                    <button onclick="moveItemUp('col${colNum}', ${idx})"><i class="fas fa-arrow-up"></i></button>
                    <button onclick="moveItemDown('col${colNum}', ${idx})"><i class="fas fa-arrow-down"></i></button>
                </div>`;
            } else if (item.type === 'element') {
                html += `<div class="settings-item element">
                    <span><i class="fas fa-shapes"></i> ${item.elementType}</span>
                    <button onclick="moveItemUp('col${colNum}', ${idx})"><i class="fas fa-arrow-up"></i></button>
                    <button onclick="moveItemDown('col${colNum}', ${idx})"><i class="fas fa-arrow-down"></i></button>
                </div>`;
            }
        });
    }

    html += '</div><button class="btn-close-settings" onclick="closeColumnSettings()">Fermer</button></div>';

    let modal = document.getElementById('column-settings-overlay');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'column-settings-overlay';
        modal.className = 'column-settings-overlay';
        document.body.appendChild(modal);
    }
    modal.innerHTML = html;
    modal.classList.add('show');
}

function closeColumnSettings() {
    const modal = document.getElementById('column-settings-overlay');
    if (modal) modal.classList.remove('show');
}

function moveItemUp(colName, index) {
    if (index <= 0) return;
    const items = editorLayout[colName];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    renderZone(colName);
    columnSettings(parseInt(colName.replace('col', '')));
}

function moveItemDown(colName, index) {
    const items = editorLayout[colName];
    if (index >= items.length - 1) return;
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    renderZone(colName);
    columnSettings(parseInt(colName.replace('col', '')));
}

// Setup des elements draggables
function setupElementsDrag() {
    document.querySelectorAll('#tab-elements .element-item').forEach(el => {
        el.addEventListener('dragstart', handleElementDragStart);
        el.addEventListener('dragend', handleDragEnd);
    });
}

// Sauvegarder le layout (pour usage futur)
function saveEditionLayout() {
    showEditorNotification('Layout sauvegarde!', 'success');
}

// Reinitialiser l'edition
function resetEdition() {
    if (!confirm('Voulez-vous vraiment reinitialiser l\'edition?')) return;
    editorLayout = { une: null, col1: [], col2: [], col3: [], banner: null };
    resetAllZones();
    renderArticlesPool();
    renderCreatedAds();
    updateSummary();
    showEditorNotification('Edition reinitialisee', 'info');
}

// Dupliquer un article dans la liste
function duplicateArticle(articleId) {
    const article = editorArticles.find(a => a.id === articleId);
    if (!article) return;

    const newArticle = {
        ...article,
        id: Date.now(),
        title: article.title + ' (copie)'
    };
    editorArticles.push(newArticle);
    renderArticlesPool();
    showEditorNotification('Article duplique', 'success');
}

// Message handler update
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
        case 'openEditionEditor': openEditionEditor(data.data); break;
        case 'closeEditionEditor': document.getElementById('edition-editor').classList.add('hidden'); break;
        case 'articleSaved': addArticleToEditor(data.data); break;
        case 'refreshArticles':
            editorArticles = data.data.articles || [];
            renderArticlesPool();
            break;
    }
});

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Character counter pour editeur principal
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

    // Character counter pour editeur d'edition
    const eeContent = document.getElementById('ee-article-content');
    if (eeContent) {
        eeContent.addEventListener('input', updateEditorCharCount);
    }

    // Setup elements drag
    setTimeout(setupElementsDrag, 500);
});
