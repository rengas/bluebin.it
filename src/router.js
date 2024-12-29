import { Home, initHome } from './pages/Home';
import { About } from './pages/About';
import { Layout } from './components/Layout';

const routes = {
    '/': {
        component: Home,
        init: initHome
    },
    '/about': {
        component: About,
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