// 创建翻译结果显示框
let translationPopup = null;
let lastMouseEvent = null;

// 保存最后的鼠标位置
document.addEventListener('mouseup', function(e) {
  lastMouseEvent = {
    clientX: e.clientX,
    clientY: e.clientY,
    pageX: e.pageX,
    pageY: e.pageY
  };
});

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showTranslation") {
    showTranslationPopup(message.translation, message.original, message.phonetic, message.sourceLanguage);
  } else if (message.action === "showError") {
    showError(message.message);
  }
});

// 创建发音功能
function createSpeakButton(text, lang) {
  const button = document.createElement('button');
  button.innerHTML = '🔊';
  button.style.cssText = `
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 0 5px;
    vertical-align: middle;
  `;
  button.addEventListener('click', () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'zh-CN';
    window.speechSynthesis.speak(utterance);
  });
  return button;
}

// 显示翻译结果
function showTranslationPopup(translation, original, phonetic, sourceLanguage) {
  // 如果没有鼠标位置信息，使用屏幕中心
  const position = lastMouseEvent || {
    clientX: window.innerWidth / 2,
    clientY: window.innerHeight / 2
  };

  // 如果已存在弹窗，先移除
  if (translationPopup) {
    document.body.removeChild(translationPopup);
  }

  // 创建弹窗
  translationPopup = document.createElement('div');
  translationPopup.style.cssText = `
    position: fixed;
    top: ${position.clientY + 10}px;
    left: ${position.clientX + 10}px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    max-width: 300px;
    font-family: Arial, sans-serif;
  `;

  // 确保弹窗不会超出屏幕边界
  const rect = translationPopup.getBoundingClientRect();
  if (position.clientX + rect.width > window.innerWidth) {
    translationPopup.style.left = (window.innerWidth - rect.width - 10) + 'px';
  }
  if (position.clientY + rect.height > window.innerHeight) {
    translationPopup.style.top = (window.innerHeight - rect.height - 10) + 'px';
  }

  // 创建内容容器
  const contentDiv = document.createElement('div');
  
  // 添加原文和发音按钮
  const originalDiv = document.createElement('div');
  originalDiv.style.marginBottom = '5px';
  originalDiv.style.color = '#666';
  originalDiv.textContent = '原文：' + original;
  const originalSpeakButton = createSpeakButton(original, sourceLanguage);
  originalDiv.appendChild(originalSpeakButton);
  
  // 如果有音标，添加音标显示
  if (phonetic) {
    const phoneticSpan = document.createElement('span');
    phoneticSpan.style.color = '#888';
    phoneticSpan.style.marginLeft = '5px';
    phoneticSpan.textContent = phonetic;
    originalDiv.appendChild(phoneticSpan);
  }
  
  // 添加译文和发音按钮
  const translationDiv = document.createElement('div');
  translationDiv.style.color = '#333';
  translationDiv.textContent = '译文：' + translation;
  const translationSpeakButton = createSpeakButton(translation, 'zh-CN');
  translationDiv.appendChild(translationSpeakButton);
  
  // 添加关闭按钮
  const closeButtonDiv = document.createElement('div');
  closeButtonDiv.style.cssText = 'text-align: right; margin-top: 5px;';
  const closeButton = document.createElement('button');
  closeButton.textContent = '关闭';
  closeButton.style.cssText = `
    padding: 2px 8px;
    border: 1px solid #ccc;
    border-radius: 3px;
    background: #f5f5f5;
    cursor: pointer;
  `;
  closeButton.onclick = () => document.body.removeChild(translationPopup);
  closeButtonDiv.appendChild(closeButton);
  
  // 组装所有元素
  contentDiv.appendChild(originalDiv);
  contentDiv.appendChild(translationDiv);
  contentDiv.appendChild(closeButtonDiv);
  translationPopup.appendChild(contentDiv);

  // 添加到页面
  document.body.appendChild(translationPopup);

  // 点击页面其他地方时关闭弹窗
  document.addEventListener('click', function closePopup(e) {
    if (translationPopup && !translationPopup.contains(e.target)) {
      document.body.removeChild(translationPopup);
      translationPopup = null;
      document.removeEventListener('click', closePopup);
    }
  });
}

// 显示错误信息
function showError(message) {
  const position = lastMouseEvent || {
    clientX: window.innerWidth / 2,
    clientY: window.innerHeight / 2
  };

  if (translationPopup) {
    document.body.removeChild(translationPopup);
  }

  translationPopup = document.createElement('div');
  translationPopup.style.cssText = `
    position: fixed;
    top: ${position.clientY + 10}px;
    left: ${position.clientX + 10}px;
    background: #ffe6e6;
    border: 1px solid #ff9999;
    border-radius: 4px;
    padding: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    color: #cc0000;
  `;

  translationPopup.textContent = message;
  document.body.appendChild(translationPopup);

  setTimeout(() => {
    if (translationPopup) {
      document.body.removeChild(translationPopup);
      translationPopup = null;
    }
  }, 3000);
} 