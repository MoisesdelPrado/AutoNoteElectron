const express = require('express');
const cors = require('cors');
const puppeteer = require("puppeteer");
const bodyParser = require('body-parser');
//const Dictionary = require("./Dictionary.js");

const PORT = process.env.PORT || 4000; //backend routing port

const app = express();
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors({origin:"http://localhost:3000"}));
app.use(function(req, res, next) {
    const corsWhiteList = [
        "http://localhost:3000",
        "http://localhost:4000",
        "http://localhost:9222"
    ];
    if (corsWhiteList.indexOf(req.headers.origin) !== -1) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    }
    next();
});


//Store if KP holds degree for other functions to use
var MD_Degree;
var degreesKeywords;

//Route to activate puppeteer for Copy function
app.get('/', async() => {

const url = "https://veeva.io/profile/detail/604b35b0225ec6001c0540de";
const browserUrl = "http://127.0.0.1:9222";

    try {
    const browser = await puppeteer.connect({
        browserURL:browserUrl,
        defaultViewport:null
    });
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "networkidle0"
    });

        const englishNameTxt = await page.$$eval('h4.d-inline-block > a > span', 
        (elems) => {
            return elems.map(elem => elem.textContent);
        });


        const originalNameTxt = await page.$eval('h6',
        (elem) => {
            return elem.textContent;
        });


        const affiliationsTxt = await page.$$eval('body > dirt > dirt-profile > div > section > dirt-profile-detail > section > div > div.row.di-header-wrapper > div > div.row.di-info-footer > div:nth-child(4) > div > span', 
        (elems) => {
            return elems.map(elem => elem.textContent);
        });
        affiliationsTxt.shift();


        const commentBox = await page.$$eval('body > ngb-modal-window > div > div > div > div.modal-body > dirt-comment-list > section > div:nth-child(2) > div',
        (elems) => {
            return elems.map(elem => elem.textContent.trim());
        });

        
        //Find all that match regex in the comment box for KOL/KP tags 
        let affiliationRegex = /(?<=(KOL:\n?|KP:\n?)).*(?=(Namesake))?/gis;
        let commentAffiliationsSrc = [];
            commentBox.forEach(elems => {
                commentAffiliationsSrc.unshift(elems.match(affiliationRegex));
            })
        let commentAffiliations = commentAffiliationsSrc.flat(2).filter(n => n);

      

        const keywordsTxt = await page.$$eval('body > dirt > dirt-profile > div > section > dirt-profile-detail > section > div > div.row.di-header-wrapper > div > div.row.di-info-header > div.col-md-3.di-header-specialty > div:nth-child(1) > span',
        (elems) => {
            return elems.map(elem => elem.textContent.trim());
        });
        keywordsTxt.pop();


        const degrees = await page.$$eval('body > dirt > dirt-profile > div > section > dirt-profile-detail > section > div > div.row.di-header-wrapper > div > div.row.di-info-header > div.col-md-3.di-header-specialty > div.degree > span',
        (elems) => {
            return elems.map(elem => elem.textContent.trim());
        });
        degreesKeywords = degrees.map(elems => elems.split(' '));
        degreesKeywords.flat(2).filter(n => n);


        //Find all that match regex in the comment box for namesake tags 
        let namesakeRegex = /(Namesake[:s\n]?).*(?=(KOL|KP))?/gis;
        let namesakesSrc = [];
            commentBox.forEach(elems => {
                namesakesSrc.unshift(elems.match(namesakeRegex));
            })
        let namesakes = namesakesSrc.flat(2).filter(n => n);

    

        const kolIDTxt = await page.$eval('body > dirt > dirt-profile > div > section > dirt-profile-detail > section > div > div.row.di-header-wrapper > div > div.row.di-info-footer > div:nth-child(8) > div > span.di-bold',
        (elem) => {
            return elem.textContent;
        });


        if (degrees.includes('Doctor of Medicine (MD)')) {
            MD_Degree = true;
        } else {
            MD_Degree = false;
        }


        console.log(`
        ${englishNameTxt}          \n
        ${originalNameTxt}         \n
        ${affiliationsTxt}         \n
        ${keywordsTxt}             \n
        ${degreesKeywords}         \n
        ${kolIDTxt}                \n
        ${MD_Degree}               \n
        ${commentAffiliations}     \n
        ${namesakes}               \n
        `); 


    /*res.send({
        'englishName':englishNameTxt,
        'originalName':originalNameTxt,
        'commentAffiliations':[...affiliationsTxt, ...commentAffiliationsTxt],
        'keywords':keywordsTxt,
        'degrees':degreesTxt,
        'kolID':kolIDTxt,
        'namesakes':namesakesTxt,
    });


    await page.waitForTimeout(5000);
    await page.close();*/
    

    } catch (error) {
        console.log(error);
    }
});
