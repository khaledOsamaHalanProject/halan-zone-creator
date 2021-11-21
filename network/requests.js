export default {
  postData: async function (url = "", data = {}, headers) {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
    if (response.status === 200) return response.json();
    else {
      const responseTrial2 = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers,
      });
      return responseTrial2.json();
    }
  },
  getData: async function (url = "", headers) {
    const response = await fetch(url, { method: "GET", headers });
    if (response.status === 200) return response.json();
    else {
      const responseTrial2 = await fetch(url, { method: "GET", headers });
      return responseTrial2.json();
    }
  },
  deleteData: async function (url = "", headers) {
    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });
    if (response.status === 200) return response.json();
    else {
      const responseTrial2 = await fetch(url, {
        method: "DELETE",
        headers,
      });
      responseTrial2.json();
    }
  },
};
