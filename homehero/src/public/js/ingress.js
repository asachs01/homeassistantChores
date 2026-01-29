/**
 * Home Assistant Ingress Support
 * Handles redirects and URL generation when running behind HA's ingress proxy
 */

// Cache the ingress path after first fetch
let cachedIngressPath = null;

/**
 * Get the ingress base path (if running in ingress mode)
 * @returns {Promise<string>} The base path (empty string if not in ingress)
 */
async function getIngressPath() {
  if (cachedIngressPath !== null) {
    return cachedIngressPath;
  }

  try {
    const response = await fetch('/api/ingress-info');
    if (response.ok) {
      const data = await response.json();
      cachedIngressPath = data.ingressPath || '';
      return cachedIngressPath;
    }
  } catch (e) {
    console.warn('Failed to fetch ingress info:', e);
  }

  cachedIngressPath = '';
  return cachedIngressPath;
}

/**
 * Redirect to a path, handling ingress base path automatically
 * @param {string} path - The path to redirect to (e.g., '/login.html')
 */
async function ingressRedirect(path) {
  const basePath = await getIngressPath();
  window.location.href = basePath + path;
}

/**
 * Synchronous redirect using cached ingress path
 * Use this when you need immediate redirect and have already called getIngressPath()
 * @param {string} path - The path to redirect to
 */
function ingressRedirectSync(path) {
  const basePath = cachedIngressPath || '';
  window.location.href = basePath + path;
}

// Pre-fetch ingress path on script load
getIngressPath();
