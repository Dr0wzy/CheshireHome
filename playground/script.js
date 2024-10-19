// Get the hamburger button, close button, side menu, and main content
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('sideMenu');
const closeBtn = document.getElementById('closeBtn');
const mainContent = document.getElementById('mainContent');

// When the hamburger button is clicked, open the side menu and blur the content
hamburger.onclick = function() {
    sideMenu.classList.add('active');
    mainContent.classList.add('blur'); // Add the blur effect to the content
}
    
// When the close button is clicked, close the side menu and remove the blur
closeBtn.onclick = function() {
    sideMenu.classList.remove('active');
    mainContent.classList.remove('blur'); // Remove the blur effect
}

// Close the side menu if clicked outside the menu area
window.onclick = function(event) {
    // Check if the clicked target is NOT the side menu or a child of it
    if (!sideMenu.contains(event.target) && !hamburger.contains(event.target)) {
        sideMenu.classList.remove('active');
        mainContent.classList.remove('blur');
    }
}
