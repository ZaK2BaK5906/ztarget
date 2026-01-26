// =====================================
// WEAZEL NEWS - NUI SCRIPT
// =====================================

let articles = [];
let currentIndex = 0;
let totalArticles = 0;

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
    const logoNews = document.querySelector('.logo-news');
    const ticker = document.getElementById('ticker');

    // Mettre a jour les textes
    reporterName.textContent = data.reporterName || 'Reporter';
    if (logoText) logoText.textContent = data.title || 'WEAZEL NEWS';
    if (data.subtitle) {
        const liveBadgeText = liveBadge.querySelector('span:last-child');
        if (liveBadgeText) liveBadgeText.textContent = data.subtitle;
    }
    if (ticker && data.ticker) ticker.textContent = data.ticker;

    // Gerer la visibilite des elements
    if (liveBadge) liveBadge.style.display = data.showLiveBadge !== false ? 'flex' : 'none';
    if (recIndicator) recIndicator.style.display = data.showRecIndicator !== false ? 'flex' : 'none';
    if (breakingNews) breakingNews.style.display = data.showTicker !== false ? 'flex' : 'none';
    corners.forEach(corner => {
        corner.style.display = data.showCorners !== false ? 'block' : 'none';
    });

    overlay.classList.remove('hidden');

    // Update datetime
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
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    datetime.textContent = now.toLocaleDateString('fr-FR', options);
}

// =====================================
// ARTICLE WRITER
// =====================================

function openWriter(data) {
    const writer = document.getElementById('article-writer');
    writer.classList.remove('hidden');

    // Reset form
    document.getElementById('article-title').value = '';
    document.getElementById('article-category').value = 'Actualites';
    document.getElementById('article-content').value = '';
    document.getElementById('char-count').textContent = '0';

    // Focus on title
    setTimeout(() => {
        document.getElementById('article-title').focus();
    }, 100);
}

function closeWriter() {
    const writer = document.getElementById('article-writer');
    writer.classList.add('hidden');

    fetch(`https://${getResourceName()}/closeWriter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
}

function publishArticle() {
    const title = document.getElementById('article-title').value.trim();
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
            title: title,
            category: category,
            content: content
        })
    });
}

function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease';
    element.style.borderColor = '#ff0000';

    setTimeout(() => {
        element.style.animation = '';
        element.style.borderColor = '';
    }, 500);
}

// Character counter
document.addEventListener('DOMContentLoaded', function() {
    const contentArea = document.getElementById('article-content');
    const charCount = document.getElementById('char-count');

    if (contentArea && charCount) {
        contentArea.addEventListener('input', function() {
            charCount.textContent = this.value.length;
            if (this.value.length > 5000) {
                this.value = this.value.substring(0, 5000);
                charCount.textContent = '5000';
            }
        });
    }
});

// =====================================
// NEWSPAPER READER
// =====================================

function openNewspaper(data) {
    articles = data.articles || [];
    currentIndex = (data.currentIndex || 1) - 1;
    totalArticles = data.totalArticles || articles.length;

    if (articles.length === 0) return;

    const reader = document.getElementById('newspaper-reader');
    reader.classList.remove('hidden');

    // Set date
    const dateEl = document.getElementById('newspaper-date');
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    displayArticle(currentIndex);
    updatePageIndicator();
}

function closeNewspaper() {
    const reader = document.getElementById('newspaper-reader');
    reader.classList.add('hidden');

    fetch(`https://${getResourceName()}/closeNewspaper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
}

function displayArticle(index) {
    if (index < 0 || index >= articles.length) return;

    const article = articles[index];

    document.getElementById('np-article-title').textContent = article.title;
    document.getElementById('np-article-author').textContent = 'Par ' + article.author;
    document.getElementById('np-article-category').textContent = article.category;
    document.getElementById('np-article-content').textContent = article.content;

    // Animation
    const mainArticle = document.getElementById('article-main');
    mainArticle.style.animation = 'none';
    setTimeout(() => {
        mainArticle.style.animation = 'fadeIn 0.3s ease';
    }, 10);
}

function changePage(data) {
    const newIndex = (data.currentIndex || 1) - 1;
    const direction = data.direction;

    // Page turn animation
    const newspaper = document.querySelector('.newspaper');
    newspaper.classList.add(direction === 'next' ? 'page-turning-next' : 'page-turning-prev');

    setTimeout(() => {
        currentIndex = newIndex;
        displayArticle(currentIndex);
        updatePageIndicator();
        newspaper.classList.remove('page-turning-next', 'page-turning-prev');
    }, 200);
}

function updatePageIndicator() {
    document.getElementById('current-page').textContent = currentIndex + 1;
    document.getElementById('total-pages').textContent = totalArticles;
}

// =====================================
// NUI MESSAGE HANDLER
// =====================================

window.addEventListener('message', function(event) {
    const data = event.data;

    switch (data.action) {
        case 'showOverlay':
            showOverlay(data.data);
            break;
        case 'hideOverlay':
            hideOverlay();
            break;
        case 'openWriter':
            openWriter(data.data);
            break;
        case 'closeWriter':
            const writer = document.getElementById('article-writer');
            writer.classList.add('hidden');
            break;
        case 'openNewspaper':
            openNewspaper(data.data);
            break;
        case 'closeNewspaper':
            const reader = document.getElementById('newspaper-reader');
            reader.classList.add('hidden');
            break;
        case 'changePage':
            changePage(data.data);
            break;
    }
});

// =====================================
// KEYBOARD HANDLER
// =====================================

document.addEventListener('keydown', function(event) {
    // Close writer on Escape
    if (event.key === 'Escape') {
        const writer = document.getElementById('article-writer');
        if (!writer.classList.contains('hidden')) {
            closeWriter();
        }

        const reader = document.getElementById('newspaper-reader');
        if (!reader.classList.contains('hidden')) {
            closeNewspaper();
        }
    }
});

// =====================================
// UTILITY FUNCTIONS
// =====================================

function getResourceName() {
    // FiveM provides GetParentResourceName as a global function
    if (typeof GetParentResourceName === 'function') {
        return GetParentResourceName();
    }
    return 'p_weazelnews';
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);
