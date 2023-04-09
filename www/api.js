const fetch = require("node-fetch");
// handling all api calls
function handleResponse(response){
  if (response){
    return response.json();
  }else{
    throw Error("Error handling response");
  }
}

const parseDate = (d) => {
  let date;
  if (d) {
    date = d < 10 ? `0${d}` : d
  };
  return date;
};

async function getPrice(asset){
  
  const api_key = process.env.API_KEY || '';
  
  const todayUnix = new Date();
  const today = `${todayUnix.getFullYear()}-${parseDate(todayUnix.getMonth())}-0${5}`
  if(api_key){
    try{
      const price = await fetch(`https://api.polygon.io/v1/open-close/${asset}/${today}?adjusted=true&apiKey=${api_key}`).then((res)=>handleResponse(res));
      console.log(price);
      return price; 
    }catch(e){
      console.log(e);
    }
  }
};

module.exports = { getPrice };
