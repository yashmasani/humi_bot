const fetch = require("node-fetch");
// handling all api calls
function handleResponse(response){
  if (response){
    return response.json();
  }else{
    throw Error("Error handling response");
  }
}

module.exports = {  };
