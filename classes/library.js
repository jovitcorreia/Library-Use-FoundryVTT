import aklo from '../dictionaries/aklo.js';
import arabic from '../dictionaries/arabic.js';
import chinese from '../dictionaries/chinese.js';
import english from '../dictionaries/english.js';
import french from '../dictionaries/french.js';
import german from '../dictionaries/german.js';
import greek from '../dictionaries/greek.js';
import hindi from '../dictionaries/hindi.js';
import italian from '../dictionaries/italian.js';
import latin from '../dictionaries/latin.js';
import portuguese from '../dictionaries/portuguese.js';
import russian from '../dictionaries/russian.js';
import serbian from '../dictionaries/serbian.js';
import spanish from '../dictionaries/spanish.js';
import turkish from '../dictionaries/turkish.js';

export class Library {
  get supportedLanguages() {
    return {
      'aklo': game.i18n.localize('LIBRARY.LANGUAGES.Aklo'),
      'arabic': game.i18n.localize('LIBRARY.LANGUAGES.Arabic'),
      'chinese': game.i18n.localize('LIBRARY.LANGUAGES.Chinese'),
      'english': game.i18n.localize('LIBRARY.LANGUAGES.English'),
      'french': game.i18n.localize('LIBRARY.LANGUAGES.French'),
      'german': game.i18n.localize('LIBRARY.LANGUAGES.German'),
      'greek': game.i18n.localize('LIBRARY.LANGUAGES.Greek'),
      'hindi': game.i18n.localize('LIBRARY.LANGUAGES.Hindi'),
      'italian': game.i18n.localize('LIBRARY.LANGUAGES.Italian'),
      'latin': game.i18n.localize('LIBRARY.LANGUAGES.Latin'),
      'portuguese': game.i18n.localize('LIBRARY.LANGUAGES.Portuguese'),
      'russian': game.i18n.localize('LIBRARY.LANGUAGES.Russian'),
      'serbian': game.i18n.localize('LIBRARY.LANGUAGES.Serbian'),
      'spanish': game.i18n.localize('LIBRARY.LANGUAGES.Spanish'),
      'turkish': game.i18n.localize('LIBRARY.LANGUAGES.Turkish'),
    };
  }
  get characterList() {
    return game.actors.filter((actor) => actor.hasPlayerOwner);
  }
  async activateLanguageFlags() {
    this.characterList.forEach((character) => {
      const knownLanguages = [];
      for (let i = 0; i < Object.keys(this.supportedLanguages).length; i++) {
        if (character.getSkillsByName(Object.values(this.supportedLanguages)[i]).length !== 0) {
          knownLanguages.push(Object.keys(this.supportedLanguages)[i]);
        }
      }
      character.setFlag('library-use', 'languages', knownLanguages);
    });
  }
  async convertText(text, language) {
    let dictionary = '';
    switch (language) {
      case 'arabic':
        dictionary = arabic;
        break;
      case 'chinese':
        dictionary = chinese;
        break;
      case 'english':
        dictionary = english;
        break;
      case 'french':
        dictionary = french;
        break;
      case 'german':
        dictionary = german;
        break;
      case 'greek':
        dictionary = greek;
        break;
      case 'hindi':
        dictionary = hindi;
        break;
      case 'italian':
        dictionary = italian;
        break;
      case 'latin':
        dictionary = latin;
        break;
      case 'portuguese':
        dictionary = portuguese;
        break;
      case 'russian':
        dictionary = russian;
        break;
      case 'serbian':
        dictionary = serbian;
        break;
      case 'spanish':
        dictionary = spanish;
        break;
      case 'turkish':
        dictionary = turkish;
        break;
      default:
        dictionary = aklo;
    }
    const sanitization = text.replace(/<[^>]*>/g, ' ').split(' ');
    let phrase = [];
    sanitization.forEach((word) => {
      phrase.push(word.replace(word, dictionary[Math.floor(Math.random() * dictionary.length)]));
    });
    phrase = phrase.join(' ');
    return phrase[0].toUpperCase() + phrase.slice(1);
  }
  async standardizeLanguage(language) {
    Object.entries(this.supportedLanguages).forEach(([standard, localized]) => {
      if (language == localized) language = standard;
    });
    return language;
  }
  async localizeLanguage(language) {
    Object.entries(this.supportedLanguages).forEach(([standard, localized]) => {
      if (language == standard) language = localized;
    });
    return language;
  }
}
