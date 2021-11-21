export default {
  postData: async function (url = "", data = {}, headers) {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
    return response.json();
  },
  getData: async function (url = "", headers) {
    const response = await fetch(url, { method: "GET", headers });
    return response.json();
  },
  deleteData: async function (url = "", headers) {
    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });
    return response.json();
  },
};
