// =====================================
// WEAZEL NEWS - NUI SCRIPT (CLICK SYSTEM)
// =====================================

let articles = [];
let currentIndex = 0;
let totalArticles = 0;
let categories = [];
let currentVendorId = null;
let printCost = 10;

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
    const ticker = document.getElementById('ticker');

    reporterName.textContent = data.reporterName || 'Reporter';
    if (ticker && data.ticker) ticker.textContent = data.ticker;
    overlay.classList.remove('hidden');

    if (dateTimeInterval) clearInterval(dateTimeInterval);
    updateDateTime();
    dateTimeInterval = setInterval(updateDateTime, 1000);
}

function hideOverlay() {
    document.getElementById('camera-overlay').classList.add('hidden');
    if (dateTimeInterval) {
        clearInterval(dateTimeInterval);
        dateTimeInterval = null;
    }
}

function updateDateTime() {
    const datetime = document.getElementById('datetime');
    datetime.textContent = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

// =====================================
// NOTE WRITER/READER
// =====================================

function openNoteWriter(data) {
    document.getElementById('note-writer').classList.remove('hidden');
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
}

function closeNoteWriter() {
    document.getElementById('note-writer').classList.add('hidden');
    fetch(`https://${getResourceName()}/closeNoteWriter`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    }).catch(() => {});
}

function saveNote() {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    if (!title || !content) return;
    fetch(`https://${getResourceName()}/saveNote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
    }).catch(() => {});
}

function openNoteReader(data) {
    document.getElementById('note-reader').classList.remove('hidden');
    document.getElementById('note-title-display').textContent = data.title;
    document.getElementById('note-content-display').textContent = data.content;
    document.getElementById('note-date').textContent = data.date || '';
}

function closeNoteReader() {
    document.getElementById('note-reader').classList.add('hidden');
    fetch(`https://${getResourceName()}/closeNoteReader`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    }).catch(() => {});
}

function displayArticle(index) {
    if (index < 0 || index >= articles.length) return;
    const article = articles[index];
    document.getElementById('np-article-title').textContent = article.title;
    document.getElementById('np-article-subtitle').textContent = article.subtitle || '';
    document.getElementById('np-article-author').textContent = 'Par ' + article.author;
    document.getElementById('np-article-category').textContent = article.category;
    document.getElementById('np-article-content').innerHTML = parseArticleContent(article.content);
}

function parseArticleContent(content) {
    if (!content) return '';
    let html = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/\[IMG:(.*?)\]/g, '<div class="article-image"><img src="$1" alt=""></div>');
    html = html.replace(/^---$/gm, '<hr class="article-separator">');
    html = html.replace(/\[QUOTE\]([\s\S]*?)\[\/QUOTE\]/g, '<blockquote class="article-quote">$1</blockquote>');
    html = html.replace(/\[H2\](.*?)\[\/H2\]/g, '<h2 class="article-h2">$1</h2>');
    html = html.split('\n\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
    return html;
}

function changePage(data) {
    currentIndex = (data.currentIndex || 1) - 1;
    displayArticle(currentIndex);
    updatePageIndicator();
}

function updatePageIndicator() {
    document.getElementById('current-page').textContent = currentIndex + 1;
    document.getElementById('total-pages').textContent = totalArticles;
}

function navigateNewspaper(direction) {
    fetch(`https://${getResourceName()}/${direction === 'next' ? 'nextPage' : 'prevPage'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    }).catch(() => {});
}

// =====================================
// SHOP
// =====================================

function openShop(data) {
    currentVendorId = data.vendorId;
    document.getElementById('newspaper-shop').classList.remove('hidden');
    const list = document.getElementById('editions-list');
    const noEd = document.getElementById('no-editions');
    if (!data.editions || data.editions.length === 0) {
        list.innerHTML = '';
        noEd.classList.remove('hidden');
    } else {
        noEd.classList.add('hidden');
        list.innerHTML = data.editions.map(ed => `
            <div class="edition-item" onclick="buyEdition(${ed.id})">
                <h3>${ed.name}</h3>
                <div class="edition-info"><span>${ed.articles} article(s)</span><span class="edition-price">$${ed.price}</span></div>
            </div>
        `).join('');
    }
}

function closeShop() {
    document.getElementById('newspaper-shop').classList.add('hidden');
    fetch(`https://${getResourceName()}/closeShop`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    }).catch(() => {});
}

function buyEdition(editionId) {
    fetch(`https://${getResourceName()}/buyEdition`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editionId, vendorId: currentVendorId })
    }).catch(() => {});
}

