var API = {
  base: '/api',
  async get(path) {
    try {
      var resp = await fetch(this.base + path);
      if (resp.ok) return await resp.json();
    } catch(e) {}
    return null;
  },
  async post(path, data) {
    try {
      var resp = await fetch(this.base + path, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      if (resp.ok) return await resp.json();
    } catch(e) {}
    return null;
  },
  async del(path) {
    try {
      var resp = await fetch(this.base + path, {method: 'DELETE'});
      return resp.ok;
    } catch(e) {}
    return false;
  }
};

// Fallback localStorage helper
var LS = {
  get(key) { return JSON.parse(localStorage.getItem(key) || 'null'); },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};
