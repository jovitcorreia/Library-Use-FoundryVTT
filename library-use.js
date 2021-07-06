import {Library} from './classes/library.js';
import {Use} from './classes/use.js';

export const library = new Library();
export const use = new Use();

function registerSettings() {
  game.settings.register('library-use', 'akloShowMode', {
    name: game.i18n.localize('LIBRARY.SETTINGS.akloShowMode'),
    hint: game.i18n.localize('LIBRARY.SETTINGS.akloShowModeHint'),
    scope: 'world',
    config: true,
    type: String,
    choices: {
      'runes': game.i18n.localize('LIBRARY.SETTINGS.akloShowModeRunes'),
      'text': game.i18n.localize('LIBRARY.SETTINGS.akloShowModeText'),
    },
    default: 'runes',
    onChange: () => location.reload(),
  });
  game.settings.register('library-use', 'skillValueForLanguages', {
    name: game.i18n.localize('LIBRARY.SETTINGS.skillValueForLanguages'),
    hint: game.i18n.localize('LIBRARY.SETTINGS.skillValueForLanguagesHint'),
    scope: 'world',
    config: true,
    type: Number,
    range: {
      min: 0,
      max: 99,
      step: 1,
    },
    default: 50,
    onChange: () => location.reload(),
  });
  game.settings.register('library-use', 'mythosValueForAklo', {
    name: game.i18n.localize('LIBRARY.SETTINGS.mythosValueForAklo'),
    hint: game.i18n.localize('LIBRARY.SETTINGS.mythosValueForAkloHint'),
    scope: 'world',
    config: true,
    type: Number,
    range: {
      min: 0,
      max: 99,
      step: 1,
    },
    default: 50,
    onChange: () => location.reload(),
  });
}
function updateCharacterSkills(item) {
  if (item.data.type !== 'skill') return;
  Object.entries(library.supportedLanguages).forEach(([standard, localized]) => {
    if (item.name == localized) Hooks.on('updateActor', () => use.updateActorsLanguages());
  });
}
Hooks.on('ready', () => {
  library.activateLanguageFlags();
});
Hooks.on('renderChatLog', (log, html) => {
  use.renderChatBar(html);
  registerSettings();
});
Hooks.on('renderJournalSheet', (document, html) => {
  use.renderJournalSheet(document, html);
});
Hooks.on('preCreateChatMessage', (document) => {
  use.prepareMessage(document);
});
Hooks.on('renderChatMessage', (message, html, data) => {
  use.showMessageOnChat(message, html);
});
Hooks.on('updateItem', (item) => updateCharacterSkills(item));
Hooks.on('deleteItem', (item) => updateCharacterSkills(item));
