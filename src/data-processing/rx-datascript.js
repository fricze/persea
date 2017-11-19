import {datascript as ds, mori, helpers} from 'datascript-mori';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/distinctUntilChanged';

const {core: dscljs} = ds;
const {hashMap, vector, get, equals} = mori;
const {DB_AFTER, DB_BEFORE, TX_DATA, TX_META} = helpers;

function nextTx(tx$, ...tx) {
  tx$.next(tx);
}

function createTxStream() {
  return new ReplaySubject(10)
}

function connect(db) {
  const tx$ = createTxStream();
  const report$ = tx$
        .scan(
          (report, tx) => dscljs.with$(get(report, DB_AFTER), ...tx),
          hashMap(
            DB_AFTER, db,
            DB_BEFORE, db,
            TX_DATA, vector(),
            TX_META, `INITIAL`
          )
        );

  return {
    report$,
    tx$
  };
}

function createAnyQueryStream(queryFunc, distinctUntilChangedFunc = equals) {
  return function wrapper(reportOrDb$, ...rest) {
    return reportOrDb$
      .map(reportOrDb => {
        const val = queryFunc(
          dscljs.db_QMARK_(reportOrDb) ? reportOrDb : get(reportOrDb, DB_AFTER),
          ...rest
        )

        return val
      })
      .distinctUntilChanged(distinctUntilChangedFunc)
  }
}

const q$ = createAnyQueryStream(
  function q(db, query, ...sources) {
    return dscljs.q(query, db, ...sources)
  }
)
const entity$ = createAnyQueryStream(
  function entity(db, eid) {
    return dscljs.entity(db, eid)
  },
  () => false
)
const filter$ = createAnyQueryStream(
  function filter(db, filterFunc) {
    return dscljs.filter(db, filterFunc)
  }
)
const pull$ = createAnyQueryStream(
  function pull(db, selector, eid) {
    return dscljs.pull(db, selector, eid)
  }
)
const pullMany$ = createAnyQueryStream(
  function pullMany(db, selector, eids) {
    return dscljs.pull_many(db, selector, eids)
  }
)
const datoms$ = createAnyQueryStream(
  function datoms(db, ...args) {
    return dscljs.datoms(db, ...args)
  }
)
const seekDatoms$ = createAnyQueryStream(
  function seekDatoms(db, ...args) {
    return dscljs.seek_datoms(db, ...args)
  }
)
const indexRange$ = createAnyQueryStream(
  function indexRange(db, ...args) {
    return dscljs.index_range(db, ...args)
  }
)

export {
  createAnyQueryStream,
  connect,
  nextTx,
  q$,
  entity$,
  filter$,
  pull$,
  pullMany$,
  datoms$,
  seekDatoms$,
  indexRange$,
}
