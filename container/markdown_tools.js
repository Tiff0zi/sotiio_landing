/**
 * markdown_tools.js
 * --------------------------------------
 * Мини-утилиты для применения markdown-форматирования к textarea:
 *  - жирный (**text**)
 *  - заголовки (#, ##)
 *  - списки (- item)
 *
 * Используется в SOTIIO container для панелей форматирования
 * в Notes (AT15) и при редактировании обычных meta-данных.
 *
 * Экспортирует global.MarkdownTools.applyMarkdown(textarea, action)
 * где action ∈ { "bold", "h1", "h2", "ul" }.
 */

(function (global) {
  'use strict';

  function applyMarkdown(textarea, action) {
    if (!textarea || !action) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const value = textarea.value ?? '';
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);

    function replace(newSelected, prefix = '', suffix = '') {
      textarea.value = before + prefix + newSelected + suffix + after;
      const newStart = before.length + prefix.length;
      const newEnd = newStart + newSelected.length;
      textarea.selectionStart = newStart;
      textarea.selectionEnd = newEnd;
      textarea.focus();
    }

    if (action === 'bold') {
      const text = selected || 'текст';
      replace(text, '**', '**');
      return;
    }

    if (action === 'h1' || action === 'h2') {
      const lines = (selected || 'Заголовок').split('\n');
      const prefix = action === 'h1' ? '# ' : '## ';
      const out = lines.map(l => (l.startsWith('#') ? l : prefix + l)).join('\n');
      replace(out);
      return;
    }

    if (action === 'ul') {
      const lines = (selected || 'элемент списка').split('\n');
      const out = lines.map(l => (l.startsWith('- ') ? l : '- ' + l)).join('\n');
      replace(out);
      return;
    }
  }

  global.MarkdownTools = {
    applyMarkdown
  };
})(window);
