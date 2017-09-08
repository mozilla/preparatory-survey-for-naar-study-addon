const { utils: Cu } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "IndexedDB", "resource://gre/modules/IndexedDB.jsm");

this.EXPORTED_SYMBOLS = ["PingStorage"];

const DB_NAME = "share-button-study-pings";
const DB_OPTIONS = {
  version: 1,
  storage: "persistent",
};
const IN_MEMORY_PINGS = [];

/**
 * Cache the database connection so that it is shared among multiple operations.
 */
let databasePromise;
async function getDatabase() {
  if (!databasePromise) {
    databasePromise = IndexedDB.open(DB_NAME, DB_OPTIONS, (db) => {
      db.createObjectStore(DB_NAME, {
        keyPath: "id", // use id property ping object as the key
        autoIncrement: true,
      });
    });
  }
  return databasePromise;
}

/**
 * Get a transaction for interacting with the study store.
 *
 * NOTE: Methods on the store returned by this function MUST be called
 * synchronously, otherwise the transaction with the store will expire.
 * This is why the helper takes a database as an argument; if we fetched the
 * database in the helper directly, the helper would be async and the
 * transaction would expire before methods on the store were called.
 */
function getStore(db) {
  return db.objectStore(DB_NAME, "readwrite");
}

function pingCompare(ping1, ping2) {
  // pingData only includes one property: treatment or event
  const key1 = Object.keys(ping1)[0];
  const key2 = Object.keys(ping2)[0];

  return key1 === key2 && (ping1[key1] === ping2[key2]);
}

this.PingStorage = {
  async clear() {
    const db = await getDatabase();
    await getStore(db).clear();
  },

  async close() {
    if (databasePromise) {
      const promise = databasePromise;
      databasePromise = null;
      const db = await promise;
      await db.close();
    }
  },

  async getAllPings() {
    const db = await getDatabase();
    const allDBPings = await getStore(db).getAll();
    // Return union of allDBPings and IN_MEMORY_PINGS
    const union = [...allDBPings];
    for (const ping of IN_MEMORY_PINGS) {
      const searchIndex = allDBPings.findIndex(dbPing => pingCompare(dbPing, ping));
      if (searchIndex !== -1) { union.push(ping); }
    }
    return union;
  },

  async logPing(pingData) {
    const ping = Object.assign({ timestamp: new Date() }, pingData);
    IN_MEMORY_PINGS.push(ping);

    const db = await getDatabase();
    return getStore(db).add(ping);
  },
};
