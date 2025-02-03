// ==UserScript==
// @name         Stage1 Quote Expander
// @name:zh-CN   Stage1论坛引用内容展开器
// @namespace    user-NITOUCHE
// @version      0.1.1
// @description  Expands quote blocks on Stage1 forums to display full quoted post content.
// @description:zh-CN  在 Stage1 论坛展开引用块，显示完整的被引用帖子内容。
// @author       DS泥头车
// @match        https://*.saraba1st.com/2b/thread-*
// @icon         https://bbs.saraba1st.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @license      MIT
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    const quoteDivs = document.querySelectorAll('div.quote');
    quoteDivs.forEach(quoteDiv => {
        const blockquote = quoteDiv.querySelector('blockquote');
        if (!blockquote) return;
        const quoteText = blockquote.textContent.trim();
        if (quoteText.endsWith(' ...')) {
            const linkElement = quoteDiv.querySelector('font[size="2"] a');
            if (!linkElement) return;
            const postLink = linkElement.href;
            const urlParams = new URLSearchParams(new URL(postLink).search);
            const pid = urlParams.get('pid');
            if (pid) {
                // **1. 提前提取引用头 HTML (使用更直接的选择器)**
                let quoteHeaderHTML = '';
                try {
                    const quoteHeaderElement = quoteDiv.querySelector('blockquote > font[size="2"]');
                    if (quoteHeaderElement) {
                        quoteHeaderHTML = quoteHeaderElement.outerHTML;
                    }
                } catch (error) {
                    console.warn("Error extracting quote header:", error); // 捕获并输出引用头提取错误
                }

                blockquote.innerHTML = '<span style="color: var(--quote-loading-color, grey);">加载中...</span>';
                GM_xmlhttpRequest({
                    url: postLink,
                    method: 'GET',
                    onload: function(response) {
                        if (response.status === 200) {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(response.responseText, 'text/html');
                            const postContentSelector = '#postmessage_' + pid;
                            const originalPostContentElement = doc.querySelector(postContentSelector);

                            if (originalPostContentElement) {
                                const fullPostContentHTML = originalPostContentElement.innerHTML;

                                // **2. 构建新的 blockquote 内容**
                                let newBlockquoteHTML = '';
                                if (quoteHeaderHTML) {
                                    newBlockquoteHTML += quoteHeaderHTML + '<br>';
                                }
                                newBlockquoteHTML += fullPostContentHTML;

                                // **3. 设置新的 blockquote 内容**
                                blockquote.innerHTML = newBlockquoteHTML;

                            } else {
                                blockquote.innerHTML = '<span style="color: var(--quote-error-color, red);">未能加载完整内容 (找不到 #postmessage_pid)</span>';
                                console.warn('未能找到 #postmessage_pid 元素:', postLink, '选择器:', postContentSelector);
                            }
                        } else {
                            blockquote.innerHTML = '<span style="color: var(--quote-error-color, red);">加载失败</span>';
                        }
                    },
                    onerror: function(error) {
                        blockquote.innerHTML = '<span style="color: var(--quote-error-color, red);">加载出错</span>';
                    }
                });
            }
        }
    });
    GM_addStyle(`
        :root {
            --quote-loading-color: grey;
            --quote-error-color: red;
        }
    `);
})();