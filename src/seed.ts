import axios from "axios";
const cheerio = require('cheerio');
import mysql from "mysql";

//Make connection with planetscale DB
const connectionString = process.env.DATABASE_URL || '';
const connection = mysql.createConnection(connectionString);
connection.connect();


// axios request to get the page HTML
// then load it to cheerio to scrap the names of the characters
const getCharacterPageNames = async() => {
    const url = 'https://onepiece.fandom.com/wiki/List_of_Canon_Characters'
    const {data} = await axios.get(url);
    const $ = cheerio.load(data);
    const characterPageNames = [];
    const trs = $('.wikitable>tbody>tr');
    for(let i=0; i< trs.length; i++) {
        const tr = trs[i];
        const path : String = $(tr).find('td:nth-child(2)>a').attr('href') || '';
        
        const name : String = path.replace('/wiki/', '');
        characterPageNames.push(name);
    }
    characterPageNames.splice(0,2);
    return characterPageNames
}

// using the names we make request to each character page to get more info 
const getCharacterInfo = async (characterName : String, idx: Number) => {
    const baseUrl = 'https://onepiece.fandom.com/wiki/';
    const { data } = await axios.get(`${baseUrl}${characterName}`);
    const $ = cheerio.load(data);

    let name : String = characterName.replace('_', ' ');
    let status : String = $('div[data-source="status"]>.pi-data-value').text()
    let animeImg : String = $('.pi-image-thumbnail[alt="Anime"]').attr('src');
    let mangaImg : String = $('.pi-image-thumbnail[alt="Manga"]').attr('src');

    const characterInfo = {
        id :idx,
        name,
        status,
        animeImg,
        mangaImg,
    }

    return characterInfo;

}


//Load data to the DB
const loadCharacters = async () => {
    const characterPageNames = await getCharacterPageNames();
    // Resolve one promise each time

    // const characterInfoArr = [];
    // for(let i=0; i < characterPageNames.length; i++){
    //     const characterInfo = await getCharacterInfo(characterPageNames[i])
    //     characterInfoArr.push(characterInfo);
    //     console.dir(characterInfoArr);
    // }


    // Resolve all promises at once
    const characterInfoPromises = characterPageNames.map((characterName, idx )=> 
        getCharacterInfo(characterName, idx ))
        const characters = await Promise.all(characterInfoPromises);
        const values = characters.map(character => [character.id, character.name, character.status, character.animeImg, character.mangaImg])
        
        console.log({characters})

        const sql = "INSERT INTO Characters (id, name, status, animeImg, mangaImg) VALUES ?";
        connection.query(sql, [values], (err) => {
            if (err) {
                console.error('It didnt work')
            } else {
                console.log('DB populated')
            }
        })
}
loadCharacters();