// =====================================
// STOCK
// =====================================

function openStock(data) {
    currentVendorId = data.vendorId;
    document.getElementById('stock-interface').classList.remove('hidden');
    document.getElementById('stock-title').textContent = 'Stock - ' + (data.vendorLabel || 'Point de vente');

    const currentStock = document.getElementById('current-stock');
    const noStock = document.getElementById('no-current-stock');
    if (!data.stock || data.stock.length === 0) {
        currentStock.innerHTML = '';
        noStock.classList.remove('hidden');
    } else {
        noStock.classList.add('hidden');
        currentStock.innerHTML = data.stock.map(s => `
            <div class="stock-item"><div class="stock-info"><h4>${s.name}</h4><span>$${s.price}</span></div><div class="stock-quantity">${s.quantity}</div></div>
        `).join('');
    }

    const editionsAvailable = document.getElementById('editions-available');
    const noEdStock = document.getElementById('no-editions-stock');
    if (!data.editions || data.editions.length === 0) {
        editionsAvailable.innerHTML = '';
        noEdStock.classList.remove('hidden');
    } else {
        noEdStock.classList.add('hidden');
        editionsAvailable.innerHTML = data.editions.map(e => `
            <div class="edition-add-item">
                <div class="edition-info"><h4>${e.name}</h4><span>${e.articles} article(s)</span></div>
                <div class="add-controls"><input type="number" id="qty-${e.id}" value="1" min="1" max="50"><button class="btn-add" onclick="addStock(${e.id})">+</button></div>
            </div>
        `).join('');
    }
}

function closeStock() {
    document.getElementById('stock-interface').classList.add('hidden');
    fetch(`https://${getResourceName()}/closeStock`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    }).catch(() => {});
}

function addStock(editionId) {
    const qty = parseInt(document.getElementById('qty-' + editionId).value) || 1;
    fetch(`https://${getResourceName()}/addStock`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editionId, quantity: qty, vendorId: currentVendorId })
    }).catch(() => {});
}

// =====================================
// EDITEUR D'EDITION - HUB CENTRAL
// =====================================

let editorArticles = [];
let editorAds = [];
let editorLayout = { une: null, col1: [], col2: [], col3: [], banner: null };
let editorCategories = ['Actualites', 'Politique', 'Economie', 'Sport', 'Faits Divers', 'Culture', 'Meteo', 'Interview'];
let editorArticleImages = [];
let editingArticleId = null;
let printCostBase = 10;
let canvasZoom = 1;

// Selection par clic
let selectedItem = null;

function openEditionEditor(data) {
    document.getElementById('edition-editor').classList.remove('hidden');
    editorArticles = data.articles || [];
    editorAds = [];
    editorLayout = { une: null, col1: [], col2: [], col3: [], banner: null };
    selectedItem = null;
    printCostBase = data.printCost || 10;
    editorCategories = data.categories || editorCategories;
    editorArticleImages = [];
    editingArticleId = null;

    const dateText = document.getElementById('canvas-date-text');
    if (dateText) dateText.textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    renderArticlesPool();
    setupEditorCategorySelect();
    renderCreatedAds();
    updateSummary();
    resetAllZones();
    updateSelectionHint();
}

