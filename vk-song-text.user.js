// ==UserScript==
// @name         VK Song Texts & Lyrics
// @namespace    Zarubin
// @version      2.3.3
// @description  Adds a button to show the lyrics of almost any of the songs in VK.
// @author       @ArtemiyZarubin [Artemiy Zarubin]
// @match        https://vk.com/aud*
// @require      http://code.jquery.com/jquery-latest.js
// @grant        unsafeWindow
// @updateURL    https://github.com/Artemiy-Zarubin/vk-song-text/raw/refs/heads/main/vk-song-text.user.js
// @downloadURL  https://github.com/Artemiy-Zarubin/vk-song-text/raw/refs/heads/main/vk-song-text.user.js
// ==/UserScript==
(function() {
    let songIndex = 0;
    const availableProxies = ["https://api.allorigins.win/raw?url=", "https://cors-anywhere.herokuapp.com/"];

    function escapeHTML(text) {
        const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[<>"']/g, m => map[m]);
    }
    const ourtg = `<a href="https://t.me/zadevv">@zadevv</a>`
    function openModalWithLyrics(lyricsHTML, name, cr, photo) {
        function getAudioPlayer() {
            return unsafeWindow.audioPlayer || unsafeWindow.ap;
        }
        const audioPlayer = getAudioPlayer();
        if (audioPlayer) {
            const bv = new unsafeWindow.AudioPlayerUI({ audioPlayer: audioPlayer });
            bv.lyrics.modal.open({
                "audio": [0, 0, "hi", name, cr], // 13
                "playlist": null,
                "context": "my:recent_audios"
            });

            setTimeout(() => {
                const modalContent = document.querySelector('.AudioLyricsModal__content--UNINs');
                const AudioPhoto = document.querySelector('[class^="AudioCover"]');

                if (modalContent) {
                    AudioPhoto.innerHTML = `<img src='${photo}' height='80' width='80'>`;
                    modalContent.style.overflow = 'auto';
                    modalContent.style.marginBottom = '30px';
                    modalContent.style.display = 'block';
                    modalContent.style.textAlign = 'center';

                    modalContent.innerHTML = `<br><br><br><b style="color: #007bff;">by @ArtemiyZarubin | Наш чат: ${ourtg}</b><br>`+lyricsHTML;
                }
            }, 200);
        } else {
            console.log("Аудиоплеер не найден.");
        }
    }

    function fetchGeniusLyrics(artist, photo, title, index, proxyIndex = 0) {
        const query = encodeURI(artist + " - " + title);
        const apiUrl = `https://genius.com/api/search/multi?q=${query}`;
        const proxyUrl = availableProxies[proxyIndex];
        const lyricsDiv = $(`#lyricsContainer${index}`);
        lyricsDiv.html(`Ищем текст.. tg: ${ourtg}`);

        fetch(proxyUrl + apiUrl)
            .then(response => response.json())
            .then(data => {
            if (data.meta.status === 200) {
                const song = data.response?.sections[1]?.hits?.[0]?.result;
                if (song && song.relationships_index_url) {
                    const lyricsUrl = song.relationships_index_url.replace('sample', 'lyrics');
                    fetch(proxyUrl + lyricsUrl)
                        .then(response => response.text())
                        .then(html => {
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        const lyricsContainers = doc.querySelectorAll('div[data-lyrics-container="true"]');
                        const lyricsHTML = Array.from(lyricsContainers)
                        .map(container => container.innerHTML.replace(/href=["'].*?["']/g, 'href="https://t.me/zadevv" target="_blank"'))
                        .join('<br>');

                        lyricsDiv.html(`with love ${ourtg}`);
                        openModalWithLyrics(lyricsHTML || `Текст не найден. ${ourtg}`, title, artist, photo);
                    })
                        .catch(() => lyricsDiv.html(`Ошибка загрузки текста. ${ourtg}`));
                } else {
                    lyricsDiv.html(`Песня не найдена. ${ourtg}`);
                }
            }
        })
            .catch(() => {
            if (proxyIndex < availableProxies.length - 1) {
                fetchGeniusLyrics(artist, photo, title, index, proxyIndex + 1);
            } else {
                lyricsDiv.html(`Все запросы не удались. Сообщите: ${ourtg}`);
            }
        });
    }

    $(document).on("mouseenter", ".audio_row", function() {
        const element = $(this);
        const songId = element.parent().attr('data-index');
        if (songId) return;

        const uniqueIndex = songIndex++;
        if ($(`[data-index="${uniqueIndex}"]`).length > 0) return;

        element.wrap(`<div class='song' data-index="${uniqueIndex}"></div>`);
        const container = $(`[data-index="${uniqueIndex}"]`);

        const photoURL = container.find('.audio_row__cover').attr('src');
        const artist = escapeHTML(container.find('.audio_row__performers a').first().text());
        const title = escapeHTML(container.find('.audio_row__title_inner').text());

        const buttons = `
            <div class="lyrics-buttons" data-index="${uniqueIndex}" style="padding: 5px; font-family: Arial, sans-serif;">
                <button id="getGeniusLyricsBtn${uniqueIndex}" style="font-size: 11px; color: #007bff; background: transparent; border: 1px solid #007bff; padding: 2px 3px; border-radius: 4px; cursor: pointer; transition: background-color 0.3s; margin-top: 1px;">Текст</button>
                <a target="_blank" href="https://www.google.com/search?q=${encodeURI(artist + ' - ' + title + ' lyrics')}" style="font-size: 8px; color: #007bff; text-decoration: none; border: 1px solid #007bff; padding: 2px 3px; border-radius: 4px; margin: 1px;">Поиск</a>
                <a target="_blank" href="https://www.google.com/search?q=${encodeURI(artist + ' - ' + title + ' перевод')}" style="font-size: 8px; color: #007bff; text-decoration: none; border: 1px solid #007bff; padding: 2px 3px; border-radius: 4px; margin: 1px;">Перевод</a>
                <div id="lyricsContainer${uniqueIndex}" style="font-size: 11px; padding-top: 5px; color: #333;"></div>
            </div>`;
        container.append(buttons);

        $(`#getGeniusLyricsBtn${uniqueIndex}`).on('click', function() {
            fetchGeniusLyrics(artist, photoURL, title, uniqueIndex);
        });
    });

    $(document).on("mouseleave", ".song", function() {
        const index = $(this).data('index');
        $(`[data-index="${index}"] .lyrics-buttons`).hide();
    });

    $(document).on("mouseenter", ".song", function() {
        const index = $(this).data('index');
        $(`[data-index="${index}"] .lyrics-buttons`).show();
    });
})();
