// ==UserScript==
// @name         VK Song Texts & Lyrics
// @namespace    Zarubin
// @version      2.1.0
// @description  Adds a button to show the lyrics of almost any of the songs in VK.
// @author       @ArtemiyZarubin [Artemiy Zarubin]
// @match        https://vk.com/aud*
// @require      http://code.jquery.com/jquery-latest.js
// @updateURL    https://github.com/Artemiy-Zarubin/vk-song-text/raw/refs/heads/main/vk-song-text.user.js
// @downloadURL  https://github.com/Artemiy-Zarubin/vk-song-text/raw/refs/heads/main/vk-song-text.user.js
// ==/UserScript==

(function() {
    let songIndex = 0;
    const songContainerMap = new Map();

    $(document).on("mouseenter", ".audio_row", function() {
        const currentElement = $(this);
        const songId = currentElement.parent().attr('data-index');

        if (songId) return;

        const uniqueIndex = songIndex++;

        if ($("[data-index='" + uniqueIndex + "']").length > 0) return;

        currentElement.wrap("<div class='song' data-index='" + uniqueIndex + "'></div>");

        const currentSong = $("[data-index='" + uniqueIndex + "']");
        const artist = escapeHTML(currentSong.find('.audio_row__performers a').first().text());
        const title = escapeHTML(currentSong.find('.audio_row__title_inner').text());

        const buttons = `
            <div class="lyrics-buttons" data-index="${uniqueIndex}" style="padding: 5px; font-family: Arial, sans-serif;">
                <button id="getGeniusLyricsBtn${uniqueIndex}" style="display: inline-block; font-size: 11px; color: #007bff; background-color: transparent; border: 1px solid #007bff; padding: 2px 3px; border-radius: 4px; cursor: pointer; transition: background-color 0.3s ease; margin-top: 1px;">Текст</button>
                <a target="_blank" href="https://www.google.com/search?q=${encodeURI(artist + ' - ' + title + ' lyrics')}" style="display: inline-block; margin-bottom: 3px; font-size: 8px; color: #007bff; text-decoration: none; padding: 2px 3px; border: 1px solid #007bff; border-radius: 4px; transition: background-color 0.3s ease;">Поиск</a>
                <a target="_blank" href="https://www.google.com/search?q=${encodeURI(artist + ' - ' + title + ' перевод')}" style="display: inline-block; margin-bottom: 3px; font-size: 8px; color: #007bff; text-decoration: none; padding: 2px 3px; border: 1px solid #007bff; border-radius: 4px; transition: background-color 0.3s ease;">Перевод</a>
                <div id="lyricsContainer${uniqueIndex}" style="font-size: 11px; padding-top: 5px; color: #333;"></div>
            </div>`;
        currentSong.append(buttons);
        songContainerMap.set(songId, uniqueIndex);

        $('#getGeniusLyricsBtn' + uniqueIndex).on('click', function() {
            $('#getGeniusLyricsBtn'+uniqueIndex).hide();
            fetchGeniusLyrics(artist, title, uniqueIndex);
        });
    });

    $(document).on("mouseleave", ".song", function() {
        const uniqueIndex = $(this).data('index');
        if (uniqueIndex !== undefined) {
            const buttons = $("[data-index='" + uniqueIndex + "']").find('.lyrics-buttons');
            buttons.hide();
        }
    });

    $(document).on("mouseenter", ".song", function() {
        const uniqueIndex = $(this).data('index');
        if (uniqueIndex !== undefined) {
            const buttons = $("[data-index='" + uniqueIndex + "']").find('.lyrics-buttons');

            if (!buttons.is(':visible')) {
                buttons.show();
            }
        }
    });

    const availableProxies = [
        "https://api.allorigins.win/raw?url=",
        "https://cors-anywhere.herokuapp.com/"
    ];

    function fetchGeniusLyrics(artist, title, index, proxyIndex = 0) {
        const query = encodeURI(artist + " - " + title);
        const apiUrl = `https://genius.com/api/search/multi?q=${query}`;
        const proxyUrl = availableProxies[proxyIndex];

        const lyricsDiv = document.getElementById(`lyricsContainer${index}`);
        lyricsDiv.innerHTML = 'Ищем текст.. tg: <a href="https://t.me/zadevv" target="_blank">@zadevv</a>';

        fetch(proxyUrl + apiUrl)
            .then(response => response.json())
            .then(data => {
            if (data.meta.status === 200) {
                if (!data.response?.sections[1].hits) return console.log('No song found');
                const song = data.response?.sections[1]?.hits?.[0]?.result;
                if (song && song.relationships_index_url) {
                    let pathsong = song.relationships_index_url.replace('sample', 'lyrics');
                    console.log('Song Genius URL:', pathsong);

                    fetch(proxyUrl + pathsong)
                        .then(response => response.text())
                        .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const lyricsContainer = doc.querySelector('div[data-lyrics-container="true"]');
                        if (lyricsDiv) {
                            if (lyricsContainer) {
                                lyricsDiv.innerHTML = lyricsContainer.innerHTML;
                            } else {
                                lyricsDiv.innerHTML = 'Lyrics not found in the page.';
                            }
                        } else {
                            console.error('Lyrics div not found.');
                        }
                    })
                        .catch(err => console.error('Error fetching lyrics page:', err));
                } else {
                    console.log('No song found for the query.');
                    lyricsDiv.innerHTML = 'Не нашли текст этой песни. tg: <a href="https://t.me/zadevv" target="_blank">@zadevv</a>'
                }
            } else {
                console.log('Error fetching Genius data.');
            }
        })
            .catch(err => {
            console.error('Request failed:', err);
            if (proxyIndex < availableProxies.length - 1) {
                console.log(`Trying next proxy: ${availableProxies[proxyIndex + 1]}`);
                fetchGeniusLyrics(artist, title, index, proxyIndex + 1);
            } else {
                console.log('All proxies failed.');
            }
        });
    }

    function escapeHTML(text) {
        const map = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[<>"']/g, function(m) { return map[m]; });
    }
})();
