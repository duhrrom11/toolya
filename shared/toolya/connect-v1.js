/* Retired local-only prototype. Intentionally no API.
 * Cloud-only Connect must use authenticated, server-authoritative transfers.
 * This file is retained temporarily so references from older review builds fail closed.
 */
(function (global) {
  'use strict';
  global.ToolyaConnect = Object.freeze({
    ready: false,
    reason: 'Cloud-only migration pending. No local transfer permitted.'
  });
})(window);
