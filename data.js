/* data.js - external data source for the dashboard
   Provide a sample `window.TABLE_DATA` and a client-side CSV fetch/parse
   implementation. The browser will try to fetch the public Google Sheets CSV
   export and — if successful — replace `window.TABLE_DATA` and dispatch
   `tableDataLoaded` with detail { source:'live', ts:... }.
*/

window.TABLE_DATA = [
  { name: 'Aysel Quliyeva', fin: 'F001', datetime: '2025-10-20 09:15', role: 'Staff' },
  { name: 'Rauf Məmmədov', fin: 'F002', datetime: '2025-10-20 10:00', role: 'Guest' },
  { name: 'Nigar Əliyeva', fin: 'F003', datetime: '2025-10-21 11:45', role: 'Staff' },
  { name: 'Murad Hüseynov', fin: 'F004', datetime: '2025-10-21 08:25', role: 'Guest' },
  { name: 'Leyla Həsənova', fin: 'F005', datetime: '2025-10-22 14:10', role: 'Staff' },
  { name: 'Kamran Abbasov', fin: 'F006', datetime: '2025-10-22 16:05', role: 'Guest' },
  { name: 'Zeynəb İsmayılova', fin: 'F007', datetime: '2025-10-23 09:50', role: 'Staff' },
  { name: 'Emin Qasımov', fin: 'F008', datetime: '2025-10-23 12:00', role: 'Guest' },
  { name: 'Günel Səfərova', fin: 'F009', datetime: '2025-10-24 15:20', role: 'Staff' },
  { name: 'Elvin Rzayev', fin: 'F010', datetime: '2025-10-24 09:40', role: 'Guest' }
];

(function(){
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRljVOm2oMhnpj1FI-9yoMpMvMmy6x0R5Tfg9EwBExbUVSI998vz_IsvF5vhMC1mIN8-t80z-Z-VLN5/pub?output=csv';
  const FETCH_TIMEOUT = 8000; // ms

  // Robust CSV parser that handles quoted fields, escaped quotes and newlines in quotes.
  function parseCSV(text){
    const rows = [];
    let cur = '';
    let row = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++){
      const ch = text[i];
      const next = text[i+1];
      if (ch === '"'){
        if (inQuotes && next === '"'){
          cur += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === ',' && !inQuotes){
        row.push(cur);
        cur = '';
        continue;
      }
      if ((ch === '\n' || ch === '\r') && !inQuotes){
        if (ch === '\r' && text[i+1] === '\n') i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
        continue;
      }
      cur += ch;
    }
    if (cur !== '' || row.length > 0){ row.push(cur); rows.push(row); }
    const cleaned = rows.map(r => r.map(c => (c||'').trim()));
    if (cleaned.length === 0) return [];
    const headers = cleaned[0].map(h => (h||'').toString().toLowerCase());
    const out = [];
    for (let i = 1; i < cleaned.length; i++){
      const cols = cleaned[i];
      if (cols.every(c => c === '')) continue;
      const obj = {};
      for (let j = 0; j < headers.length; j++) obj[headers[j] || `col${j}`] = cols[j] || '';
      out.push(obj);
    }
    return out;
  }

  // Map a parsed row-object to our expected shape
  function mapRows(rows){
    return rows.map(r => {
      const keys = Object.keys(r);
      function findKey(term){
        term = term.toLowerCase();
        return keys.find(k => k.toLowerCase().indexOf(term) !== -1);
      }
      const nameKey = findKey('name') || findKey('full') || findKey('fullname');
      const finKey = findKey('fin') || findKey('id') || findKey('card');
      const dateKey = findKey('date');
      const timeKey = findKey('time');
      const datetimeKey = findKey('datetime') || findKey('date_time') || findKey('timestamp');
      const roleKey = findKey('role');

      const name = nameKey ? r[nameKey] : (r[ keys[0] ] || 'Unknown');
      const fin = finKey ? r[finKey] : '';
      const date = dateKey ? r[dateKey] : '';
      const time = timeKey ? r[timeKey] : '';
      const datetime = datetimeKey ? r[datetimeKey] : (date && time ? `${date} ${time}` : (date || time));
      const role = roleKey ? r[roleKey] : '';

      return { name: (name||'').toString(), fin: (fin||'').toString(), datetime: (datetime||'').toString(), role: (role||'').toString() };
    });
  }

  // Expose a fetch function so UI can retry; it returns { ok, source }
  window.fetchExternalData = async function(){
    try{ window.TABLE_DATA_SOURCE = 'loading'; window.dispatchEvent(new Event('tableDataLoading')); }catch(e){}
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let id;
    if (controller) id = setTimeout(()=>controller.abort(), FETCH_TIMEOUT);
    try{
      const res = await fetch(SHEET_CSV_URL, controller ? { signal: controller.signal } : {});
      if (controller) clearTimeout(id);
      if (!res.ok) throw new Error('network');
      const txt = await res.text();
      const parsed = parseCSV(txt);
      if (parsed && parsed.length > 0){
        const mapped = mapRows(parsed).filter(x => x.name || x.fin || x.datetime || x.role);
        if (mapped.length > 0){
          window.TABLE_DATA = mapped;
          window.TABLE_DATA_SOURCE = 'live';
          window.TABLE_DATA_LOADED_AT = new Date().toISOString();
          try{ window.dispatchEvent(new CustomEvent('tableDataLoaded',{ detail:{ source:'live', ts: window.TABLE_DATA_LOADED_AT } })); }catch(e){}
          return { ok:true, source:'live' };
        }
      }
    }catch(err){
      // fall through to fallback
    }finally{
      if (controller) clearTimeout(id);
    }
    // fallback: keep existing TABLE_DATA but mark source
    window.TABLE_DATA_SOURCE = 'sample';
    window.TABLE_DATA_LOADED_AT = new Date().toISOString();
    try{ window.dispatchEvent(new CustomEvent('tableDataLoaded',{ detail:{ source:'sample', ts: window.TABLE_DATA_LOADED_AT } })); }catch(e){}
    return { ok:false, source:'sample' };
  };

  // Kick off a background fetch (non-blocking). UI can call fetchExternalData() again.
  try{ window.fetchExternalData(); }catch(e){}

})();

