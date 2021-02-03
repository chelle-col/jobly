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
 * Takes in {name: value} 
 * Returns {where: string, values: []}
 */
function makeWhereQuery(data) {
  // Will return empty object without data
  if (Object.keys(data).length === 0) {
    return {
      where: '',
      values: []
    };
  }
  // Check min is not greater then max
  checkMinMax(data);
  // Check we have right keywords
  checkKeys(data);

  let index = 1;

  // Return like clause if serching for name
  const {
    nameQuery,
    nameValue,
    index1
  } = getNameQuery(data.name, index);

  // Return Min clause if min max
  const {
    minQuery,
    minValue,
    index2
  } = getMinQuery(data.minEmployees, index1);

  // Max clause if max
  const {
    maxQuery,
    maxValue
  } = getMaxQuery(data.maxValue, index2);

  // Filter out null values
  const phrases = [nameQuery, minQuery, maxQuery].filter(val =>{
    if(val) return val;
  });
  const values = [nameValue, minValue, maxValue].filter(val =>{
    if(val) return val;
  });;

  // Return everything
  return {
    where: `WHERE ` + phrases.join(' AND '),
    values: values
  };
}
function checkMinMax(data) {
  if (data.minEmployees) {
    if (data.maxEmployees) {
      if (data.minEmployees > data.maxEmployees) {
        throw new BadRequestError("Min Employees cannot be greater than Max employees");
      }
    }
  }
}

function checkKeys(data){
  if(!data.name && !data.minEmployees && !data.maxEmployees){
    throw new BadRequestError('Only sortable by name, minEmployees and maxEmployees');
  }
}

function getNameQuery(name, index) {
  if (name) {
    return {
      nameQuery: `name iLIKE $${index}`,
      nameValue: `%${name}%`,
      index1: index++
    };
  }else{
    return {
      nameQuery: null,
      nameValue: null,
      index1: index
    };
  }
}


function getMinQuery(minVal, index) {
  if (minVal) {
    return {
      minQuery: `num_employees > $${index}`,
      minValue: minVal,
      index2: index++
    }
  }else{
    return{
      minQuery: null,
      minValue: null,
      index2: index
    }
  }
}

function getMaxQuery(maxVal, index) {
  if (maxVal) {
    return {
      maxQuery: `num_employees < $${index}`,
      maxValue: maxVal,
      index3: index++
    }
  }else{
    return {
      maxQuery: null,
      maxValue: null,
      index3: index
    }
  }
}

module.exports = {
  sqlForPartialUpdate,
  makeWhereQuery
};