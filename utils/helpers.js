/**
 * Capitaliza la primera letra de cada palabra en una cadena.
 * @param {string} str - La cadena a capitalizar.
 * @returns {string} - La cadena capitalizada.
 */
function capitalizarPalabras(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}

module.exports = {
  capitalizarPalabras
}; 