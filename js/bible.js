const Bible = {
  cache: {},
  async fetchChapter(book, chapter) {
    const version = Storage.state.bibleVersion || 'KJV';
    const key = `${book}-${chapter}-${version}`;
    if (this.cache[key]) return this.cache[key];

    const filename = `${book}-${chapter}.json`;
    const url = `versions/${version}/${filename}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('File not found');
      }
      const data = await response.json();
      const text = data.verses.map(v => {
        const safeText = Bible.escapeHtml(v.text.trim());
        return `<p><span class="verse-number">${v.verse}</span>${safeText}</p>`;
      }).join('');

      const result = {
        reference: data.reference,
        text,
        copyright: data.copyright || 'Public domain'
      };
      this.cache[key] = result;
      return result;
    } catch (e) {
      throw new Error(`Unable to load ${book} ${chapter} in ${version}`);
    }
  },

  escapeHtml(str) {
    return str.replace(/[&<>"']/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[tag]));
  }
};
