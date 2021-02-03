const { makeWhereQuery } = require('./sql');

describe('makeWhereQuery', ()=>{
    test('works with name', ()=>{
        const { where, values } = makeWhereQuery({name:'n'});
        expect(where).toEqual('WHERE name iLIKE $1');
        expect(values).toEqual([ '%n%' ]);
    });
    test('works with minEmployees', ()=>{
        const { where, values } = makeWhereQuery({minEmployees: 100});
        expect(where).toEqual('WHERE num_employees > $1');
        expect(values).toEqual([ 100 ]);
    });
    test('works with maxEmployees', ()=>{
        const { where, values } = makeWhereQuery({maxEmployees: 100});
        expect(where).toEqual('WHERE num_employees < $1');
        expect(values).toEqual([ 100 ])
    });
    test('works with nothing passed', ()=>{
        const { where, values } = makeWhereQuery({});
        expect(where).toEqual('');
        expect(values).toEqual([]);
    });
});