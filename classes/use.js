import {library} from '../library-use.js';

export class Use {
  async updateActorsLanguages() {
    await library.activateLanguageFlags();
    await this.insertLanguageOptions('chat');
  }
  async renderChatBar(html) {
    this.chatBar = html;
    const template = await renderTemplate('modules/library-use/templates/language-select-chat.html');
    html.find('#chat-controls').after(template);
    const select = html.find('.library-language-select-chat select');
    select.change(() => {
      this.lastSelection = select.val();
    });
    await this.insertLanguageOptions('chat');
    const icon = html.find('.speaking-toggle');
    icon.click(await this.toggleChatButton.bind(this));
  }
  async insertLanguageOptions(target) {
    let html;
    let select;
    if (target == 'chat') {
      html = this.chatBar;
      select = html.find('.library-language-select-chat select');
    } else {
      html = this.journalBar;
      select = html.find('.library-language-select-journal select');
    }
    select.html('');
    let options = '';
    if (game.user.isGM) {
      Object.entries(library.supportedLanguages).forEach(([standard, localized]) => {
        options += `<option value="${standard}">${localized}</option>`;
      });
    } else {
      game.users.forEach((user) => {
        if (user.isGM) return;
        if (!user.character) return;
        if (game.user.id == user.id) {
          Object.values(user.character.data.flags['library-use'].languages).forEach((language) => {
            Object.entries(library.supportedLanguages).forEach(([standard, localized]) => {
              if (language == standard) options += `<option value="${standard}">${localized}</option>`;
            });
          });
        }
      });
    }
    select.html($(options));
    const firstOption = select.val();
    const selectedLanguage = this.lastSelection || firstOption;
    select.val(selectedLanguage);
  }
  async toggleChatButton(event) {
    event.preventDefault();
    event.currentTarget.firstChild.classList.toggle('active');
    const html = this.chatBar;
    const select = html.find('.library-language-select-chat select');
    if (event.currentTarget.firstChild.classList.contains('active')) select.removeAttr('disabled');
    else select.prop('disabled', true);
  }
  async prepareMessage(document) {
    const html = this.chatBar;
    const icon = html.find('.library-language-select-chat i');
    const select = html.find('.library-language-select-chat select');
    if (icon[0].classList.contains('active')) {
      if (document.data.type == 1 || document.data.type == 2) {
        document.data.update({'type': CONST.CHAT_MESSAGE_TYPES.IC});
        if (select.val()) document.data.update({'flags.library-use.language': select.val()});
        await this.convertMessage(document);
      }
    }
  }
  async convertMessage(document) {
    if (document.data.type !== 2) return;
    if (document.getFlag('library-use', 'scrambled')) return document.getFlag('library-use', 'scramble');
    const language = document.getFlag('library-use', 'language') || null;
    if (!language) return;
    const original = document.data.content.replace(/<[^>]*>/g, ' ');
    const scramble = await library.convertText(original, language);
    document.data.update({'flags.library-use.original': original});
    document.data.update({'flags.library-use.scrambled': true});
    document.data.update({'flags.library-use.scramble': scramble});
  }
  async showMessageOnChat(message, html) {
    if (!message.getFlag('library-use', 'scrambled')) return;
    const content = html.find('.message-content');
    content.after(await renderTemplate('modules/library-use/templates/library-text-chat.html'));
    const label = html.find('.library-text-label');
    const original = message.data.flags['library-use']?.original || '';
    const scramble = message.data.flags['library-use']?.scramble || '';
    const language = await library.localizeLanguage(message.data.flags['library-use']?.language);
    game.users.forEach(async (user) => {
      if (user.isGM) return this.createTranslatableMessage(content, label, original, language);
      if (!user.character) return;
      if (game.user.id == user.id) {
        const knownLanguage = await this.checkKnowledge(user.character, language);
        const hasEnoughMythos = await this.checkKnowledge(user.character, 'mythos');
        if (language == game.i18n.localize('LIBRARY.LANGUAGES.Cthulhian') && hasEnoughMythos || knownLanguage) {
          return this.createTranslatableMessage(content, label, original, language);
        } else return this.generateScrambleMessage(content, label, scramble, language);
      }
    });
    await this.switchTranslationMode(content, label, original, scramble, language);
  }
  async createTranslatableMessage(content, label, original, language) {
    for (let i = 1; i < $(content).contents().get().length; i++) {
      if ($(content).contents().get(i).nodeName == 'BR') $(content).contents().get(i).remove();
      if ($(content).contents().get(i).nodeName == '#text') $(content).contents().get(i).nodeValue = '';
    }
    if (language == game.i18n.localize('LIBRARY.LANGUAGES.Cthulhian')) $(content).css({'font-family': ''});
    $(content).contents().get(0).nodeValue = original;
    $(label).removeClass('scramble');
    $(label).find('#source').empty().append(game.i18n.localize('LIBRARY.STANDARD.TranslatedFrom'));
    $(label).find('#library-language').empty().append(language);
    $(label).find('#visualize').empty().append(game.i18n.localize('LIBRARY.STANDARD.SeeOriginal'));
  }
  async switchTranslationMode(content, label, original, scramble, language) {
    const knownLanguage = await this.checkKnowledge(game.user.character, language);
    const hasEnoughMythos = await this.checkKnowledge(game.user.character, 'mythos');
    if (game.user.isGM || language == game.i18n.localize('LIBRARY.LANGUAGES.Cthulhian') && hasEnoughMythos || knownLanguage) {
      $(label).on('click', (event) => {
        event.preventDefault();
        const text = $(content).contents().get(0).nodeValue.trim();
        if (text == original) {
          if (language == game.i18n.localize('LIBRARY.LANGUAGES.Cthulhian') && game.settings.get('library-use', 'cthulhianShowMode') == 'runes') {
            $(content).css({'font-family': 'cthulhian'});
          }
          $(content).contents().get(0).nodeValue = scramble;
          $(label).addClass('scramble');
          $(label).find('#source').empty().append(game.i18n.localize('LIBRARY.STANDARD.OriginalTextIn'));
          $(label).find('#visualize').empty().append(game.i18n.localize('LIBRARY.STANDARD.SeeTranslation'));
        } else this.createTranslatableMessage(content, label, original, language);
      });
    }
  }
  async generateScrambleMessage(content, label, scramble, language) {
    for (let i = 1; i < $(content).contents().get().length; i++) {
      if ($(content).contents().get(i).nodeName == 'BR') $(content).contents().get(i).remove();
      if ($(content).contents().get(i).nodeName == '#text') $(content).contents().get(i).nodeValue = '';
    }
    if (language == game.i18n.localize('LIBRARY.LANGUAGES.Cthulhian') && game.settings.get('library-use', 'cthulhianShowMode') == 'runes') {
      $(content).css({'font-family': 'cthulhian'});
    }
    $(content).contents().get(0).nodeValue = scramble;
    $(label).addClass('scramble');
    $(label).find('#source').empty().append(game.i18n.localize('LIBRARY.STANDARD.UnknownLanguage'));
    $(label).find('#library-language').empty();
    $(label).find('#visualize').empty();
  }
  async checkKnowledge(character, knowledge) {
    if (game.user.isGM) return;
    let hasKnowledge = false;
    if (knowledge == 'mythos') {
      const cthulhuMythosSkill = character.getSkillsByName(game.i18n.localize('CoC7.CthulhuMythosName'));
      if (cthulhuMythosSkill.length !== 0 && cthulhuMythosSkill[0].value >= game.settings.get('library-use', 'mythosValueToCthulhian')) {
        hasKnowledge = true;
      }
    } else {
      const standard = await library.standardizeLanguage(knowledge);
      Object.entries(character.data.flags['library-use'].languages).forEach(([index, language]) => {
        if (standard == language) hasKnowledge = true;
      });
    }
    return hasKnowledge;
  }
  async renderJournalSheet(document, html) {
    await this.addLibraryEditor(document);
    const spans = document.element.find('span.library-journal');
    for (const span of spans.toArray()) {
      const original = span.textContent;
      const language = span.dataset.language;
      const scramble = await library.convertText(original, language);
      const knownLanguage = await this.checkKnowledge(game.user.character, language);
      const hasEnoughMythos = await this.checkKnowledge(game.user.character, 'mythos');
      if (game.user.isGM || language == 'cthulhian' && hasEnoughMythos || knownLanguage) {
        span.title = `${await library.localizeLanguage(language)}: ${scramble}`;
      } else {
        span.textContent = scramble;
        span.title = game.i18n.localize('LIBRARY.STANDARD.UnknownLanguage');
        if (language == 'cthulhian' && game.settings.get('library-use', 'cthulhianShowMode') == 'runes') {
          $(span).css({'font-family': 'cthulhian'});
        }
      }
    }
  }
  async addLibraryEditor(document) {
    if (document._libraryEditor) return;
    const method = document.activateEditor ? 'activateEditor' : '_createEditor';
    document._libraryActivateEditor = document[method];
    const languages = [];
    if (game.user.isGM) {
      Object.entries(library.supportedLanguages).map(([standard, localized]) => {
        languages.push({
          title: localized,
          inline: 'span',
          classes: 'library-journal',
          attributes: {
            'title': localized,
            'data-language': standard,
          },
        });
      });
    } else if (game.user.isOwner && game.user.character !== undefined) {
      Object.values(game.user.character.data.flags['library-use'].languages).forEach((language) => {
        Object.entries(library.supportedLanguages).forEach(([standard, localized]) => {
          if (language == standard) {
            languages.push({
              title: localized,
              inline: 'span',
              classes: 'library-journal',
              attributes: {
                'title': localized,
                'data-language': standard,
              },
            });
          };
        });
      });
    }
    document[method] = function(target, options, content) {
      if (options == undefined) return;
      options.style_formats = [...CONFIG.TinyMCE.style_formats, {
        title: 'Language',
        items: languages,
      }];
      options.formats = {
        removeformat: [
          {
            selector: 'b, strong, em, i, font, u, strike, sub, sup, dfn, code, samp, kbd, var, cite, mark, q, del, ins',
            remove: 'all',
            split: true,
            expand: false,
            block_expand: true,
            deep: true,
          },
          {
            selector: 'span',
            attributes: [
              'style',
              'class',
            ],
            remove: 'empty',
            split: true,
            expand: false,
            deep: true,
          },
          {
            selector: '*',
            attributes: [
              'style',
              'class',
            ],
            split: false,
            expand: false,
            deep: true,
          },
          {
            selector: 'span',
            classes: 'library-journal',
            attributes: ['title', 'class', 'data-language'],
            remove: 'all',
            split: true,
            expand: false,
            deep: true,
          },
        ],
      };
      return this._libraryActivateEditor(target, options, content);
    };
    document._libraryEditor = true;
  }
}
