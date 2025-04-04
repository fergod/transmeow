// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateSelection",
    title: "翻译选中文本",
    contexts: ["selection"]
  });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateSelection") {
    const text = info.selectionText;
    translateText(text, tab.id);
  }
});

// 翻译函数
async function translateText(text, tabId) {
  try {
    // 获取翻译结果
    const translateResponse = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&dt=rm&q=${encodeURIComponent(text)}`);
    const translateData = await translateResponse.json();
    const translatedText = translateData[0][0][0];
    const detectedLang = translateData[2];

    // 如果是英文，获取音标
    let phonetic = '';
    if (detectedLang === 'en') {
      try {
        const phoneticResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`);
        const phoneticData = await phoneticResponse.json();
        if (phoneticData[0] && phoneticData[0].phonetic) {
          phonetic = phoneticData[0].phonetic;
        }
      } catch (error) {
        console.log('获取音标失败:', error);
      }
    }
    
    // 发送翻译结果到content script
    chrome.tabs.sendMessage(tabId, {
      action: "showTranslation",
      translation: translatedText,
      original: text,
      phonetic: phonetic,
      sourceLanguage: detectedLang
    });
  } catch (error) {
    console.error("翻译错误:", error);
    chrome.tabs.sendMessage(tabId, {
      action: "showError",
      message: "翻译失败，请稍后重试"
    });
  }
} 