function closeEditionEditor() {
    document.getElementById('edition-editor').classList.add('hidden');
    selectedItem = null;
    fetch(`https://${getResourceName()}/closeEditionEditor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    }).catch(() => {});
}

function switchEditorTab(tabName) {
    document.querySelectorAll('.sidebar-tabs .tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    document.querySelectorAll('.editor-sidebar.left .tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + tabName));
    if (tabName === 'write') setTimeout(() => document.getElementById('ee-article-title')?.focus(), 100);
}

// =====================================
// SYSTEME DE SELECTION PAR CLIC
// =====================================

function selectArticle(articleId) {
    const article = editorArticles.find(a => a.id === articleId);
    if (!article || isArticleUsed(articleId)) {
        showNotif('Article deja utilise', 'warning');
        return;
    }
    selectedItem = { type: 'article', id: articleId, data: article };
    updateSelectionHint();
    renderArticlesPool();
    showNotif('Cliquez sur une zone pour placer', 'info');
}

function selectAd(adId) {
    const ad = editorAds.find(a => a.id === adId);
    if (!ad || isAdUsed(adId)) {
        showNotif('Pub deja utilisee', 'warning');
        return;
    }
    selectedItem = { type: 'ad', id: adId, data: ad };
    updateSelectionHint();
    renderCreatedAds();
    showNotif('Cliquez sur une zone pour placer', 'info');
}

function selectElementType(elementType) {
    selectedItem = { type: 'element', id: Date.now(), elementType: elementType };
    updateSelectionHint();
    showNotif('Cliquez sur une colonne', 'info');
}

function cancelSelection() {
    selectedItem = null;
    updateSelectionHint();
    renderArticlesPool();
    renderCreatedAds();
}

function updateSelectionHint() {
    const hint = document.getElementById('selection-hint');
    if (!hint) return;
    if (selectedItem) {
        let label = selectedItem.type === 'article' ? selectedItem.data.title :
                    selectedItem.type === 'ad' ? selectedItem.data.business : selectedItem.elementType;
        hint.innerHTML = `<i class="fas fa-hand-pointer"></i> <strong>${label.substring(0,20)}</strong> <button onclick="cancelSelection()"><i class="fas fa-times"></i></button>`;
        hint.classList.add('active');
    } else {
        hint.innerHTML = '<span>Selectionnez un element</span>';
        hint.classList.remove('active');
    }
}

function placeInZone(zoneName) {
    if (!selectedItem) {
        showNotif('Selectionnez d\'abord un element', 'warning');
        return;
    }

    if (selectedItem.type === 'article') {
        if (isArticleUsed(selectedItem.id)) { cancelSelection(); return; }
        if (zoneName === 'une') editorLayout.une = { type: 'article', id: selectedItem.id, data: selectedItem.data };
        else if (zoneName.startsWith('col')) editorLayout[zoneName].push({ type: 'article', id: selectedItem.id, data: selectedItem.data });
        else { showNotif('Zone invalide pour article', 'warning'); return; }
    } else if (selectedItem.type === 'ad') {
        if (zoneName === 'banner') editorLayout.banner = { type: 'ad', id: selectedItem.id, data: selectedItem.data };
        else if (zoneName.startsWith('col')) editorLayout[zoneName].push({ type: 'ad', id: selectedItem.id, data: selectedItem.data });
        else { showNotif('Zone invalide pour pub', 'warning'); return; }
    } else if (selectedItem.type === 'element') {
        if (zoneName.startsWith('col')) editorLayout[zoneName].push({ type: 'element', elementType: selectedItem.elementType, id: selectedItem.id });
        else { showNotif('Elements dans colonnes uniquement', 'warning'); return; }
    }

    renderZone(zoneName);
    selectedItem = null;
    updateSelectionHint();
    renderArticlesPool();
    renderCreatedAds();
    updateSummary();
    showNotif('Element place!', 'success');
}

function isArticleUsed(id) {
    if (editorLayout.une?.id === id) return true;
    return ['col1','col2','col3'].some(c => editorLayout[c].some(i => i.type === 'article' && i.id === id));
}

function isAdUsed(id) {
    if (editorLayout.banner?.id === id) return true;
    return ['col1','col2','col3'].some(c => editorLayout[c].some(i => i.type === 'ad' && i.id === id));
}

// =====================================
// RENDER FUNCTIONS
// =====================================

function renderArticlesPool() {
    const pool = document.getElementById('articles-pool');
    if (!pool) return;
    if (editorArticles.length === 0) {
        pool.innerHTML = '<div class="empty-pool"><i class="fas fa-file-alt"></i><p>Aucun article</p><small>Utilisez Nouveau</small></div>';
        return;
    }
    pool.innerHTML = editorArticles.map(a => {
        const used = isArticleUsed(a.id);
        const sel = selectedItem?.type === 'article' && selectedItem.id === a.id;
        return `<div class="article-card ${used ? 'used' : ''} ${sel ? 'selected' : ''}" onclick="${used ? '' : `selectArticle(${a.id})`}">
            ${used ? '<span class="badge-used"><i class="fas fa-check"></i></span>' : ''}
            <h4>${a.title}</h4>
            <div class="meta"><span class="cat">${a.category}</span></div>
        </div>`;
    }).join('');
}

function renderCreatedAds() {
    const container = document.getElementById('created-ads');
    if (!container) return;
    if (editorAds.length === 0) {
        container.innerHTML = '<p class="empty-hint">Aucune pub</p>';
        return;
    }
    container.innerHTML = editorAds.map(ad => {
        const used = isAdUsed(ad.id);
        const sel = selectedItem?.type === 'ad' && selectedItem.id === ad.id;
        const imgHtml = ad.image ? `<img src="${ad.image}" class="ad-preview-img" onerror="this.style.display='none'">` : '';
        return `<div class="ad-block ${used ? 'used' : ''} ${sel ? 'selected' : ''}" onclick="${used ? '' : `selectAd(${ad.id})`}" style="${ad.color ? 'border-color:'+ad.color : ''}">
            ${used ? '<span class="badge-used"><i class="fas fa-check"></i></span>' : ''}
            ${imgHtml}
            <h5>${ad.business}</h5>
            <p>${ad.slogan}</p>
            ${ad.contact ? `<small class="ad-contact">${ad.contact}</small>` : ''}
            <button class="btn-del" onclick="event.stopPropagation();deleteAd(${ad.id})"><i class="fas fa-trash"></i></button>
        </div>`;
    }).join('');
}

function renderZone(zoneName) {
    const zone = document.querySelector(`.drop-zone[data-zone="${zoneName}"]`);
    if (!zone) return;
    let html = '';

    if (zoneName === 'une') {
        if (editorLayout.une) {
            html = `<div class="dropped-item" onclick="removeFromZone('une')"><h3>${editorLayout.une.data.title}</h3><span class="remove"><i class="fas fa-times"></i></span></div>`;
        } else {
            html = `<div class="drop-placeholder" onclick="placeInZone('une')"><i class="fas fa-newspaper"></i><span>La Une</span></div>`;
        }
    } else if (zoneName === 'banner') {
        if (editorLayout.banner) {
            const ad = editorLayout.banner.data;
            const imgHtml = ad.image ? `<img src="${ad.image}" class="ad-zone-img" onerror="this.style.display='none'">` : '';
            html = `<div class="dropped-ad" onclick="removeFromZone('banner')" style="${ad.color ? 'border-color:'+ad.color : ''}">
                ${imgHtml}<span class="ad-label">PUB</span><strong>${ad.business}</strong>
                ${ad.slogan ? `<span class="ad-slogan">${ad.slogan}</span>` : ''}
                <span class="remove"><i class="fas fa-times"></i></span>
            </div>`;
        } else {
            html = `<div class="drop-placeholder" onclick="placeInZone('banner')"><i class="fas fa-ad"></i><span>Banniere</span></div>`;
        }
    } else {
        const items = editorLayout[zoneName];
        if (items.length > 0) {
            html = items.map((item, i) => {
                if (item.type === 'article') return `<div class="dropped-item small" onclick="removeFromCol('${zoneName}',${i})"><h4>${item.data.title}</h4><span class="remove"><i class="fas fa-times"></i></span></div>`;
                if (item.type === 'ad') {
                    const ad = item.data;
                    const imgHtml = ad.image ? `<img src="${ad.image}" class="ad-zone-img-small" onerror="this.style.display='none'">` : '';
                    return `<div class="dropped-ad small" onclick="removeFromCol('${zoneName}',${i})" style="${ad.color ? 'border-color:'+ad.color : ''}">${imgHtml}<strong>${ad.business}</strong><span class="remove"><i class="fas fa-times"></i></span></div>`;
                }
                if (item.type === 'element') return `<div class="dropped-element" onclick="removeFromCol('${zoneName}',${i})"><i class="fas fa-shapes"></i> ${item.elementType}<span class="remove"><i class="fas fa-times"></i></span></div>`;
                return '';
            }).join('');
        } else {
            html = `<div class="drop-placeholder small" onclick="placeInZone('${zoneName}')"><i class="fas fa-plus"></i></div>`;
        }
    }
    zone.innerHTML = html;
}

function removeFromZone(zoneName) {
    if (zoneName === 'une') editorLayout.une = null;
    else if (zoneName === 'banner') editorLayout.banner = null;
    renderZone(zoneName);
    renderArticlesPool();
    renderCreatedAds();
    updateSummary();
}

function removeFromCol(colName, index) {
    editorLayout[colName].splice(index, 1);
    renderZone(colName);
    renderArticlesPool();
    renderCreatedAds();
    updateSummary();
}

function resetAllZones() {
    ['une', 'col1', 'col2', 'col3', 'banner'].forEach(z => renderZone(z));
}

// =====================================
// CREATION ARTICLE
// =====================================

function setupEditorCategorySelect() {
    const sel = document.getElementById('ee-article-category');
    if (sel) sel.innerHTML = editorCategories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function saveArticleFromEditor() {
    const title = document.getElementById('ee-article-title').value.trim();
    const subtitle = document.getElementById('ee-article-subtitle').value.trim();
    const category = document.getElementById('ee-article-category').value;
    const content = document.getElementById('ee-article-content').value.trim();
    if (!title) { shakeEl(document.getElementById('ee-article-title')); return; }
    if (!content) { shakeEl(document.getElementById('ee-article-content')); return; }

    fetch(`https://${getResourceName()}/saveArticleFromEditor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingArticleId, title, subtitle, category, content, images: editorArticleImages, status: 'published' })
    }).then(() => {
        showNotif(editingArticleId ? 'Article modifie!' : 'Article cree!', 'success');
        clearArticleForm();
        switchEditorTab('articles');
    }).catch(() => {});
}

