const client = require('../db');

function is_mysql_func(value)
{
    let pos = value.indexOf("TIMESTAMP");
    if (pos && pos > -1) return true;

    pos = value.indexOf("TIMESTAMPDIFF(");
    if (pos && pos > -1) return true;
    
    pos = value.indexOf("NOW(");
    if (pos && pos > -1) return true;

    return false;
}

async function execute_query(query)
{
    try {
        // await client.connect();
        let qry_res = await client.query(query);
        // await client.end();
        return qry_res?.rows;
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    insert: async function(table, tableData, return_key = '') {
        let columns = "";
        let values = "";
        for (let column in tableData) {
            let value = tableData[column];
            let sub_query = "";
            if (Array.isArray(value)) {
                if (typeof value["sub_query"] !== 'undefined') {
                    sub_query = value["sub_query"];
                }
            }

            columns += (columns == "") ? "" : ", ";
            columns += column;
            values += (values == "") ? "" : ", ";
            if (!value) {
                values += "null";
            } else if (typeof value == "string" && is_mysql_func(value)) {
                values += value;
            } else if (Array.isArray(value)) {
                values += "( " + sub_query + " )";
            } else {
                values += "'" + value + "'";
            }
        }
        let query = `INSERT INTO ${table} (${columns}) values (${values})`;
        if(return_key != ""){
            query += " RETURNING " + return_key;
        }
        let res = await execute_query(query);
        return res;
    },

    update: async function(table, tableData, whereData)
    {
        let columns_values = "";
        for (let column in tableData) {
            let value = tableData[column];

            columns_values += (columns_values == "") ? "" : ", ";

            let sub_query = "";
            if (Array.isArray(value)) {
                if (typeof value["sub_query"] !== 'undefined') {
                    sub_query = value["sub_query"];
                }
            }

            if (!value) {
                columns_values += `${column}= null `;
            } else if (typeof value == "string" && is_mysql_func(value)) {
                columns_values += `${column}=${value}`;
            } else if (Array.isArray(value)) {
                columns_values += `${column} = ( ${sub_query} )`;
            } else {
                columns_values += `${column}='${value}'`;
            }
        }

        let where = "";
        if (Array.isArray(whereData)) {
            where = "1=1";
            for (let wcolumn in whereData) {
                let wvalue = tableData[wcolumn];

                where += " AND ";
                let wsub_query = "";
                if (Array.isArray(wvalue)) {
                    if (typeof wvalue["sub_query"] !== 'undefined') {
                        wsub_query = wvalue["sub_query"];
                    }
                }

                if (typeof wvalue == "string" && is_mysql_func(wvalue)) {
                    where += `${wcolumn}=${wvalue}`;
                } else if (Array.isArray(wvalue)) {
                    where += `${wcolumn} = ( ${wsub_query} )`;
                } else {
                    where += `${wcolumn}='${wvalue}'`;
                }
            }
        } else {
            where = whereData;
        }
        let query = `UPDATE ${table} SET ${columns_values} WHERE ${where}`;
        return execute_query(query);
    },

    delete: async function(table, whereData)
    {
        let where = "";
        if (Array.isArray(whereData)) {
            where = "1=1";
            for (let wcolumn in whereData) {
                let wvalue = tableData[wcolumn];
                where += ` AND ${wcolumn}='${wvalue}'`;
            }
        } else {
            where = whereData;
        }
        let query = `DELETE FROM ${table} WHERE ${where}`;
        return execute_query(query);
    },

    execute: async function(query){
        let res = await execute_query(query);
        return res;
    },

    execute_single: async function(query){
        let res = await execute_query(query);
        return res[0];
    }
}