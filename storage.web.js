export const storage = {
  init() {},
  getAll() {
    try { return JSON.parse(localStorage.getItem('transacciones') || '[]'); }
    catch { return []; }
  },
  insert(miembro, monto, tipo, fecha) {
    const data = this.getAll();
    const nueva = { id: Date.now(), miembro, monto, tipo, fecha };
    localStorage.setItem('transacciones', JSON.stringify([nueva, ...data]));
  },
  getTasas() {
    try { return JSON.parse(localStorage.getItem('tasas') || '{}'); }
    catch { return {}; }
  },
  setTasa(miembro, tasa) {
    const tasas = this.getTasas();
    tasas[miembro] = tasa;
    localStorage.setItem('tasas', JSON.stringify(tasas));
  }
};