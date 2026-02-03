// Hash-based Router

class Router {
    constructor() {
        this.routes = {};
        this.currentView = null;
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    addRoute(path, view) {
        this.routes[path] = view;
    }

    async handleRoute() {
        const hash = window.location.hash || '#/';
        const path = hash.slice(1) || '/';

        // Unmount current view
        if (this.currentView && typeof this.currentView.unmount === 'function') {
            this.currentView.unmount();
        }

        // Find matching route
        const view = this.routes[path];
        if (view) {
            this.currentView = view;
            const app = document.getElementById('app');
            app.innerHTML = view.render();

            if (typeof view.mount === 'function') {
                view.mount();
            }
        } else {
            // Default to home if route not found
            window.location.hash = '#/';
        }
    }

    navigate(path) {
        window.location.hash = path;
    }

    start() {
        this.handleRoute();
    }
}

export const router = new Router();
