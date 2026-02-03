// Main App - Router initialization

import { router } from './router.js';
import { homeView } from './views/home.js';
import { tutorialView } from './views/tutorial.js';
import { simpleView } from './views/simple.js';

// Register routes
router.addRoute('/', homeView);
router.addRoute('/tutorial', tutorialView);
router.addRoute('/simple', simpleView);

// Start router
router.start();

// Handle beforeunload for stream cleanup
window.addEventListener('beforeunload', () => {
    if (router.currentView && typeof router.currentView.unmount === 'function') {
        router.currentView.unmount();
    }
});

console.log("✅ SPA 앱 초기화 완료");
