// this file contains the needed javascript for common page functions

// make sure that the colection, wishlist and account in nav bar can only be seen when logged in

document.addEventListener("DOMContentLoaded", function() {
    // Function to update navigation based on user login status
    function updateNavigation(isLoggedIn) {
        var navContainer = document.getElementById("memberNav");
        if (isLoggedIn) {
            // If user is logged in, display Collection, Wishlist, and Account
            navContainer.innerHTML = `
                <a href="/collection" class="header__link">Collection</a>
                <a href="/wishlist" class="header__link">Wishlist</a>
                <a href="/account" class="header__link">Account</a>
            `;
        } else {
            // If user is not logged in, display "For members only" button
            navContainer.innerHTML = `<a href="/login" class="header__link">For members only</a>`;
        }
    }

    // set to logged in
    var isLoggedIn = true; 
    updateNavigation(isLoggedIn);
});

