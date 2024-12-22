export function waitForML5() {
  return new Promise((resolve, reject) => {
    // Check if ml5 is already loaded
    if (window.ml5) {
      resolve(window.ml5);
      return;
    }

    // Wait for ml5 to load
    const checkML5 = setInterval(() => {
      if (window.ml5) {
        clearInterval(checkML5);
        resolve(window.ml5);
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkML5);
      reject(new Error('ML5 failed to load'));
    }, 10000);
  });
}