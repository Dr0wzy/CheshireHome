// Get the hamburger button, close button, side menu, and main content
const hamburger = document.getElementById('mobileHeaderSettingsHamburger');
const sideMenu = document.getElementById('mobileHeaderSettingsSideMenu');
const closeBtn = document.getElementById('mobileHeaderSettingsSideMenuCloseButton');
const mainContent = document.getElementById('siteContent');

// When the hamburger button is clicked, open the side menu and blur the content
hamburger.onclick = function() {
    sideMenu.classList.add('mobile-header-settings-side-menu-active');
    mainContent.classList.add('blur'); // Add the blur effect to the content
}

// When the close button is clicked, close the side menu and remove the blur
closeBtn.onclick = function() {
    sideMenu.classList.remove('mobile-header-settings-side-menu-active');
    mainContent.classList.remove('blur'); // Remove the blur effect
}

// Close the side menu if clicked outside the menu area
window.onclick = function(event) {
    // Check if the clicked target is NOT the side menu or a child of it
    if (!sideMenu.contains(event.target) && !hamburger.contains(event.target)) {
        sideMenu.classList.remove('mobile-header-settings-side-menu-active');
        mainContent.classList.remove('blur');
    }
}
