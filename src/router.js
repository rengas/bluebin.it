import { home, initHome } from './pages/home';
import { about } from './pages/about';
import { Layout } from './components/Layout';

const routes = {
    '/': {
        component: home,
        init: initHome
    },
    '/about': {
        component: about,
        init: null
    }
};

// Handle clicks on navigation links
function handleNavigation(e) {
    // Only handle links within our app
    if (e.target.matches('.nav-link')) {
        e.preventDefault();
        const path = new URL(e.target.href).pathname;
        history.pushState(null, '', path);
        router();
    }
}

// Initialize router
export function initRouter() {
    // Add click handler for navigation
    document.addEventListener('click', handleNavigation);

    // Handle browser back/forward
    window.addEventListener('popstate', router);

    // Initial route
    router();
}

export function router() {
    const path = window.location.pathname;
    const app = document.getElementById('app');
    const route = routes[path] || routes['/'];

    // Initialize layout if it doesn't exist
    if (!app.querySelector('.site-header')) {
        app.innerHTML = Layout();
    }

    // Update only the main content
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = route.component();

    // Initialize page if needed
    if (route.init) {
        route.init();
    }
}