/**
 * wiki_template.js
 * --------------------------------------
 * Шаблоны HTML для Wiki-блоков контейнера SOTIIO.
 *
 * Принимает нормализованный список meta-элементов:
 *  {
 *    kind: 'ai' | 'notes' | 'default',
 *    metaType: 'text'|'number'|'select'|'boolean'|'data',
 *    attributeId: 'ATxx',
 *    name: 'Человекочитаемое имя атрибута',
 *    value: 'значение',
 *    priority: number
 *  }
 *
 * Основная функция:
 *  - WikiTemplate.renderItems(items) → string HTML
 *
 * Разметка:
 *  - kind === 'ai'    → блок AI-описания (AT08), только кнопка "Получить описание"
 *  - kind === 'notes' → блок заметок с Edit/Cancel/Save + markdown-панелью
 *                       и автопереходом в режим редактирования при пустом значении
 *  - kind === 'default' → обычный meta-атрибут с View/Edit/Cancel/Save + markdown-панелью
 */

(function (global) {
  'use strict';

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderAI(item) {
    const name = escapeHtml(item.name);
    const metaType = escapeHtml(item.metaType);
    const attrId = escapeHtml(item.attributeId);

    let contentHtml = '';
    if (item.value) {
      if (global.md2html && typeof global.md2html.renderMarkdown === 'function') {
        contentHtml = global.md2html.renderMarkdown(item.value);
      } else {
        contentHtml = escapeHtml(String(item.value));
      }
    } else {
      contentHtml = '<div class="empty">Нажмите «Получить описание», чтобы сгенерировать текст.</div>';
    }

    return `
      <!-- AI-описание (AT08) -->
      <div class="wiki-item wiki-ai"
           data-kind="ai"
           data-type="${metaType}"
           data-attr-id="${attrId}">
        <div class="wiki-header">
          <h3>${name}</h3>
          <div class="wiki-actions">
            <button type="button" class="wiki-ai-btn">Получить описание</button>
          </div>
        </div>
        <div class="wiki-ai-content">
          ${contentHtml}
        </div>
      </div>
    `;
  }

  function renderNotes(item) {
    const name = escapeHtml(item.name);
    const metaType = escapeHtml(item.metaType);
    const attrId = escapeHtml(item.attributeId);
    const valueRaw = item.value == null ? '' : String(item.value);
    const value = escapeHtml(valueRaw);

    // Если value пустой → auto-edit=1 → при загрузке узла сразу откроется редактор
    const autoEdit = valueRaw.trim() === '' ? '1' : '0';

    return `
      <!-- Заметки пользователя (AT15) — ведут себя как обычный meta, но при пустом value сразу открывается редактор -->
      <div class="wiki-item wiki-notes"
           data-kind="notes"
           data-type="${metaType}"
           data-attr-id="${attrId}"
           data-auto-edit="${autoEdit}">
        <div class="wiki-header">
          <h3>${name}</h3>
          <div class="wiki-actions">
            <button type="button" class="wiki-edit-btn">Edit</button>
            <button type="button" class="wiki-cancel-btn" style="display:none;">Cancel</button>
            <button type="button" class="wiki-save-btn" style="display:none;">Save</button>
          </div>
        </div>
        <div class="wiki-view">
          <div class="wiki-value">${value}</div>
        </div>
        <div class="wiki-edit" style="display:none;">
          <div class="wiki-edit-toolbar">
            <button type="button" class="wiki-md-btn" data-md-action="bold">B</button>
            <button type="button" class="wiki-md-btn" data-md-action="h1">H1</button>
            <button type="button" class="wiki-md-btn" data-md-action="h2">H2</button>
            <button type="button" class="wiki-md-btn" data-md-action="ul">• List</button>
          </div>
          <textarea class="wiki-edit-textarea">${value}</textarea>
        </div>
      </div>
    `;
  }

  function renderDefault(item) {
    const name = escapeHtml(item.name);
    const metaType = escapeHtml(item.metaType);
    const attrId = escapeHtml(item.attributeId);
    const valueRaw = item.value == null ? '' : String(item.value);
    const value = escapeHtml(valueRaw);

    return `
      <!-- Обычный meta-атрибут с View/Edit/Cancel/Save -->
      <div class="wiki-item"
           data-kind="default"
           data-type="${metaType}"
           data-attr-id="${attrId}">
        <div class="wiki-header">
          <h3>${name}</h3>
          <div class="wiki-actions">
            <button type="button" class="wiki-edit-btn">Edit</button>
            <button type="button" class="wiki-cancel-btn" style="display:none;">Cancel</button>
            <button type="button" class="wiki-save-btn" style="display:none;">Save</button>
          </div>
        </div>
        <div class="wiki-view">
          <div class="wiki-value">${value}</div>
        </div>
        <div class="wiki-edit" style="display:none;">
          <div class="wiki-edit-toolbar">
            <button type="button" class="wiki-md-btn" data-md-action="bold">B</button>
            <button type="button" class="wiki-md-btn" data-md-action="h1">H1</button>
            <button type="button" class="wiki-md-btn" data-md-action="h2">H2</button>
            <button type="button" class="wiki-md-btn" data-md-action="ul">• List</button>
          </div>
          <textarea class="wiki-edit-textarea"></textarea>
        </div>
      </div>
    `;
  }

  function renderItems(items) {
    if (!Array.isArray(items) || !items.length) return '';
    let html = '';

    items.forEach(item => {
      if (!item || !item.kind) return;
      if (item.kind === 'ai') {
        html += renderAI(item);
      } else if (item.kind === 'notes') {
        html += renderNotes(item);
      } else {
        html += renderDefault(item);
      }
    });

    return html;
  }

  global.WikiTemplate = {
    renderItems
  };
})(window);
