const { options } = require("../app");
const {
  BadRequestError
} = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
// This function returns a string ready for placemnet into a SQL datatbase
// [dataToUpdate], jsToSql => optional names in javascript with the sql column name

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Just the keys to use as column names in the SQL string
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    //  Combine the collumn names with the SQL markers ie. (firstname=$1)
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // Return the string and the array of values to use in db.query()
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Find all with paramaters
 * 
 * Takes in {name: value} {name: "iLIKE"} {minEmployees: min_employees}
 * Returns {where: string, values: []}
 */
function makeWhereQuery(data, operators, jsToSql) {
  
  const dataKeys = Object.keys(data);

  // Will return empty object without data
  if (Object.keys(data).length === 0) {
    return {
      where: '',
      values: []
    };
  }

  // Uses getQuery to build a query string and values using 4 params
  // ( data, column, operator, index )
  const queryArray = dataKeys.map( (dataKey, idx) =>{
    return getQuery(data[dataKey], jsToSql[dataKey] || dataKey, operators[dataKey], idx + 1)
  })

  const phrases = queryArray.map( i => i.query);
  const values = queryArray.map( i => i.value);

  // Return everything
  return {
    where: `WHERE ` + phrases.join(' AND '),
    values: values
  };
}


function checkMinMax(data) {
  // Checks for min and maxEmployees might change to be more modular
  if (data.minEmployees) {
    if (data.maxEmployees) {
      if (data.minEmployees > data.maxEmployees) {
        throw new BadRequestError("Min Employees cannot be greater than Max employees");
      }
    }
  }
}

/** Checks the data against the keys passes in
 * 
 *   Throw error if there aren't any serchable terms and if there are non key terms
 */
function checkKeys(data, keysToCheck){
  const dataKeys = Object.keys(data);

  let hasAnyKeys = false;

  keysToCheck.forEach(key => {
    if(dataKeys.includes(key)){
      hasAnyKeys = true;
    }
  });

  keysToCheck.forEach(key =>{
    const index = dataKeys.indexOf(key);
    if(index > -1){
      dataKeys.splice(index, 1);
    }
  })

  if(!hasAnyKeys){
    throw new BadRequestError(`Only searchable by ${keysToCheck.join(', ')}`);
  }

  if(dataKeys.length > 0 ){
    throw new BadRequestError(`Please remove extra search terms ${dataKeys.join(', ')} and try again`)
  }
}

/** Builds a query string and value from given params
 * 
 *  Returns query: queryString value: value for string
 */
function getQuery(data, column, operator, index){
  let returnValue;

  if(operator === 'iLIKE'){
    returnValue = `%${data}%`
  } else{
    returnValue = data;
  }

  return {
    query: `${column} ${operator} $${index}`,
    value: returnValue
  }
};

module.exports = {
  sqlForPartialUpdate,
  makeWhereQuery,
  checkKeys,
  checkMinMax
};