function saveDraftFromEditor() {
    const title = document.getElementById('ee-article-title').value.trim();
    if (!title) { shakeEl(document.getElementById('ee-article-title')); return; }
    fetch(`https://${getResourceName()}/saveArticleFromEditor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingArticleId, title, subtitle: document.getElementById('ee-article-subtitle').value, category: document.getElementById('ee-article-category').value, content: document.getElementById('ee-article-content').value, images: editorArticleImages, status: 'draft' })
    }).then(() => showNotif('Brouillon!', 'success')).catch(() => {});
}

function clearArticleForm() {
    document.getElementById('ee-article-title').value = '';
    document.getElementById('ee-article-subtitle').value = '';
    document.getElementById('ee-article-content').value = '';
    editorArticleImages = [];
    editingArticleId = null;
    renderEditorImages();
    updateCharCount();
}

function addArticleToEditor(article) {
    const idx = editorArticles.findIndex(a => a.id === article.id);
    if (idx >= 0) editorArticles[idx] = article;
    else editorArticles.unshift(article);
    renderArticlesPool();
}

function insertEditorImage() {
    const url = document.getElementById('editor-image-url-input').value.trim();
    // Ouvrir le modal pour l'URL
    document.getElementById('editor-image-url-input').value = '';
    document.getElementById('editor-image-modal').classList.remove('hidden');
    // Changer le comportement du confirm pour inserer dans le texte
    document.getElementById('editor-image-modal').dataset.insertMode = 'inline';
    setTimeout(() => document.getElementById('editor-image-url-input').focus(), 100);
}

function insertEditorSeparator() {
    const c = document.getElementById('ee-article-content');
    const p = c.selectionStart;
    c.value = c.value.slice(0,p) + '\n---\n' + c.value.slice(p);
    updateCharCount();
}

function insertEditorQuote() {
    const c = document.getElementById('ee-article-content');
    const p = c.selectionStart, e = c.selectionEnd;
    const sel = c.value.slice(p,e) || 'Citation';
    c.value = c.value.slice(0,p) + `[QUOTE]${sel}[/QUOTE]` + c.value.slice(e);
    updateCharCount();
}

function insertEditorSubtitle() {
    const c = document.getElementById('ee-article-content');
    const p = c.selectionStart, e = c.selectionEnd;
    const sel = c.value.slice(p,e) || 'Sous-titre';
    c.value = c.value.slice(0,p) + `[H2]${sel}[/H2]` + c.value.slice(e);
    updateCharCount();
}

function updateCharCount() {
    const c = document.getElementById('ee-article-content');
    const counter = document.getElementById('ee-char-count');
    if (c && counter) counter.textContent = c.value.length;
}

function addEditorImageUrl() {
    document.getElementById('editor-image-url-input').value = '';
    document.getElementById('editor-image-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('editor-image-url-input').focus(), 100);
}

function closeEditorImageModal() {
    document.getElementById('editor-image-modal').classList.add('hidden');
}

function confirmEditorImageUrl() {
    const url = document.getElementById('editor-image-url-input').value.trim();
    const modal = document.getElementById('editor-image-modal');
    const isInline = modal.dataset.insertMode === 'inline';

    if (url) {
        if (isInline) {
            // Inserer dans le contenu de l'article
            const c = document.getElementById('ee-article-content');
            const p = c.selectionStart;
            c.value = c.value.slice(0, p) + `[IMG:${url}]` + c.value.slice(p);
            updateCharCount();
            showNotif('Image inseree dans le texte!', 'success');
        } else {
            // Ajouter a la liste des images
            editorArticleImages.push(url);
            renderEditorImages();
            showNotif('Image ajoutee!', 'success');
        }
    }
    modal.dataset.insertMode = '';
    closeEditorImageModal();
}

function addEditorImage() {
    addEditorImageUrl();
}

function removeEditorImage(i) {
    editorArticleImages.splice(i, 1);
    renderEditorImages();
}

function renderEditorImages() {
    const c = document.getElementById('ee-images-list');
    if (!c) return;
    c.innerHTML = editorArticleImages.map((u,i) => `<div class="img-item"><span>${u.substring(0,20)}...</span><button onclick="removeEditorImage(${i})"><i class="fas fa-times"></i></button></div>`).join('');
}

// =====================================
// PUBLICITES
// =====================================

let adIdCounter = 1;

function createAdBlock() {
    const business = document.getElementById('ad-business').value.trim();
    const slogan = document.getElementById('ad-slogan').value.trim() || 'Votre partenaire';
    const contact = document.getElementById('ad-contact').value.trim();
    const image = document.getElementById('ad-image').value.trim();
    const size = document.getElementById('ad-size').value;
    const color = document.getElementById('ad-color').value;
    if (!business) { shakeEl(document.getElementById('ad-business')); return; }
    editorAds.push({ id: adIdCounter++, business, slogan, contact, image, size, color });
    renderCreatedAds();
    showNotif('Pub creee!', 'success');
    document.getElementById('ad-business').value = '';
    document.getElementById('ad-slogan').value = '';
    document.getElementById('ad-contact').value = '';
    document.getElementById('ad-image').value = '';
}

function deleteAd(id) {
    editorAds = editorAds.filter(a => a.id !== id);
    if (editorLayout.banner?.id === id) { editorLayout.banner = null; renderZone('banner'); }
    ['col1','col2','col3'].forEach(c => {
        const i = editorLayout[c].findIndex(x => x.type === 'ad' && x.id === id);
        if (i >= 0) { editorLayout[c].splice(i,1); renderZone(c); }
    });
    renderCreatedAds();
    updateSummary();
}

// =====================================
// PRINT & SUMMARY
// =====================================

function updateSummary() {
    let ac = 0, adc = 0;
    if (editorLayout.une) ac++;
    if (editorLayout.banner) adc++;
    ['col1','col2','col3'].forEach(c => editorLayout[c].forEach(i => i.type === 'article' ? ac++ : adc++));
    document.getElementById('summary-articles').textContent = ac;
    document.getElementById('summary-ads').textContent = adc;
    const qty = parseInt(document.getElementById('ee-quantity')?.value) || 1;
    document.getElementById('summary-cost').textContent = '$' + (printCostBase * qty);
}

function changeQuantity(delta) {
    const input = document.getElementById('ee-quantity');
    let val = parseInt(input.value) || 1;
    val = Math.max(1, Math.min(50, val + delta));
    input.value = val;
    updateSummary();
}

function printFromEditor() {
    const name = document.getElementById('ee-edition-name').value.trim();
    const price = parseInt(document.getElementById('ee-price').value) || 50;
    const quantity = parseInt(document.getElementById('ee-quantity').value) || 1;
    if (!name) { shakeEl(document.getElementById('ee-edition-name')); return; }

    const articleIds = [];
    if (editorLayout.une) articleIds.push(editorLayout.une.id);
    ['col1','col2','col3'].forEach(c => editorLayout[c].forEach(i => { if (i.type === 'article') articleIds.push(i.id); }));

    if (articleIds.length === 0) { showNotif('Ajoutez au moins un article', 'error'); return; }

    const ads = [];
    if (editorLayout.banner) ads.push(editorLayout.banner.data);
    ['col1','col2','col3'].forEach(c => editorLayout[c].forEach(i => { if (i.type === 'ad') ads.push(i.data); }));

    fetch(`https://${getResourceName()}/printAdvancedEdition`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, quantity, articleIds, ads, layout: editorLayout, template: document.getElementById('layout-template').value })
    }).catch(() => {});
}

