/**
 * meta_update.js
 * --------------------------------------
 * Модуль для обновления meta-данных узла и отправки их в n8n.
 *
 * Используется в SOTIIO container:
 *  - updateValue(meta, metaType, attributeId, newValue)
 *    обновляет локальный объект meta:
 *    * добавляет/находит entry в meta_<type> по attribute_<type>_id
 *    * записывает value
 *  - push(mapId, meta)
 *    отправляет POST на /webhook/update_meta_attributes:
 *    { map_id, meta }
 *
 * Экспортирует global.MetaUpdate.{ updateValue, push }.
 */

(function (global) {
  'use strict';

  const ENDPOINT = 'https://n8n.sotiio.com/webhook/update_meta_attributes';

  function ensureEntry(meta, metaType, attributeId) {
    if (!meta || !metaType || !attributeId) return null;

    const metaKey = `meta_${metaType}`;
    const idField = `attribute_${metaType}_id`;

    if (!meta[metaKey]) {
      meta[metaKey] = [];
    }

    const arr = meta[metaKey];
    let entry = arr.find(it => it[idField] === attributeId);

    if (!entry) {
      entry = {};
      entry[idField] = attributeId;
      arr.push(entry);
    }

    return entry;
  }

  /**
   * Обновляет/создаёт entry в meta.meta_<type> и ставит value.
   * Возвращает тот же объект meta (для удобства чейнинга).
   */
  function updateValue(meta, metaType, attributeId, newValue) {
    const entry = ensureEntry(meta, metaType, attributeId);
    if (!entry) return meta;
    entry.value = newValue;
    return meta;
  }

  /**
   * Отправляет meta в n8n.
   * Возвращает промис fetch.
   */
  function push(mapId, meta) {
    if (!mapId) {
      return Promise.reject(new Error('map_id is required'));
    }
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        map_id: mapId,
        meta: meta || {}
      })
    }).then(resp => {
      if (!resp.ok) {
        throw new Error('HTTP ' + resp.status);
      }
      return resp;
    });
  }

  global.MetaUpdate = {
    updateValue,
    push
  };
})(window);
