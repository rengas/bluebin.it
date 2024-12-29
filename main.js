import './style.css';
import { router } from './src/router';

// Initialize router
window.addEventListener('popstate', router);
router();