import { Database, open } from 'sqlite';
import sqlite from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Category } from '../category/category';
import { Word } from '../word/word';

class DatabaseControl {
  private db!: Database<sqlite.Database, sqlite.Statement>;

  async init(filename: string): Promise<void> {
    const driver = sqlite.Database;
    this.db = await open({ filename, driver });
    await this.initTables();
  }

  async initTables(): Promise<void> {
    await this.db.run('CREATE TABLE IF NOT EXISTS categories (id TEXT, categoryName TEXT)');
    // eslint-disable-next-line max-len
    await this.db.run('CREATE TABLE IF NOT EXISTS words (id TEXT, idCategory TEXT, word TEXT, translation TEXT, image TEXT, sound TEXT)');
  }

  // Categories logic
  async addCategory(categoryName: string): Promise<string> {
    const stmt = await this.db.prepare('INSERT INTO categories (id, categoryName) VALUES (?, ?)');
    const id = uuidv4();
    stmt.run(id, categoryName);
    await stmt.finalize();
    return id;
  }

  async getCategory(by: string, value: string): Promise<Category> {
    const category = await this.db.get(`SELECT * FROM categories WHERE ${by}=?`, value);
    return category;
  }

  async updateCategory(id: string, categoryName: string): Promise<boolean> {
    const categoryExists = await this.getCategory('id', id);

    if (categoryExists) {
      const stmt = await this.db.prepare('UPDATE categories SET categoryName = ? WHERE id = ?');

      stmt.run(categoryName, id);
      await stmt.finalize();

      return true;
    }
    return false;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.deleteAllCategoryWords(id);
    const stmt = await this.db.prepare('DELETE FROM categories WHERE id = ?');
    stmt.run(id);
    await stmt.finalize();
  }

  async getCategories(): Promise<Category[]> {
    const categories = await this.db.all('SELECT * FROM categories');
    return categories;
  }

  // Categories words logic
  async addCategoryWord(
    idCategory: string,
    word: string,
    translation: string,
    image: string,
    sound: string,
  ): Promise<void> {
    const stmt = await this.db
      .prepare('INSERT INTO words (id, idCategory, word, translation, image, sound) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(uuidv4(), idCategory, word, translation, image, sound);
    await stmt.finalize();
  } //

  async getCategoryWord(by: string, value: string): Promise<Word> {
    const category = await this.db.get(`SELECT * FROM words WHERE ${by}=?`, value);
    return category;
  } //

  async updateCategoryWord(
    id: string,
    word: string,
    translation: string,
    image: string,
    sound: string,
  ): Promise<boolean> {
    const categoryWordExists = await this.getCategoryWord('id', id);

    if (categoryWordExists) {
      const stmt = await this.db
        .prepare('UPDATE words SET word = ?, translation = ?, image = ?, sound = ? WHERE id = ?');
      stmt.run(word, translation, image, sound, id);
      await stmt.finalize();
      return true;
    }
    return false;
  } //

  async deleteCategoryWord(id: string): Promise<void> {
    const stmt = await this.db.prepare('DELETE FROM words WHERE id = ?');
    stmt.run(id);
    await stmt.finalize();
  } //

  async deleteAllCategoryWords(idCategory: string): Promise<void> {
    const stmt = await this.db.prepare('DELETE FROM words WHERE idCategory = ?');
    stmt.run(idCategory);
    await stmt.finalize();
  }

  async getCategoryWords(idCategory: string): Promise<Word[]> {
    const categories = await this.db.all('SELECT * FROM words WHERE idCategory = ?', idCategory);
    return categories;
  }
}

export default DatabaseControl;