function previewEdition() {
    const name = document.getElementById('ee-edition-name').value.trim() || 'Edition Sans Nom';
    const price = parseInt(document.getElementById('ee-price').value) || 50;

    // Generate preview HTML
    let previewHtml = `
        <div class="preview-newspaper">
            <div class="preview-header">
                <div class="title">THE WEAZEL GAZETTE</div>
                <div class="subtitle">"La verite, rien que la verite"</div>
                <div style="margin-top:10px;font-size:11px;color:#6b6b6b;">
                    ${name} - Prix: $${price}
                </div>
            </div>
    `;

    // La Une
    if (editorLayout.une) {
        previewHtml += `
            <div class="preview-une">
                <h2>${editorLayout.une.data.title}</h2>
                <p>${editorLayout.une.data.subtitle || editorLayout.une.data.category}</p>
            </div>
        `;
    }

    // Columns
    previewHtml += '<div class="preview-columns">';
    ['col1', 'col2', 'col3'].forEach((col, idx) => {
        previewHtml += `<div class="preview-column">`;
        if (editorLayout[col].length === 0) {
            previewHtml += `<p style="color:#999;font-size:11px;text-align:center;">Colonne ${idx + 1} vide</p>`;
        } else {
            editorLayout[col].forEach(item => {
                if (item.type === 'article') {
                    previewHtml += `
                        <div class="preview-article-small">
                            <h4>${item.data.title}</h4>
                            <p>${item.data.category}</p>
                        </div>
                    `;
                } else if (item.type === 'ad') {
                    const ad = item.data;
                    previewHtml += `
                        <div class="preview-ad-small" style="${ad.color ? 'border-color:'+ad.color : ''}">
                            ${ad.image ? `<img src="${ad.image}" class="preview-ad-img" onerror="this.style.display='none'">` : ''}
                            <strong>${ad.business}</strong>
                            <span>${ad.slogan || ''}</span>
                            ${ad.contact ? `<small>${ad.contact}</small>` : ''}
                        </div>
                    `;
                } else if (item.type === 'element') {
                    previewHtml += `<div style="padding:10px;background:#f0f0f0;text-align:center;margin-bottom:10px;font-size:10px;color:#666;">${item.elementType}</div>`;
                }
            });
        }
        previewHtml += '</div>';
    });
    previewHtml += '</div>';

    // Banner
    if (editorLayout.banner) {
        const ad = editorLayout.banner.data;
        previewHtml += `
            <div class="preview-banner" style="${ad.color ? 'border-color:'+ad.color : ''}">
                ${ad.image ? `<img src="${ad.image}" class="preview-banner-img" onerror="this.style.display='none'">` : ''}
                <strong>${ad.business}</strong>
                <span>${ad.slogan || ''}</span>
                ${ad.contact ? `<small>${ad.contact}</small>` : ''}
            </div>
        `;
    }

    previewHtml += `
            <div class="preview-footer">
                Weazel News &copy; - Tous droits reserves
            </div>
        </div>
    `;

    // Show modal
    document.getElementById('preview-content').innerHTML = previewHtml;
    document.getElementById('preview-modal').classList.remove('hidden');
}

