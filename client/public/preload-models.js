// This script checks if the models are loaded and redirects to the model loader if needed
(function() {
  // Check if we're already on the model loader page
  if (window.location.pathname === '/load-models.html') {
    return;
  }
  
  // Check if we're on the test page
  if (window.location.pathname === '/face-test.html') {
    return;
  }
  
  // Check if models have been loaded before
  const modelsLoaded = localStorage.getItem('face-models-loaded');
  
  // If models haven't been loaded, redirect to the model loader
  if (!modelsLoaded) {
    console.log('Face models have not been loaded. Redirecting to model loader...');
    
    // Set a flag to prevent infinite redirects
    localStorage.setItem('redirect-from', window.location.pathname);
    
    // Redirect to the model loader
    window.location.href = '/load-models.html';
  } else {
    console.log('Face models have been loaded before. Continuing to app...');
  }
})();
