import express, {Request, Response} from 'express';
import mysql from 'mysql';

//Create Express App
const app =  express(); 

//Make connection with planetscale DB
const connectionString = process.env.DATABASE_URL || '';
const connection = mysql.createConnection(connectionString);
connection.connect();

//2 routes, the first for all characters, second a character by id
app.get('/api/characters', (req: Request, res:Response) => {
    const query = 'SELECT * FROM Characters';
    connection.query(query, (err, rows) => {
        if(err) throw err;

        const retVal = {
            data: rows,
            message: rows.length === 0 ? 'No records found': null,
        }

        return res.send(rows);
    })
})

app.get('/api/characters/:id', (req: Request, res:Response) => {
    const {id} = req.params // deconstruct id form params
    const query = `SELECT * FROM Characters WHERE ID = ${id} LIMIT 1`;  //Build the query to select by id
    connection.query(query, (err, rows) => {
        if(err) throw err;
        const retVal = {
            data: rows.length > 0 ? rows[0] : null,
            message: rows.length === 0 ? 'No Record Found' : null, //Create a message in case we dont get a response
        }
        return res.send(retVal);
    })
   
})


//Start listening to port 
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("App is running")
})