function closePreview() {
    document.getElementById('preview-modal').classList.add('hidden');
}

function resetEdition() {
    editorLayout = { une: null, col1: [], col2: [], col3: [], banner: null };
    resetAllZones();
    renderArticlesPool();
    renderCreatedAds();
    updateSummary();
    showNotif('Edition reinitialisee', 'info');
}

// =====================================
// UTILITIES
// =====================================

function showNotif(msg, type = 'info') {
    let n = document.getElementById('editor-notification');
    if (!n) { n = document.createElement('div'); n.id = 'editor-notification'; document.body.appendChild(n); }
    n.className = 'editor-notification ' + type + ' show';
    n.textContent = msg;
    setTimeout(() => n.classList.remove('show'), 2500);
}

function shakeEl(el) {
    if (!el) return;
    el.style.animation = 'shake 0.4s';
    el.style.borderColor = '#c00';
    setTimeout(() => { el.style.animation = ''; el.style.borderColor = ''; }, 400);
}

// =====================================
// KEYBOARD & MESSAGE HANDLER
// =====================================

document.addEventListener('keydown', function(e) {
    const np = document.getElementById('newspaper-reader');
    if (np && !np.classList.contains('hidden')) {
        if (e.key === 'ArrowRight' || e.key === 'd') navigateNewspaper('next');
        else if (e.key === 'ArrowLeft' || e.key === 'a') navigateNewspaper('prev');
        else if (e.key === 'Escape') closeNewspaper();
        return;
    }
    if (e.key === 'Escape') {
        if (!document.getElementById('edition-editor').classList.contains('hidden')) closeEditionEditor();
        else if (!document.getElementById('note-writer').classList.contains('hidden')) closeNoteWriter();
        else if (!document.getElementById('note-reader').classList.contains('hidden')) closeNoteReader();
        else if (!document.getElementById('newspaper-shop').classList.contains('hidden')) closeShop();
        else if (!document.getElementById('stock-interface').classList.contains('hidden')) closeStock();
    }
});

