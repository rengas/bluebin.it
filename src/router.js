import { Home, initHome } from './pages/home';
import { about } from './pages/about';
import { Layout } from './components/layout.js';

const routes = {
    '/': {
        component: Home,
        init: initHome
    },
    '/about': {
        component: about,
        init: null
    }
};

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