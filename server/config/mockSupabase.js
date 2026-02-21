const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, '../data/db.json');
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

class MockQueryBuilder {
  constructor(table, getData, setData) {
    this.table = table;
    this.getData = getData; // Function returning array
    this.setData = setData; // Function taking array to save
    this.filters = [];
    this.sorts = [];
    this._limit = null;
    this._single = false;
    this.action = 'select'; // select, insert, update, delete
    this.payload = null;
    this.shouldReturnData = false;
  }

  select(columns = '*') {
    this.shouldReturnData = true;
    // In strict mock, we would parse columns. Here we return all.
    return this;
  }

  insert(rows) {
    this.action = 'insert';
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(updates) {
    this.action = 'update';
    this.payload = updates;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  ilike(column, pattern) {
    // Simple regex for LIKE %pattern%
    const regexStr = pattern.replace(/%/g, '.*');
    const regex = new RegExp(`^${regexStr}$`, 'i');
    this.filters.push((row) => {
      const val = row[column];
      return typeof val === 'string' && regex.test(val);
    });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.sorts.push({ column, ascending });
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  then(resolve, reject) {
    process.nextTick(() => {
      try {
        const currentData = this.getData();
        let resultData = [];
        let error = null;

        if (this.action === 'insert') {
          const newRows = this.payload.map((row) => ({
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            ...row,
          }));
          
          // Check uniqueness constraints (basic)
          // For users, check email
          if (this.table === 'users') {
             const emails = new Set(currentData.map(u => u.email));
             for (const row of newRows) {
               if (emails.has(row.email)) {
                 return resolve({ data: null, error: { message: 'User already exists', code: '23505' } });
               }
             }
          }

          const newData = [...currentData, ...newRows];
          this.setData(newData);
          resultData = newRows;
          // Implicitly return data for insert if select() was called? 
          // Supabase requires .select() to return data.
          // But if I return data when not requested, it usually doesn't hurt unless strict typing.
          // We will respect shouldReturnData for result shape.
        } else if (this.action === 'update') {
          const newData = currentData.map((row) => {
            if (this.filters.every((f) => f(row))) {
              const updated = { ...row, ...this.payload };
              resultData.push(updated);
              return updated;
            }
            return row;
          });
          this.setData(newData);
        } else if (this.action === 'delete') {
          const newData = currentData.filter((row) => {
            const match = this.filters.every((f) => f(row));
            if (match) {
              resultData.push(row); // Keep track of deleted for return
            }
            return !match;
          });
          this.setData(newData);
        } else {
          // SELECT
          resultData = currentData.filter((row) =>
            this.filters.every((f) => f(row))
          );
        }

        // Apply sorts (only for select or returned data)
        if (this.sorts.length > 0) {
          resultData.sort((a, b) => {
            for (const { column, ascending } of this.sorts) {
              if (a[column] < b[column]) return ascending ? -1 : 1;
              if (a[column] > b[column]) return ascending ? 1 : -1;
            }
            return 0;
          });
        }

        // Apply limit
        if (this._limit !== null && resultData.length > this._limit) {
          resultData = resultData.slice(0, this._limit);
        }

        // Apply single
        if (this._single) {
          if (resultData.length === 0) {
             // For select().single(), no rows is error PGRST116
             if (this.action === 'select') {
                // However, some controllers might expect null data and no error?
                // Supabase returns error.
                return resolve({ data: null, error: { message: 'Row not found', code: 'PGRST116' } });
             }
             return resolve({ data: null, error: null });
          }
          if (resultData.length > 1) {
            return resolve({ data: null, error: { message: 'Multiple rows found', code: 'PGRST116' } });
          }
          return resolve({ data: resultData[0], error: null });
        }

        // For insert/update/delete, only return data if select() was called
        if (this.action !== 'select' && !this.shouldReturnData) {
           return resolve({ data: null, error: null });
        }

        resolve({ data: resultData, error: null });
      } catch (err) {
        console.error('Mock DB Error:', err);
        resolve({ data: null, error: { message: err.message } });
      }
    });
  }
}

class MockSupabase {
  constructor() {
    this.dbPath = DB_FILE;
    this.cache = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
      }
    } catch (e) {
      console.error('Failed to load DB:', e);
    }
    return {
      users: [],
      daily_logs: [],
      workouts: [],
      exercises: [],
      workout_exercises: [],
    };
  }

  save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.cache, null, 2));
    } catch (e) {
      console.error('Failed to save DB:', e);
    }
  }

  from(table) {
    if (!this.cache[table]) {
      this.cache[table] = [];
    }
    return new MockQueryBuilder(
      table,
      () => this.cache[table],
      (newData) => {
        this.cache[table] = newData;
        this.save();
      }
    );
  }
}

module.exports = MockSupabase;