window.addEventListener('message', function(event) {
    const d = event.data;
    switch (d.action) {
        case 'showOverlay': showOverlay(d.data); break;
        case 'hideOverlay': hideOverlay(); break;
        case 'openNoteWriter': openNoteWriter(d.data); break;
        case 'closeNoteWriter': document.getElementById('note-writer').classList.add('hidden'); break;
        case 'openNoteReader': openNoteReader(d.data); break;
        case 'closeNoteReader': document.getElementById('note-reader').classList.add('hidden'); break;
        case 'openNewspaper': openNewspaper(d.data); break;
        case 'closeNewspaper': document.getElementById('newspaper-reader').classList.add('hidden'); break;
        case 'changePage': changePage(d.data); break;
        case 'openShop': openShop(d.data); break;
        case 'closeShop': document.getElementById('newspaper-shop').classList.add('hidden'); break;
        case 'openStock': openStock(d.data); break;
        case 'closeStock': document.getElementById('stock-interface').classList.add('hidden'); break;
        case 'openEditionEditor': openEditionEditor(d.data); break;
        case 'closeEditionEditor': document.getElementById('edition-editor').classList.add('hidden'); break;
        case 'articleSaved': addArticleToEditor(d.data); break;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const c = document.getElementById('ee-article-content');
    if (c) c.addEventListener('input', updateCharCount);
});
