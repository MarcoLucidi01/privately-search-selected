const SEARCH_ENGINE_BASE   = "https://google.com/search?q=";
const MENU_ID              = "privately-search-selected";
const MENU_SELECTION_TITLE = "Privately Search for \"%s\""
const MENU_LINK_TITLE      = "Privately Search for Link text"

browser.menus.create({
        id: MENU_ID,
        title: MENU_SELECTION_TITLE,
        contexts: [
                "selection",
                "link"
        ],
        icons: {
                "32": "icons/private-32.png"
        }
});

browser.menus.onShown.addListener((info) => {
        if (info.menuIds.includes(MENU_ID)) {
                updateMenuTitle(info.contexts);
        }
});

function updateMenuTitle(contexts)
{
        let title = MENU_LINK_TITLE;

        if (contexts.includes("selection")) {
                title = MENU_SELECTION_TITLE;
        }

        browser.menus.update(MENU_ID, { title: title }).then(() => browser.menus.refresh());
}

browser.menus.onClicked.addListener((info) => {
        if (info.menuItemId === MENU_ID) {
                if (info.selectionText) {
                        privatelySearch(info.selectionText);
                } else {
                        privatelySearch(info.linkText);
                }
        }
});

function privatelySearch(term)
{
        const searchUrl = SEARCH_ENGINE_BASE + encodeURIComponent(term);

        getExistingPrivateWindow().then((existingWin) => {
                if (existingWin) {
                        browser.tabs.create({ windowId: existingWin.id, url: searchUrl });
                        browser.windows.update(existingWin.id, { focused: true });
                } else {
                        browser.windows.create({ incognito: true, url: searchUrl });
                }
        });
}

function getExistingPrivateWindow()
{
        return new Promise((resolve, reject) => {
                browser.windows.getLastFocused().then((lastWin) => {
                        if (isPrivate(lastWin)) {
                                resolve(lastWin);
                                return;
                        }

                        browser.windows.getAll().then((allWins) => {
                                for (win of allWins) {
                                        if (isPrivate(win)) {
                                                resolve(win);
                                                return;
                                        }
                                }
                                resolve(null);
                        });
                });
        });
}

function isPrivate(win)
{
        return win.incognito && win.type === "normal";
}
