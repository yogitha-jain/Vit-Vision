document.addEventListener("DOMContentLoaded", () => {

    document.body.classList.add("page-loaded");

    addPetsLink();

    function addPetsLink() {

        const menu = document.querySelector(".sidebar-menu, .sidebar-nav");

        if (!menu) return;

        if (menu.querySelector('a[href$="pets.html"]')) return;

        const onPetsPage = window.location.pathname.split("/").pop() === "pets.html";

        const link = document.createElement("a");
        link.href = "pets.html";

        if (menu.classList.contains("sidebar-menu")) {

            link.className = "sidebar-link" + (onPetsPage ? " active" : "");

            const icon = document.createElement("span");
            icon.className = "sidebar-icon";
            icon.textContent = "♥";

            link.appendChild(icon);
            link.appendChild(document.createTextNode(" My Pets"));

        } else {

            link.textContent = "My Pets";

            if (onPetsPage) link.classList.add("active");
        }

        const historyLink = menu.querySelector('a[href$="history.html"]');

        if (historyLink) {
            historyLink.insertAdjacentElement("afterend", link);
        } else {
            menu.appendChild(link);
        }
    }
});